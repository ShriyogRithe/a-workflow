import { defineStore } from 'pinia'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'
import type { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  AppState, 
  NodeType
} from '@/types'
import { ExecutionStatus } from '@/types'

export const useWorkflowStore = defineStore('workflow', {
  state: (): AppState => ({
    currentWorkflow: null,
    workflows: [],
    selectedNodeId: null,
    isExecuting: false,
    executionLogs: {},
    history: {
      past: [],
      future: [],
    },
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
  }),

  getters: {
    selectedNode: (state) => {
      if (!state.currentWorkflow || !state.selectedNodeId) return null
      return state.currentWorkflow.nodes.find(node => node.id === state.selectedNodeId) || null
    },
    
    canUndo: (state) => state.history.past.length > 0,
    canRedo: (state) => state.history.future.length > 0,
    
    workflowNodes: (state) => state.currentWorkflow?.nodes || [],
    workflowEdges: (state) => state.currentWorkflow?.edges || [],
  },

  actions: {
    // History Management
    saveToHistory() {
      if (!this.currentWorkflow) return
      
      this.history = produce(this.history, draft => {
        draft.past.push(JSON.parse(JSON.stringify(this.currentWorkflow)))
        draft.future = [] // Clear future when new action is performed
        
        // Limit history size
        if (draft.past.length > 50) {
          draft.past.shift()
        }
      })
    },

    undo() {
      if (this.history.past.length === 0) return
      
      const previousState = this.history.past[this.history.past.length - 1]
      
      this.history = produce(this.history, draft => {
        if (this.currentWorkflow) {
          draft.future.push(JSON.parse(JSON.stringify(this.currentWorkflow)))
        }
        draft.past.pop()
      })
      
      this.currentWorkflow = previousState
    },

    redo() {
      if (this.history.future.length === 0) return
      
      const nextState = this.history.future[this.history.future.length - 1]
      
      this.history = produce(this.history, draft => {
        if (this.currentWorkflow) {
          draft.past.push(JSON.parse(JSON.stringify(this.currentWorkflow)))
        }
        draft.future.pop()
      })
      
      this.currentWorkflow = nextState
    },

    // Workflow Management
    createNewWorkflow(name: string = 'New Workflow') {
      this.saveToHistory()
      
      const workflow: Workflow = {
        id: uuidv4(),
        name,
        description: '',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      this.currentWorkflow = workflow
      this.selectedNodeId = null
    },

    saveWorkflow() {
      if (!this.currentWorkflow) return
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        draft.updatedAt = new Date()
      })
      
      const existingIndex = this.workflows.findIndex(w => w.id === this.currentWorkflow!.id)
      
      if (existingIndex >= 0) {
        this.workflows[existingIndex] = JSON.parse(JSON.stringify(this.currentWorkflow))
      } else {
        this.workflows.push(JSON.parse(JSON.stringify(this.currentWorkflow)))
      }
    },

    loadWorkflow(workflowId: string) {
      const workflow = this.workflows.find(w => w.id === workflowId)
      if (workflow) {
        this.saveToHistory()
        this.currentWorkflow = JSON.parse(JSON.stringify(workflow))
        this.selectedNodeId = null
        
        // Restore viewport
        if (workflow.viewport) {
          this.viewport = { ...workflow.viewport }
        }
      }
    },

    deleteWorkflow(workflowId: string) {
      this.workflows = this.workflows.filter(w => w.id !== workflowId)
      if (this.currentWorkflow?.id === workflowId) {
        this.currentWorkflow = null
        this.selectedNodeId = null
      }
    },

    // Node Management
    addNode(nodeType: NodeType, position: { x: number; y: number }, data: any = {}) {
      if (!this.currentWorkflow) return
      
      this.saveToHistory()
      
      const nodeId = uuidv4()
      const newNode: WorkflowNode = {
        id: nodeId,
        type: nodeType,
        position,
        data: {
          label: data.label || nodeType.replace('_', ' ').toUpperCase(),
          type: nodeType,
          config: data.config || {},
          description: data.description || '',
        },
        executionStatus: ExecutionStatus.PENDING,
        executionLogs: [],
      }
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        draft.nodes.push(newNode)
        draft.updatedAt = new Date()
      })
      
      this.selectedNodeId = nodeId
    },

    updateNode(nodeId: string, updates: Partial<WorkflowNode>) {
      if (!this.currentWorkflow) return
      
      this.saveToHistory()
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        const nodeIndex = draft.nodes.findIndex(n => n.id === nodeId)
        if (nodeIndex >= 0) {
          Object.assign(draft.nodes[nodeIndex], updates)
          draft.updatedAt = new Date()
        }
      })
    },

    deleteNode(nodeId: string) {
      if (!this.currentWorkflow) return
      
      this.saveToHistory()
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        // Remove node
        draft.nodes = draft.nodes.filter(n => n.id !== nodeId)
        
        // Remove connected edges
        draft.edges = draft.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
        
        draft.updatedAt = new Date()
      })
      
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null
      }
    },

    duplicateNode(nodeId: string) {
      if (!this.currentWorkflow) return
      
      const node = this.currentWorkflow.nodes.find(n => n.id === nodeId)
      if (!node) return
      
      this.saveToHistory()
      
      const newNodeId = uuidv4()
      const duplicatedNode: WorkflowNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: newNodeId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: {
          ...node.data,
          label: `${node.data.label} (Copy)`,
        },
      }
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        draft.nodes.push(duplicatedNode)
        draft.updatedAt = new Date()
      })
      
      this.selectedNodeId = newNodeId
    },

    // Edge Management
    addEdge(edge: Omit<WorkflowEdge, 'id'>) {
      if (!this.currentWorkflow) return
      
      // Prevent duplicate edges
      const exists = this.currentWorkflow.edges.some(e => 
        e.source === edge.source && 
        e.target === edge.target &&
        e.sourceHandle === edge.sourceHandle &&
        e.targetHandle === edge.targetHandle
      )
      
      if (exists) return
      
      this.saveToHistory()
      
      const newEdge: WorkflowEdge = {
        id: uuidv4(),
        ...edge,
      }
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        draft.edges.push(newEdge)
        draft.updatedAt = new Date()
      })
    },

    updateEdge(edgeId: string, updates: Partial<WorkflowEdge>) {
      if (!this.currentWorkflow) return
      
      this.saveToHistory()
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        const edgeIndex = draft.edges.findIndex(e => e.id === edgeId)
        if (edgeIndex >= 0) {
          Object.assign(draft.edges[edgeIndex], updates)
          draft.updatedAt = new Date()
        }
      })
    },

    deleteEdge(edgeId: string) {
      if (!this.currentWorkflow) return
      
      this.saveToHistory()
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        draft.edges = draft.edges.filter(e => e.id !== edgeId)
        draft.updatedAt = new Date()
      })
    },

    // Selection Management
    selectNode(nodeId: string | null) {
      this.selectedNodeId = nodeId
    },

    // Viewport Management
    updateViewport(viewport: { x: number; y: number; zoom: number }) {
      this.viewport = { ...viewport }
      
      if (this.currentWorkflow) {
        this.currentWorkflow = produce(this.currentWorkflow, draft => {
          draft.viewport = { ...viewport }
        })
      }
    },

    // Execution Management
    startExecution() {
      this.isExecuting = true
      this.executionLogs = {}
      
      if (this.currentWorkflow) {
        this.currentWorkflow = produce(this.currentWorkflow, draft => {
          draft.nodes.forEach(node => {
            node.executionStatus = ExecutionStatus.PENDING
            node.executionLogs = []
          })
        })
      }
    },

    stopExecution() {
      this.isExecuting = false
    },

    updateNodeExecutionStatus(nodeId: string, status: ExecutionStatus, logs: string[] = []) {
      if (!this.currentWorkflow) return
      
      this.currentWorkflow = produce(this.currentWorkflow, draft => {
        const node = draft.nodes.find(n => n.id === nodeId)
        if (node) {
          node.executionStatus = status
          node.executionLogs = [...(node.executionLogs || []), ...logs]
        }
      })
      
      // Also update global execution logs
      this.executionLogs = produce(this.executionLogs, draft => {
        if (!draft[nodeId]) {
          draft[nodeId] = []
        }
        draft[nodeId].push(...logs)
      })
    },
  },
})
