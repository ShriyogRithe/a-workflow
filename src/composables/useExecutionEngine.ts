import { ref } from 'vue'
import type { Workflow, WorkflowNode, ExecutionContext, ExecutionResult } from '@/types'
import { ExecutionStatus, NodeType } from '@/types'
import { useWorkflowStore } from '@/stores/workflow'

export function useExecutionEngine() {
  const workflowStore = useWorkflowStore()
  const isExecuting = ref(false)
  const currentNodeId = ref<string | null>(null)
  let executionAborted = false

  // Simulate execution delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


  // Execute individual node
  const executeNode = async (node: WorkflowNode, context: ExecutionContext): Promise<ExecutionResult> => {
    const logs: string[] = []
    
    try {
      logs.push(`Starting execution of ${node.data.label}`)
      
      // Update node status to running
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.RUNNING, logs)
      
      // Simulate execution time
      await delay(1000 + Math.random() * 2000)
      
      // Check if execution was aborted
      if (executionAborted) {
        logs.push('Execution aborted')
        workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.ERROR, logs)
        return { success: false, error: 'Execution aborted', logs }
      }

      let result: any = {}

      // Execute based on node type
      switch (node.type) {
        case NodeType.MANUAL_TRIGGER:
          result = await executeManualTrigger(node, context)
          break
        case NodeType.WEBHOOK_TRIGGER:
          result = await executeWebhookTrigger(node, context)
          break
        case NodeType.HTTP_REQUEST:
          result = await executeHttpRequest(node, context)
          break
        case NodeType.EMAIL:
          result = await executeEmail(node, context)
          break
        case NodeType.SMS:
          result = await executeSms(node, context)
          break
        case NodeType.DELAY:
          result = await executeDelay(node, context)
          break
        case NodeType.CONDITION:
          result = await executeCondition(node, context)
          break
        case NodeType.TRANSFORM:
          result = await executeTransform(node, context)
          break
        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }

      logs.push(`Completed execution successfully`)
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.SUCCESS, logs)
      
      return { success: true, data: result, logs }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logs.push(`Execution failed: ${errorMessage}`)
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.ERROR, logs)
      
      return { success: false, error: errorMessage, logs }
    }
  }

  // Node execution implementations
  const executeManualTrigger = async (node: WorkflowNode, _context: ExecutionContext) => {
    return {
      triggered: true,
      timestamp: new Date().toISOString(),
      data: node.data.config
    }
  }

  const executeWebhookTrigger = async (node: WorkflowNode, _context: ExecutionContext) => {
    const config = node.data.config
    return {
      triggered: true,
      webhook_path: config.path,
      method: config.method,
      timestamp: new Date().toISOString(),
      data: { message: 'Webhook triggered' }
    }
  }

  const executeHttpRequest = async (node: WorkflowNode, _context: ExecutionContext) => {
    const config = node.data.config
    
    // Check for empty or invalid URL
    if (!config.url || config.url.trim() === '') {
      throw new Error('URL is required and cannot be empty')
    }
    
    try {
      // Make actual HTTP request using fetch API
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...parseHeaders(config.headers)
      }

      const requestOptions: RequestInit = {
        method: config.method || 'GET',
        headers,
        signal: AbortSignal.timeout((config.timeout || 30) * 1000) // Timeout in milliseconds
      }


      // Add body for non-GET requests
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        requestOptions.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body)
      }

      // Log the request details
      const logs: string[] = []
      logs.push(`Making ${config.method} request to ${config.url}`)
      logs.push(`Headers: ${JSON.stringify(headers)}`)
      if (requestOptions.body) {
        logs.push(`Body: ${requestOptions.body}`)
      }
      
      const startTime = Date.now()
      
      // Make the actual HTTP request
      const response = await fetch(config.url, requestOptions)
      
      const duration = Date.now() - startTime
      logs.push(`Request completed in ${duration}ms with status ${response.status}`)

      // Parse response
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseData
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json()
          logs.push('Response parsed as JSON')
        } catch {
          responseData = await response.text()
          logs.push('Failed to parse JSON, using text response')
        }
      } else {
        responseData = await response.text()
        logs.push('Response parsed as text')
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        url: config.url,
        method: config.method,
        duration,
        timestamp: new Date().toISOString()
      }

      // Log the response
      logs.push(`Response: ${JSON.stringify(result, null, 2)}`)
      
      // Store logs in the node for viewing
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.RUNNING, logs)

      // Check if request was successful
      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`)
      }

      return result

    } catch (error: unknown) {
      // Handle different types of errors
      let errorMessage = 'Unknown error occurred'
      
      if (error instanceof TypeError) {
        errorMessage = 'Network error - check URL and internet connection'
      } else if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = `Request timeout after ${config.timeout || 30} seconds`
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      throw new Error(`HTTP Request failed: ${errorMessage}`)
    }
  }

  // Helper function to parse headers from string/object
  const parseHeaders = (headers: any): Record<string, string> => {
    if (!headers) return {}
    
    if (typeof headers === 'string') {
      try {
        return JSON.parse(headers)
      } catch {
        return {}
      }
    }
    
    if (typeof headers === 'object') {
      return headers
    }
    
    return {}
  }

  const executeEmail = async (node: WorkflowNode, _context: ExecutionContext) => {
    const config = node.data.config
    
    try {
      // Log email attempt
      const logs: string[] = []
      
      // Validate required fields
      const requiredFields = ['to', 'subject', 'body']
      const missingFields: string[] = []
      
      requiredFields.forEach(field => {
        if (!config[field] || config[field].toString().trim() === '') {
          missingFields.push(field)
        }
      })
      
      if (missingFields.length > 0) {
        const error = `Missing required fields: ${missingFields.join(', ')}`
        logs.push(`Validation failed: ${error}`)
        throw new Error(error)
      }
      
      logs.push(`Email Provider: Nodemailer SMTP`)
      logs.push(`Recipient: ${config.to}`)
      logs.push(`Subject: ${config.subject}`)
      logs.push(`Body length: ${config.body.length} characters`)
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      logs.push(`Backend API: ${backendUrl}`)
      
      logs.push(`Sending email via Nodemailer backend...`)
      
      const emailPayload = {
        to: config.to,
        subject: config.subject,
        body: config.body,
        fromName: config.fromName || 'Workflow Builder',
        fromEmail: config.fromEmail,
        toName: config.toName,
        replyTo: config.replyTo
      }
      
      const backendResponse = await fetch(`${backendUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      })
      
      const responseData = await backendResponse.json()
      
      if (!backendResponse.ok) {
        logs.push(`Backend API error: ${responseData.error}`)
        throw new Error(`Failed to send email: ${responseData.error}`)
      }
      
      logs.push(`✅ Email sent successfully via Nodemailer`)
      logs.push(`📧 Message ID: ${responseData.messageId}`)
      logs.push(`📬 Delivered to: ${config.to}`)
      
      const emailResult = {
        sent: true,
        provider: 'nodemailer-smtp',
        to: config.to,
        subject: config.subject,
        body: config.body,
        messageId: responseData.messageId,
        status: 'delivered',
        timestamp: responseData.timestamp,
        response: responseData.response
      }
      
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.RUNNING, logs)
      
      return emailResult
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Email validation failed'
      throw new Error(`Email Error: ${errorMessage}`)
    }
  }

  const executeSms = async (node: WorkflowNode, _context: ExecutionContext) => {
    const config = node.data.config
    
    try {
      const logs: string[] = []
      logs.push(`Preparing SMS configuration`)
      
      const requiredFields = ['to', 'message']
      const missingFields: string[] = []
      
      requiredFields.forEach(field => {
        if (!config[field] || config[field].toString().trim() === '') {
          missingFields.push(field)
        }
      })
      
      if (missingFields.length > 0) {
        const error = `Missing required fields: ${missingFields.join(', ')}`
        logs.push(`Validation failed: ${error}`)
        throw new Error(error)
      }
      
      const smsProvider = config.provider || 'twilio'
      
      const mockMessageId = `SIM${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      const smsResult = {
        sent: true,
        provider: smsProvider,
        to: config.to,
        message: config.message,
        messageId: mockMessageId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        cost: '0.00',
        simulation: true,
        response: {
          sid: mockMessageId,
          status: 'sent',
          direction: 'outbound-api',
          body: config.message,
          to: config.to,
          from: config.from || '+15551234567', // Mock from number
          uri: `/2010-04-01/Accounts/SIMULATED/Messages/${mockMessageId}.json`
        }
      }
      
      logs.push(`📋 Simulated Response: ${JSON.stringify(smsResult, null, 2)}`)
      logs.push('✨ SMS simulation completed successfully')
      
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.RUNNING, logs)
      
      return smsResult
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'SMS validation failed'
      throw new Error(`SMS Error: ${errorMessage}`)
    }
  }


  const executeDelay = async (node: WorkflowNode, _context: ExecutionContext) => {
    const config = node.data.config
    const duration = config.duration || 1
    const unit = config.unit || 'seconds'
    
    let delayMs = duration * 1000 // default to seconds
    
    switch (unit) {
      case 'minutes':
        delayMs = duration * 60 * 1000
        break
      case 'hours':
        delayMs = duration * 60 * 60 * 1000
        break
      case 'days':
        delayMs = duration * 24 * 60 * 60 * 1000
        break
    }

    const actualDelay = Math.min(delayMs, 5000)
    await delay(actualDelay)

    return {
      delayed: true,
      duration: duration,
      unit: unit,
      actual_delay_ms: actualDelay
    }
  }

  const executeCondition = async (node: WorkflowNode, context: ExecutionContext) => {
    const config = node.data.config
    const logs: string[] = []

    try {
      // Parse conditions from JSON
      let conditions: any[]
      try {
        conditions = JSON.parse(config.conditions || '[]')
      } catch (error) {
        throw new Error('Invalid conditions JSON format')
      }

      if (!Array.isArray(conditions) || conditions.length === 0) {
        throw new Error('Conditions must be a non-empty array')
      }

      const logic = config.logic || 'AND'
      const dataSource = config.dataSource || 'previous'

      logs.push(`Evaluating ${conditions.length} condition(s) with ${logic} logic`)
      logs.push(`Data source: ${dataSource}`)

      // Get data for evaluation
      let evaluationData: any = {}
      switch (dataSource) {
        case 'previous':
          evaluationData = context.data || {}
          break
        case 'variables':
          evaluationData = context.variables || {}
          break
        case 'static':
          evaluationData = {}
          break
        default:
          evaluationData = context.data || {}
      }

      logs.push(`Evaluation data: ${JSON.stringify(evaluationData, null, 2)}`)

      // Evaluate each condition
      const results: boolean[] = []
      
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i]
        const { field, operator, value } = condition

        if (!field || !operator) {
          throw new Error(`Condition ${i + 1}: field and operator are required`)
        }

        const fieldValue = getNestedValue(evaluationData, field)
        const conditionResult = evaluateCondition(fieldValue, operator, value)
        
        results.push(conditionResult)
        logs.push(`Condition ${i + 1}: ${field} ${operator} ${value} -> ${fieldValue} = ${conditionResult}`)
      }

      // Apply logic operator
      let finalResult: boolean
      if (logic === 'AND') {
        finalResult = results.every(r => r === true)
      } else { // OR
        finalResult = results.some(r => r === true)
      }

      logs.push(`Final result: ${finalResult} (${logic} logic)`)

      // Update logs in the node
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.RUNNING, logs)

      return {
        condition: true,
        conditions: conditions,
        logic: logic,
        dataSource: dataSource,
        evaluationData: evaluationData,
        individualResults: results,
        result: finalResult,
        branch: finalResult ? 'true' : 'false',
        logs: logs
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Condition evaluation failed'
      logs.push(`Error: ${errorMessage}`)
      workflowStore.updateNodeExecutionStatus(node.id, ExecutionStatus.RUNNING, logs)
      throw new Error(`Condition Error: ${errorMessage}`)
    }
  }

  // Helper function to get nested object values using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Helper function to evaluate individual conditions
  const evaluateCondition = (fieldValue: any, operator: string, compareValue: any): boolean => {
    switch (operator) {
      case 'equals':
        return fieldValue == compareValue
      case 'not_equals':
        return fieldValue != compareValue
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue)
      case 'less_than':
        return Number(fieldValue) < Number(compareValue)
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(compareValue)
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(compareValue)
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase())
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase())
      case 'is_empty':
        return fieldValue === null || fieldValue === undefined || String(fieldValue).trim() === ''
      case 'is_not_empty':
        return fieldValue !== null && fieldValue !== undefined && String(fieldValue).trim() !== ''
      case 'is_null':
        return fieldValue === null || fieldValue === undefined
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined
      case 'in_array':
        try {
          const arrayValue = Array.isArray(compareValue) ? compareValue : JSON.parse(compareValue)
          return Array.isArray(arrayValue) && arrayValue.includes(fieldValue)
        } catch {
          return false
        }
      case 'not_in_array':
        try {
          const arrayValue = Array.isArray(compareValue) ? compareValue : JSON.parse(compareValue)
          return Array.isArray(arrayValue) && !arrayValue.includes(fieldValue)
        } catch {
          return false
        }
      case 'matches_regex':
        try {
          const regex = new RegExp(compareValue)
          return regex.test(String(fieldValue))
        } catch {
          return false
        }
      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }
  }

  const executeTransform = async (node: WorkflowNode, context: ExecutionContext) => {
    const config = node.data.config
    return {
      transformed: true,
      operation: config.operation,
      input: context.data,
      output: { ...context.data, transformed: true },
      timestamp: new Date().toISOString()
    }
  }

  // Enhanced execution function with branching support
  const executeWorkflow = async (workflow: Workflow) => {
    if (isExecuting.value) return

    try {
      isExecuting.value = true
      executionAborted = false
      workflowStore.startExecution()

      const executionContext: Record<string, any> = {}
      const executedNodes = new Set<string>()
      const conditionResults: Record<string, boolean> = {}

      // Find trigger nodes (nodes with no incoming edges)
      const triggerNodes = workflow.nodes.filter(node => 
        !workflow.edges.some(edge => edge.target === node.id)
      )

      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow')
      }

      // Execute workflow starting from each trigger
      for (const triggerNode of triggerNodes) {
        if (executionAborted) break
        
        await executeBranch(
          workflow,
          triggerNode.id,
          executionContext,
          executedNodes,
          conditionResults
        )
      }

    } catch (error) {
      console.error('Workflow execution failed:', error)
    } finally {
      isExecuting.value = false
      currentNodeId.value = null
      workflowStore.stopExecution()
    }
  }

  // Recursive function to execute a branch of the workflow
  const executeBranch = async (
    workflow: Workflow,
    nodeId: string,
    executionContext: Record<string, any>,
    executedNodes: Set<string>,
    conditionResults: Record<string, boolean>
  ): Promise<void> => {
    if (executionAborted || executedNodes.has(nodeId)) return

    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return

    // Mark node as executed
    executedNodes.add(nodeId)
    currentNodeId.value = nodeId

    // Get previous node data for context
    const previousNodeData = getPreviousNodeData(workflow, nodeId, executionContext)

    const context: ExecutionContext = {
      workflowId: workflow.id,
      nodeId: node.id,
      data: previousNodeData,
      variables: {}
    }

    // Execute the node
    const result = await executeNode(node, context)
    
    if (result.success) {
      executionContext[nodeId] = result.data
      
      // Handle condition node results
      if (node.type === NodeType.CONDITION && result.data?.result !== undefined) {
        conditionResults[nodeId] = result.data.result
      }

      // Find and execute next nodes
      const nextNodes = getNextNodes(workflow, nodeId, conditionResults)
      
      for (const nextNodeId of nextNodes) {
        if (executionAborted) break
        await executeBranch(workflow, nextNodeId, executionContext, executedNodes, conditionResults)
      }
    } else {
      console.error(`Node ${nodeId} failed:`, result.error)
      // Continue execution for other branches (optional: make configurable)
    }
  }

  // Get data from previous nodes
  const getPreviousNodeData = (
    workflow: Workflow,
    nodeId: string,
    executionContext: Record<string, any>
  ): any => {
    const incomingEdges = workflow.edges.filter(edge => edge.target === nodeId)
    
    if (incomingEdges.length === 0) {
      return {} // Trigger node
    }

    if (incomingEdges.length === 1) {
      const sourceNodeId = incomingEdges[0].source
      return executionContext[sourceNodeId] || {}
    }

    // Multiple incoming edges - merge data
    const mergedData: any = {}
    incomingEdges.forEach(edge => {
      const sourceData = executionContext[edge.source]
      if (sourceData) {
        Object.assign(mergedData, sourceData)
      }
    })

    return mergedData
  }

  // Get next nodes considering condition branches
  const getNextNodes = (
    workflow: Workflow,
    nodeId: string,
    conditionResults: Record<string, boolean>
  ): string[] => {
    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return []

    const outgoingEdges = workflow.edges.filter(edge => edge.source === nodeId)
    
    console.log(`Getting next nodes for ${nodeId}:`, {
      nodeType: node.type,
      outgoingEdges: outgoingEdges.map(e => ({ id: e.id, target: e.target, condition: e.condition, sourceHandle: e.sourceHandle })),
      conditionResult: conditionResults[nodeId]
    })

    // For non-condition nodes, return all connected nodes
    if (node.type !== NodeType.CONDITION) {
      return outgoingEdges.map(edge => edge.target)
    }

    // For condition nodes, filter based on the condition result
    const conditionResult = conditionResults[nodeId]
    if (conditionResult === undefined) {
      console.warn(`No condition result found for node ${nodeId}`)
      return []
    }

    console.log(`Condition result for node ${nodeId}:`, conditionResult)

    // Filter edges based on condition result
    const filteredEdges = outgoingEdges.filter(edge => {
      // Check both condition property and sourceHandle
      let edgeCondition = edge.condition
      if (!edgeCondition && edge.sourceHandle) {
        edgeCondition = edge.sourceHandle as 'true' | 'false'
      }
      
      console.log(`Checking edge ${edge.id}: condition=${edgeCondition}, sourceHandle=${edge.sourceHandle}, conditionResult=${conditionResult}`)
      
      if (!edgeCondition) {
        // If no condition specified on edge, treat as 'true' branch
        console.log(`No condition on edge, treating as true branch. Result: ${conditionResult === true}`)
        return conditionResult === true
      }
      
      const shouldFollow = edgeCondition === (conditionResult ? 'true' : 'false')
      console.log(`Edge condition check: ${edgeCondition} === ${conditionResult ? 'true' : 'false'} -> ${shouldFollow}`)
      return shouldFollow
    })

    console.log(`Filtered edges for node ${nodeId}:`, filteredEdges.map(e => ({ id: e.id, target: e.target, condition: e.condition })))
    
    return filteredEdges.map(edge => edge.target)
  }

  const stopExecution = () => {
    executionAborted = true
    isExecuting.value = false
    currentNodeId.value = null
  }

  return {
    isExecuting,
    currentNodeId,
    executeWorkflow,
    stopExecution
  }
}
