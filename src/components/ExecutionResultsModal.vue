<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeModal"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            :style="{ backgroundColor: node?.data?.config?.color || '#6b7280' }"
          >
            <component :is="getIcon(node?.data?.config?.icon)" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ node?.data?.label || 'Node Results' }}
            </h2>
            <p class="text-sm text-gray-500">
              Execution Results & API Response
            </p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- Status -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-yellow-400': node?.executionStatus === 'pending',
                'bg-blue-500': node?.executionStatus === 'running',
                'bg-green-500': node?.executionStatus === 'success',
                'bg-red-500': node?.executionStatus === 'error',
                'bg-gray-400': node?.executionStatus === 'skipped',
              }"
            />
            <span class="text-sm font-medium capitalize">
              {{ node?.executionStatus || 'Not executed' }}
            </span>
            <span v-if="executionTime" class="text-xs text-gray-500">
              ({{ executionTime }}ms)
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="px-6 border-b border-gray-200">
          <nav class="flex gap-6">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-3 px-1 border-b-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              {{ tab.label }}
              <span
                v-if="tab.count !== undefined"
                class="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs"
              >
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-hidden">
          <!-- Logs Tab -->
          <div v-if="activeTab === 'logs'" class="h-full overflow-auto p-6">
            <div v-if="executionLogs && executionLogs.length > 0" class="space-y-3">
              <div
                v-for="(log, index) in executionLogs"
                :key="index"
                class="bg-gray-50 rounded-lg p-4 font-mono text-sm"
              >
                <div class="text-gray-500 text-xs mb-1">
                  {{ formatTimestamp(index) }}
                </div>
                <div class="text-gray-800 whitespace-pre-wrap">{{ log }}</div>
              </div>
            </div>
            <div v-else class="flex items-center justify-center h-32 text-gray-500">
              <div class="text-center">
                <DocumentIcon class="w-8 h-8 mx-auto mb-2" />
                <p>No execution logs available</p>
              </div>
            </div>
          </div>

          <!-- Response Tab -->
          <div v-if="activeTab === 'response'" class="h-full overflow-auto p-6">
            <div v-if="apiResponse" class="space-y-4">
              <!-- Response Status -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Status</span>
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      getStatusColor(apiResponse.status)
                    ]"
                  >
                    {{ apiResponse.status }} {{ apiResponse.statusText }}
                  </span>
                </div>
              </div>

              <!-- Response Headers -->
              <div v-if="apiResponse.headers" class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Headers</h4>
                <div class="space-y-2">
                  <div
                    v-for="(value, key) in apiResponse.headers"
                    :key="key"
                    class="flex text-sm"
                  >
                    <span class="text-gray-600 w-32 flex-shrink-0">{{ key }}:</span>
                    <span class="text-gray-800 font-mono break-all">{{ value }}</span>
                  </div>
                </div>
              </div>

              <!-- Response Body -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-gray-700">Response Body</h4>
                  <button
                    @click="copyResponse"
                    class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre class="text-sm text-gray-800 bg-white p-4 rounded border overflow-auto max-h-96 font-mono whitespace-pre-wrap">{{ formattedResponse }}</pre>
              </div>
            </div>
            <div v-else class="flex items-center justify-center h-32 text-gray-500">
              <div class="text-center">
                <GlobeAltIcon class="w-8 h-8 mx-auto mb-2" />
                <p>No API response data available</p>
              </div>
            </div>
          </div>

          <!-- Configuration Tab -->
          <div v-if="activeTab === 'config'" class="h-full overflow-auto p-6">
            <div v-if="node?.data?.config" class="bg-gray-50 rounded-lg p-4">
              <pre class="text-sm text-gray-800 font-mono whitespace-pre-wrap">{{ JSON.stringify(node.data.config, null, 2) }}</pre>
            </div>
            <div v-else class="flex items-center justify-center h-32 text-gray-500">
              <div class="text-center">
                <Cog6ToothIcon class="w-8 h-8 mx-auto mb-2" />
                <p>No configuration data available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  XMarkIcon,
  DocumentIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  PlayIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import type { WorkflowNode } from '@/types'

interface ApiResponse {
  status: number
  statusText: string
  headers?: Record<string, string>
  data?: any
}

interface ExecutionData {
  response?: ApiResponse
  duration?: number
  success?: boolean
  error?: string
}

interface Props {
  isOpen: boolean
  node: WorkflowNode | null
  executionResult?: ExecutionData | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const activeTab = ref('logs')

// Icon mapping
const iconMap = {
  'play': PlayIcon,
  'globe': GlobeAltIcon,
  'arrow-path': ArrowPathIcon,
  'envelope': EnvelopeIcon,
  'chat-bubble-left': ChatBubbleLeftIcon,
  'clock': ClockIcon,
}

const getIcon = (iconName?: string) => {
  return iconMap[iconName as keyof typeof iconMap] || PlayIcon
}

// Computed properties
const executionLogs = computed(() => {
  return props.node?.executionLogs || []
})

const apiResponse = computed(() => {
  return props.executionResult?.response || null
})

const executionTime = computed(() => {
  return props.executionResult?.duration || null
})

const formattedResponse = computed(() => {
  if (!apiResponse.value?.data) return 'No response body'
  
  try {
    return JSON.stringify(apiResponse.value.data, null, 2)
  } catch {
    return String(apiResponse.value.data)
  }
})

const tabs = computed(() => [
  {
    id: 'logs',
    label: 'Execution Logs',
    count: executionLogs.value.length
  },
  {
    id: 'response',
    label: 'API Response',
    count: apiResponse.value ? 1 : 0
  },
  {
    id: 'config',
    label: 'Configuration'
  }
])

// Methods
const closeModal = () => {
  emit('close')
}

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) {
    return 'bg-green-100 text-green-800'
  } else if (status >= 300 && status < 400) {
    return 'bg-yellow-100 text-yellow-800'
  } else if (status >= 400) {
    return 'bg-red-100 text-red-800'
  }
  return 'bg-gray-100 text-gray-800'
}

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(formattedResponse.value)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy response:', error)
  }
}

const formatTimestamp = (index: number) => {
  // Simple timestamp formatting - could be enhanced
  const now = new Date()
  const time = new Date(now.getTime() - (executionLogs.value.length - index) * 1000)
  return time.toLocaleTimeString()
}

// Reset tab when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'logs'
  }
})
</script>
