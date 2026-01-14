<template>
  <div 
    class="workflow-node"
    :class="[
      'min-w-[200px] bg-white border-2 rounded-lg shadow-sm transition-all cursor-move',
      {
        'border-blue-500 shadow-lg': selected,
        'border-gray-300': !selected,
        'border-green-500 bg-green-50': data.executionStatus === 'running',
        'border-emerald-500 bg-emerald-50': data.executionStatus === 'success',
        'border-red-500 bg-red-50': data.executionStatus === 'error',
      }
    ]"
    @click="handleNodeClick"
    @contextmenu.prevent="showContextMenu = true"
  >
    <!-- Header -->
    <div 
      class="px-4 py-3 border-b border-gray-200 flex items-center gap-3"
      :style="{ backgroundColor: data.config?.color + '10' || '#f8fafc' }"
    >
      <!-- Icon -->
      <div 
        class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
        :style="{ backgroundColor: data.config?.color || '#6b7280' }"
      >
        <component :is="getIcon(data.config?.icon)" class="w-5 h-5" />
      </div>

      <!-- Title -->
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-gray-900 truncate">
          {{ data.label }}
        </h3>
        <p class="text-xs text-gray-500">
          {{ data.config?.label || data.type }}
        </p>
      </div>

      <!-- Status Indicator -->
      <div class="flex-shrink-0">
        <div
          v-if="data.executionStatus"
          class="w-3 h-3 rounded-full"
          :class="{
            'bg-yellow-400 animate-pulse': data.executionStatus === 'pending',
            'bg-blue-500 animate-pulse': data.executionStatus === 'running',
            'bg-green-500': data.executionStatus === 'success',
            'bg-red-500': data.executionStatus === 'error',
            'bg-gray-400': data.executionStatus === 'skipped',
          }"
          :title="data.executionStatus"
        />
      </div>
    </div>

    <!-- Body -->
    <div class="px-4 py-3">
      <!-- Description -->
      <p v-if="data.description" class="text-xs text-gray-600 mb-2">
        {{ data.description }}
      </p>

      <!-- Configuration Preview -->
      <div v-if="hasConfig" class="space-y-1">
        <div 
          v-for="(value, key) in previewConfig" 
          :key="key"
          class="flex items-center justify-between text-xs"
        >
          <span class="text-gray-500 truncate">{{ formatKey(key) }}:</span>
          <span class="text-gray-700 truncate max-w-[100px]" :title="String(value)">
            {{ formatValue(value) }}
          </span>
        </div>
      </div>

      <!-- Execution Logs Preview -->
      <div v-if="data.executionLogs && data.executionLogs.length > 0" class="mt-2">
        <div class="flex items-center justify-between mb-1">
          <div class="text-xs text-gray-500">Latest log:</div>
          <button
            @click.stop="showExecutionResults = true"
            class="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            View All
          </button>
        </div>
        <div class="text-xs text-gray-700 bg-gray-50 p-2 rounded border truncate">
          {{ data.executionLogs[data.executionLogs.length - 1] }}
        </div>
      </div>

      <!-- Show Results Button for HTTP nodes -->
      <div v-if="data.type === 'http_request' && data.executionStatus === 'success'" class="mt-2">
        <button
          @click.stop="showExecutionResults = true"
          class="w-full text-xs bg-blue-50 text-blue-600 p-2 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          View API Response
        </button>
      </div>
    </div>

    <!-- Handles -->
    <Handle
      v-if="data.config?.handles?.target !== false"
      type="target"
      :position="Position.Left"
      class="workflow-handle workflow-handle-target"
    />
    
    <!-- Single source handle for non-condition nodes -->
    <Handle
      v-if="data.config?.handles?.source !== false && data.type !== 'condition'"
      type="source"
      :position="Position.Right"
      class="workflow-handle workflow-handle-source"
    />
    
    <!-- Multiple source handles for condition nodes -->
    <template v-if="data.type === 'condition' && data.config?.handles?.source !== false">
      <!-- True branch handle -->
      <Handle
        type="source"
        id="true"
        :position="Position.Right"
        :style="{ top: '30%' }"
        class="workflow-handle workflow-handle-source workflow-handle-true"
        title="True branch"
      />
      <div 
        class="absolute right-2 text-xs font-medium text-green-600 pointer-events-none"
        :style="{ top: '25%' }"
      >
        T
      </div>
      
      <!-- False branch handle -->
      <Handle
        type="source"
        id="false"
        :position="Position.Right"
        :style="{ top: '70%' }"
        class="workflow-handle workflow-handle-source workflow-handle-false"
        title="False branch"
      />
      <div 
        class="absolute right-2 text-xs font-medium text-red-600 pointer-events-none"
        :style="{ top: '65%' }"
      >
        F
      </div>
    </template>

    <!-- Context Menu -->
    <div
      v-if="showContextMenu"
      class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
      @click.stop
    >
      <button
        @click="emit('duplicate', id); showContextMenu = false"
        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <DocumentDuplicateIcon class="w-4 h-4" />
        Duplicate
      </button>
      <button
        @click="emit('select', id); showContextMenu = false"
        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <Cog6ToothIcon class="w-4 h-4" />
        Configure
      </button>
      <hr class="my-1 border-gray-200">
      <button
        @click="emit('delete', id); showContextMenu = false"
        class="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
      >
        <TrashIcon class="w-4 h-4" />
        Delete
      </button>
    </div>

    <!-- Click overlay to close context menu -->
    <div
      v-if="showContextMenu"
      class="fixed inset-0 z-40"
      @click="showContextMenu = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import {
  PlayIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ArrowPathRoundedSquareIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

interface NodeData {
  label: string
  type: string
  description?: string
  config?: Record<string, any>
  executionStatus?: string
  executionLogs?: string[]
}

interface Props {
  id: string
  data: NodeData
  selected?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  duplicate: [id: string]
}>()

const showContextMenu = ref(false)
const showExecutionResults = ref(false)

// Event handlers
const handleNodeClick = (event: MouseEvent) => {
  emit('select', props.id)
}

// Icon mapping
const iconMap = {
  'play': PlayIcon,
  'globe': GlobeAltIcon,
  'arrow-path': ArrowPathIcon,
  'envelope': EnvelopeIcon,
  'chat-bubble-left': ChatBubbleLeftIcon,
  'clock': ClockIcon,
  'arrow-path-rounded-square': ArrowPathRoundedSquareIcon,
}

const getIcon = (iconName?: string) => {
  return iconMap[iconName as keyof typeof iconMap] || PlayIcon
}

// Configuration preview
const hasConfig = computed(() => {
  return props.data.config && Object.keys(props.data.config).length > 0
})

const previewConfig = computed(() => {
  if (!props.data.config) return {}
  
  // Show only important fields for preview
  const importantFields = ['url', 'to', 'message', 'subject', 'duration', 'field', 'operation']
  const preview: Record<string, any> = {}
  
  importantFields.forEach(field => {
    if (props.data.config?.[field] !== undefined && props.data.config?.[field] !== '') {
      preview[field] = props.data.config[field]
    }
  })
  
  // Limit to 3 fields for space
  const entries = Object.entries(preview)
  if (entries.length > 3) {
    const limitedPreview: Record<string, any> = {}
    entries.slice(0, 3).forEach(([key, value]) => {
      limitedPreview[key] = value
    })
    return limitedPreview
  }
  
  return preview
})

const formatKey = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

const formatValue = (value: any): string => {
  if (typeof value === 'string' && value.length > 15) {
    return value.substring(0, 15) + '...'
  }
  return String(value)
}

// Close context menu when clicking elsewhere
const handleClickOutside = (event: Event) => {
  if (showContextMenu.value && !(event.target as Element).closest('.workflow-node')) {
    showContextMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.workflow-node {
  position: relative;
  user-select: none;
}

.workflow-handle {
  width: 12px;
  height: 12px;
  border: 2px solid;
  border-radius: 50%;
  background: white;
}

.workflow-handle-target {
  border-color: #3b82f6;
  left: -6px;
}

.workflow-handle-source {
  border-color: #10b981;
  right: -6px;
}

.workflow-handle:hover {
  transform: scale(1.2);
  transition: transform 0.2s;
}
</style>
