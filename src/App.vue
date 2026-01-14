<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold text-gray-900">Workflow Builder</h1>
          <div v-if="workflowStore.currentWorkflow" class="text-sm text-gray-500">
            {{ workflowStore.currentWorkflow.name }}
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- Undo/Redo -->
          <button
            @click="workflowStore.undo()"
            :disabled="!workflowStore.canUndo"
            class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <ArrowUturnLeftIcon class="w-5 h-5" />
          </button>
          
          <button
            @click="workflowStore.redo()"
            :disabled="!workflowStore.canRedo"
            class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <ArrowUturnRightIcon class="w-5 h-5" />
          </button>
          
          <div class="w-px h-6 bg-gray-300 mx-2"></div>
          
          <!-- Save/Load -->
          <button
            @click="saveWorkflow"
            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            :disabled="!workflowStore.currentWorkflow"
          >
            Save
          </button>
          
          <button
            @click="showWorkflowList = true"
            class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Load
          </button>
          
          <button
            @click="createNewWorkflow"
            class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            New
          </button>
          
          <div class="w-px h-6 bg-gray-300 mx-2"></div>
          
          <!-- Execution Controls -->
          <button
            @click="startExecution"
            :disabled="!workflowStore.currentWorkflow || workflowStore.isExecuting"
            class="p-2 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run Preview"
          >
            <PlayIcon class="w-5 h-5" />
          </button>
          
          <button
            @click="stopExecution"
            :disabled="!workflowStore.isExecuting"
            class="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stop Execution"
          >
            <StopIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Node Palette -->
      <aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <NodePalette />
      </aside>

      <!-- Canvas Area -->
      <main class="flex-1 relative">
        <WorkflowCanvas />
      </main>

      <!-- Configuration Panel -->
      <aside 
        v-if="workflowStore.selectedNodeId"
        class="w-80 bg-white border-l border-gray-200 overflow-y-auto"
      >
        <NodeConfigPanel />
      </aside>
    </div>

    <!-- Workflow List Modal -->
    <WorkflowListModal 
      v-if="showWorkflowList"
      @close="showWorkflowList = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  ArrowUturnLeftIcon, 
  ArrowUturnRightIcon, 
  PlayIcon, 
  StopIcon 
} from '@heroicons/vue/24/outline'
import { useWorkflowStore } from '@/stores/workflow'
import { useExecutionEngine } from '@/composables/useExecutionEngine'
import { usePersistence } from '@/composables/usePersistence'
import NodePalette from '@/components/NodePalette.vue'
import WorkflowCanvas from '@/components/WorkflowCanvas.vue'
import NodeConfigPanel from '@/components/NodeConfigPanel.vue'
import WorkflowListModal from '@/components/WorkflowListModal.vue'

const workflowStore = useWorkflowStore()
const { executeWorkflow, stopExecution: stopWorkflowExecution } = useExecutionEngine()
const { saveWorkflowToPersistence, loadWorkflowsFromPersistence } = usePersistence()

const showWorkflowList = ref(false)

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey
  
  if (isCmdOrCtrl && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    workflowStore.undo()
  } else if (isCmdOrCtrl && (event.key === 'Z' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault()
    workflowStore.redo()
  } else if (isCmdOrCtrl && event.key === 's') {
    event.preventDefault()
    saveWorkflow()
  } else if (isCmdOrCtrl && event.key === 'n') {
    event.preventDefault()
    createNewWorkflow()
  } else if (event.key === 'Escape') {
    workflowStore.selectNode(null)
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    if (workflowStore.selectedNodeId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      workflowStore.deleteNode(workflowStore.selectedNodeId)
    }
  }
}

// Actions
const createNewWorkflow = () => {
  const name = prompt('Enter workflow name:', 'New Workflow')
  if (name) {
    workflowStore.createNewWorkflow(name)
  }
}

const saveWorkflow = async () => {
  if (workflowStore.currentWorkflow) {
    workflowStore.saveWorkflow()
    await saveWorkflowToPersistence(workflowStore.currentWorkflow)
  }
}

const startExecution = async () => {
  if (workflowStore.currentWorkflow) {
    await executeWorkflow(workflowStore.currentWorkflow)
  }
}

const stopExecution = () => {
  stopWorkflowExecution()
  workflowStore.stopExecution()
}

// Lifecycle
onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  
  // Load workflows from persistence
  await loadWorkflowsFromPersistence()
  
  // Create default workflow if none exists
  if (workflowStore.workflows.length === 0) {
    workflowStore.createNewWorkflow('My First Workflow')
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
