<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Load Workflow</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="workflows.length === 0" class="text-center py-12">
          <FolderIcon class="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Workflows Found</h3>
          <p class="text-gray-500">Create your first workflow to get started.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="workflow in workflows"
            :key="workflow.id"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="selectWorkflow(workflow.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  {{ workflow.name }}
                </h3>
                <p v-if="workflow.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
                  {{ workflow.description }}
                </p>
                
                <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{{ workflow.nodes.length }} nodes</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>{{ workflow.edges.length }} connections</span>
                  </div>
                  <span>Updated {{ formatDate(workflow.updatedAt) }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 ml-4">
                <button
                  @click.stop="exportWorkflow(workflow)"
                  class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Export"
                >
                  <ArrowDownTrayIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="duplicateWorkflow(workflow)"
                  class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon class="w-4 h-4" />
                </button>
                <button
                  @click.stop="deleteWorkflow(workflow.id)"
                  class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileImport"
          />
          <button
            @click="fileInput?.click()"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <ArrowUpTrayIcon class="w-4 h-4" />
            Import
          </button>
          <button
            @click="clearAllWorkflows"
            class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <TrashIcon class="w-4 h-4" />
            Clear All
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  XMarkIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { useWorkflowStore } from '@/stores/workflow'
import { usePersistence } from '@/composables/usePersistence'
import type { Workflow } from '@/types'
import { v4 as uuidv4 } from 'uuid'

defineEmits<{
  close: []
}>()

const workflowStore = useWorkflowStore()
const { 
  exportWorkflow: exportWorkflowData, 
  importWorkflow, 
  deleteWorkflowFromPersistence, 
  clearAllData 
} = usePersistence()

const fileInput = ref<HTMLInputElement>()

const workflows = computed(() => workflowStore.workflows)

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

const selectWorkflow = (workflowId: string) => {
  workflowStore.loadWorkflow(workflowId)
  // Close modal after loading
  setTimeout(() => {
    const event = new Event('close')
    document.dispatchEvent(event)
  }, 100)
}

const exportWorkflow = (workflow: Workflow) => {
  try {
    const jsonData = exportWorkflowData(workflow)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflow.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log(`Exported workflow: ${workflow.name}`)
  } catch (error) {
    console.error('Failed to export workflow:', error)
    alert('Failed to export workflow. Please try again.')
  }
}

const duplicateWorkflow = async (workflow: Workflow) => {
  try {
    const duplicated: Workflow = {
      ...JSON.parse(JSON.stringify(workflow)),
      id: uuidv4(),
      name: `${workflow.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Generate new IDs for nodes and edges
    const nodeIdMap = new Map<string, string>()
    duplicated.nodes = duplicated.nodes.map(node => {
      const newId = uuidv4()
      nodeIdMap.set(node.id, newId)
      return { ...node, id: newId }
    })
    
    duplicated.edges = duplicated.edges.map(edge => ({
      ...edge,
      id: uuidv4(),
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
    }))
    
    // Add to store
    workflowStore.workflows.push(duplicated)
    
    console.log(`Duplicated workflow: ${workflow.name}`)
  } catch (error) {
    console.error('Failed to duplicate workflow:', error)
    alert('Failed to duplicate workflow. Please try again.')
  }
}

const deleteWorkflow = async (workflowId: string) => {
  const workflow = workflows.value.find(w => w.id === workflowId)
  if (!workflow) return
  
  const confirmDelete = confirm(`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`)
  if (!confirmDelete) return
  
  try {
    await deleteWorkflowFromPersistence(workflowId)
    workflowStore.deleteWorkflow(workflowId)
    console.log(`Deleted workflow: ${workflow.name}`)
  } catch (error) {
    console.error('Failed to delete workflow:', error)
    alert('Failed to delete workflow. Please try again.')
  }
}

const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const workflow = await importWorkflow(text)
    
    // Add to store
    workflowStore.workflows.push(workflow)
    
    console.log(`Imported workflow: ${workflow.name}`)
    alert('Workflow imported successfully!')
    
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Failed to import workflow:', error)
    alert('Failed to import workflow. Please check the file format and try again.')
  }
}

const clearAllWorkflows = async () => {
  const confirmClear = confirm('Are you sure you want to delete ALL workflows? This action cannot be undone.')
  if (!confirmClear) return
  
  try {
    await clearAllData()
    console.log('Cleared all workflows')
  } catch (error) {
    console.error('Failed to clear workflows:', error)
    alert('Failed to clear workflows. Please try again.')
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
