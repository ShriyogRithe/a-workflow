<template>
  <div class="h-full flex flex-col bg-white">
    <div v-if="!selectedNode" class="flex-1 flex items-center justify-center text-gray-500">
      <div class="text-center">
        <Cog6ToothIcon class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Select a node to configure</p>
      </div>
    </div>

    <div v-else class="h-full flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div 
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            :style="{ backgroundColor: nodeConfig?.color || '#6b7280' }"
          >
            <component :is="getIcon(nodeConfig?.icon)" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ nodeConfig?.label }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ nodeConfig?.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto p-4">
        <form @submit.prevent="handleSave">
          <div class="space-y-6">
            <!-- Form Fields -->
            <div
              v-for="field in nodeConfig?.formSchema || []"
              :key="field.name"
              class="space-y-2"
            >
              <label 
                :for="field.name"
                class="block text-sm font-medium text-gray-700"
              >
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>

              <!-- Text Input -->
              <input
                v-if="field.type === 'text' || field.type === 'email' || field.type === 'url'"
                :id="field.name"
                v-model="formData[field.name]"
                :type="field.type"
                :placeholder="field.placeholder"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300': errors[field.name] }"
                @blur="validateField(field)"
              />

              <!-- Number Input -->
              <input
                v-else-if="field.type === 'number'"
                :id="field.name"
                v-model.number="formData[field.name]"
                type="number"
                :placeholder="field.placeholder"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300': errors[field.name] }"
                @blur="validateField(field)"
              />

              <!-- Textarea -->
              <textarea
                v-else-if="field.type === 'textarea'"
                :id="field.name"
                v-model="formData[field.name]"
                :placeholder="field.placeholder"
                :required="field.required"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300': errors[field.name] }"
                @blur="validateField(field)"
              />

              <!-- Select -->
              <select
                v-else-if="field.type === 'select'"
                :id="field.name"
                v-model="formData[field.name]"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-300': errors[field.name] }"
                @blur="validateField(field)"
              >
                <option value="">Select {{ field.label.toLowerCase() }}</option>
                <option
                  v-for="option in field.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>

              <!-- Checkbox -->
              <label
                v-else-if="field.type === 'checkbox'"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input
                  :id="field.name"
                  v-model="formData[field.name]"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">
                  {{ field.placeholder || 'Enable this option' }}
                </span>
              </label>

              <!-- Error Message -->
              <p v-if="errors[field.name]" class="text-red-600 text-xs">
                {{ errors[field.name] }}
              </p>

              <!-- Help Text -->
              <p v-if="field.description" class="text-gray-500 text-xs">
                {{ field.description }}
              </p>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 space-y-3">
        <button
          @click="handleSave"
          :disabled="!isFormValid"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save Configuration
        </button>

        <div class="flex gap-2">
          <button
            @click="handleReset"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            @click="handleDelete"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Node
          </button>
        </div>

        <!-- Execution Status -->
        <div v-if="selectedNode.executionStatus" class="pt-3 border-t border-gray-200">
          <div class="flex items-center gap-2 mb-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-yellow-400 animate-pulse': selectedNode.executionStatus === 'pending',
                'bg-blue-500 animate-pulse': selectedNode.executionStatus === 'running',
                'bg-green-500': selectedNode.executionStatus === 'success',
                'bg-red-500': selectedNode.executionStatus === 'error',
                'bg-gray-400': selectedNode.executionStatus === 'skipped',
              }"
            />
            <span class="text-sm font-medium capitalize">
              {{ selectedNode.executionStatus }}
            </span>
          </div>

          <!-- Execution Logs -->
          <div v-if="selectedNode.executionLogs && selectedNode.executionLogs.length > 0">
            <div class="text-xs font-medium text-gray-700 mb-1">Logs:</div>
            <div class="max-h-24 overflow-y-auto bg-gray-50 border border-gray-200 rounded p-2">
              <div
                v-for="(log, index) in selectedNode.executionLogs"
                :key="index"
                class="text-xs text-gray-600 mb-1 last:mb-0"
              >
                {{ log }}
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
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import {
  PlayIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/vue/24/outline'
import { useWorkflowStore } from '@/stores/workflow'
import { getNodeTypeConfig } from '@/config/nodeTypes'
import type { FormField, WorkflowNode } from '@/types'

const workflowStore = useWorkflowStore()

const formData = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})

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

// Computed properties
const selectedNode = computed(() => workflowStore.selectedNode)

const nodeConfig = computed(() => {
  if (!selectedNode.value) return null
  return getNodeTypeConfig(selectedNode.value.type)
})

const isFormValid = computed(() => {
  if (!nodeConfig.value) return false
  
  // Check required fields
  for (const field of nodeConfig.value.formSchema) {
    if (field.required && (!formData.value[field.name] || formData.value[field.name] === '')) {
      return false
    }
    
    // Check for validation errors
    if (errors.value[field.name]) {
      return false
    }
  }
  
  return true
})

// Initialize form data when node selection changes
watch(selectedNode, (newNode) => {
  if (newNode) {
    // Initialize form with existing config data
    formData.value = { ...newNode.data.config }
    
    // Also include basic fields like label and description
    formData.value.label = newNode.data.label
    formData.value.description = newNode.data.description || ''
    
    // Clear errors
    errors.value = {}
  } else {
    formData.value = {}
    errors.value = {}
  }
}, { immediate: true })

// Validation
const validateField = async (field: FormField) => {
  if (!field.validation) {
    delete errors.value[field.name]
    return
  }

  try {
    await field.validation.validate(formData.value[field.name])
    delete errors.value[field.name]
  } catch (error) {
    errors.value[field.name] = (error as Error).message || 'Invalid value'
  }
}

const validateAll = async (): Promise<boolean> => {
  if (!nodeConfig.value) return false
  
  let isValid = true
  
  for (const field of nodeConfig.value.formSchema) {
    await validateField(field)
    if (errors.value[field.name]) {
      isValid = false
    }
  }
  
  return isValid
}

// Actions
const handleSave = async () => {
  if (!selectedNode.value || !nodeConfig.value) return
  
  const isValid = await validateAll()
  if (!isValid) return
  
  // Extract config data (exclude label and description which are handled separately)
  const config = { ...formData.value }
  const label = config.label
  const description = config.description
  delete config.label
  delete config.description
  
  // Update the node
  workflowStore.updateNode(selectedNode.value.id, {
    data: {
      ...selectedNode.value.data,
      label: label || selectedNode.value.data.label,
      description: description || selectedNode.value.data.description,
      config,
    }
  })
}

const handleReset = () => {
  if (selectedNode.value) {
    // Reset to original values
    formData.value = { ...selectedNode.value.data.config }
    formData.value.label = selectedNode.value.data.label
    formData.value.description = selectedNode.value.data.description || ''
    errors.value = {}
  }
}

const handleDelete = () => {
  if (selectedNode.value) {
    const confirmDelete = confirm(`Are you sure you want to delete "${selectedNode.value.data.label}"?`)
    if (confirmDelete) {
      workflowStore.deleteNode(selectedNode.value.id)
    }
  }
}
</script>
