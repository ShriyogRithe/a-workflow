import localforage from 'localforage'
import type { Workflow } from '@/types'
import { useWorkflowStore } from '@/stores/workflow'

const WORKFLOWS_KEY = 'workflow_builder_workflows'
const SETTINGS_KEY = 'workflow_builder_settings'

// Configure localforage
localforage.config({
  name: 'WorkflowBuilder',
  version: 1.0,
  storeName: 'workflows',
  description: 'Workflow Builder storage'
})

export function usePersistence() {
  const workflowStore = useWorkflowStore()

  // Save workflow to persistent storage
  const saveWorkflowToPersistence = async (workflow: Workflow): Promise<void> => {
    try {
      // Get existing workflows
      const existingWorkflows = await loadWorkflowsFromStorage()
      
      // Update or add the workflow
      const existingIndex = existingWorkflows.findIndex(w => w.id === workflow.id)
      
      if (existingIndex >= 0) {
        existingWorkflows[existingIndex] = workflow
      } else {
        existingWorkflows.push(workflow)
      }
      
      // Save back to storage
      await localforage.setItem(WORKFLOWS_KEY, existingWorkflows)
      
      console.log(`Workflow "${workflow.name}" saved successfully`)
    } catch (error) {
      console.error('Failed to save workflow:', error)
      throw error
    }
  }

  // Load workflows from persistent storage
  const loadWorkflowsFromStorage = async (): Promise<Workflow[]> => {
    try {
      const workflows = await localforage.getItem<Workflow[]>(WORKFLOWS_KEY)
      return workflows || []
    } catch (error) {
      console.error('Failed to load workflows:', error)
      return []
    }
  }

  // Load workflows and update store
  const loadWorkflowsFromPersistence = async (): Promise<void> => {
    try {
      const workflows = await loadWorkflowsFromStorage()
      
      // Convert date strings back to Date objects
      const processedWorkflows = workflows.map(workflow => ({
        ...workflow,
        createdAt: new Date(workflow.createdAt),
        updatedAt: new Date(workflow.updatedAt)
      }))
      
      workflowStore.workflows = processedWorkflows
      console.log(`Loaded ${processedWorkflows.length} workflows from storage`)
    } catch (error) {
      console.error('Failed to load workflows from persistence:', error)
    }
  }

  // Delete workflow from persistent storage
  const deleteWorkflowFromPersistence = async (workflowId: string): Promise<void> => {
    try {
      const existingWorkflows = await loadWorkflowsFromStorage()
      const filteredWorkflows = existingWorkflows.filter(w => w.id !== workflowId)
      
      await localforage.setItem(WORKFLOWS_KEY, filteredWorkflows)
      console.log(`Workflow ${workflowId} deleted successfully`)
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      throw error
    }
  }

  // Export workflow as JSON
  const exportWorkflow = (workflow: Workflow): string => {
    return JSON.stringify(workflow, null, 2)
  }

  // Import workflow from JSON
  const importWorkflow = async (jsonString: string): Promise<Workflow> => {
    try {
      const workflow = JSON.parse(jsonString) as Workflow
      
      // Validate required fields
      if (!workflow.id || !workflow.name || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
        throw new Error('Invalid workflow format')
      }
      
      // Update timestamps
      workflow.updatedAt = new Date()
      if (!workflow.createdAt) {
        workflow.createdAt = new Date()
      } else {
        workflow.createdAt = new Date(workflow.createdAt)
      }
      
      // Save to persistence
      await saveWorkflowToPersistence(workflow)
      
      return workflow
    } catch (error) {
      console.error('Failed to import workflow:', error)
      throw new Error('Invalid workflow format or corrupted data')
    }
  }

  // Auto-save functionality
  let autoSaveTimer: number | null = null
  
  const enableAutoSave = (intervalMs: number = 30000) => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }
    
    autoSaveTimer = window.setInterval(async () => {
      if (workflowStore.currentWorkflow) {
        try {
          workflowStore.saveWorkflow()
          await saveWorkflowToPersistence(workflowStore.currentWorkflow)
          console.log('Auto-saved workflow')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, intervalMs)
  }

  const disableAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // Save user settings
  const saveSettings = async (settings: Record<string, any>): Promise<void> => {
    try {
      await localforage.setItem(SETTINGS_KEY, settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Load user settings
  const loadSettings = async (): Promise<Record<string, any>> => {
    try {
      const settings = await localforage.getItem<Record<string, any>>(SETTINGS_KEY)
      return settings || {}
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {}
    }
  }

  // Clear all data
  const clearAllData = async (): Promise<void> => {
    try {
      await localforage.clear()
      workflowStore.workflows = []
      workflowStore.currentWorkflow = null
      workflowStore.selectedNodeId = null
      console.log('All data cleared successfully')
    } catch (error) {
      console.error('Failed to clear data:', error)
      throw error
    }
  }

  // Get storage usage info
  const getStorageInfo = async () => {
    try {
      const workflows = await loadWorkflowsFromStorage()
      const settings = await loadSettings()
      
      return {
        workflowCount: workflows.length,
        totalSize: JSON.stringify({ workflows, settings }).length,
        lastUpdated: workflows.reduce((latest, workflow) => {
          const updated = new Date(workflow.updatedAt)
          return updated > latest ? updated : latest
        }, new Date(0))
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        workflowCount: 0,
        totalSize: 0,
        lastUpdated: null
      }
    }
  }

  return {
    saveWorkflowToPersistence,
    loadWorkflowsFromPersistence,
    deleteWorkflowFromPersistence,
    exportWorkflow,
    importWorkflow,
    enableAutoSave,
    disableAutoSave,
    saveSettings,
    loadSettings,
    clearAllData,
    getStorageInfo
  }
}
