<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">Node Palette</h2>
      <p class="text-sm text-gray-500 mt-1">Drag nodes onto the canvas</p>
    </div>

    <!-- Search -->
    <div class="p-4 border-b border-gray-200">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search nodes..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
    </div>

    <!-- Node Categories -->
    <div class="flex-1 overflow-y-auto">
      <div v-for="[category, nodes] in Object.entries(filteredNodesByCategory)" :key="category">
        <div 
          class="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
          @click="toggleCategory(category)"
        >
          <div class="flex items-center justify-between">
            <span>{{ category }}</span>
            <ChevronDownIcon 
              :class="[
                'w-4 h-4 transform transition-transform',
                collapsedCategories.includes(category) ? '-rotate-90' : 'rotate-0'
              ]"
            />
          </div>
        </div>
        
        <div 
          v-if="!collapsedCategories.includes(category)"
          class="space-y-1 p-2"
        >
          <div
            v-for="nodeConfig in nodes"
            :key="nodeConfig.type"
            :draggable="true"
            @dragstart="onDragStart($event, nodeConfig)"
            class="p-3 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div class="flex items-start gap-3">
              <div 
                class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                :style="{ backgroundColor: nodeConfig.color }"
              >
                <component :is="getIcon(nodeConfig.icon)" class="w-5 h-5" />
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {{ nodeConfig.label }}
                </h3>
                <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                  {{ nodeConfig.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div class="p-4 border-t border-gray-200 bg-gray-50">
      <div class="text-xs text-gray-600">
        <p class="font-medium mb-1">💡 Quick Tips:</p>
        <ul class="space-y-1">
          <li>• Drag nodes to the canvas</li>
          <li>• Connect nodes by dragging handles</li>
          <li>• Select nodes to configure</li>
          <li>• Press Delete to remove selected nodes</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import {
  PlayIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/vue/24/outline'
import { getNodesByCategory } from '@/config/nodeTypes'
import type { NodeTypeConfig } from '@/types'

const searchQuery = ref('')
const collapsedCategories = ref<string[]>([])

const nodesByCategory = getNodesByCategory()

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

const getIcon = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || PlayIcon
}

const filteredNodesByCategory = computed(() => {
  if (!searchQuery.value) {
    return nodesByCategory
  }

  const query = searchQuery.value.toLowerCase()
  const filtered: Record<string, NodeTypeConfig[]> = {}

  Object.entries(nodesByCategory).forEach(([category, nodes]) => {
    const matchingNodes = nodes.filter(node => 
      node.label.toLowerCase().includes(query) ||
      node.description.toLowerCase().includes(query) ||
      node.type.toLowerCase().includes(query)
    )
    
    if (matchingNodes.length > 0) {
      filtered[category] = matchingNodes
    }
  })

  return filtered
})

const toggleCategory = (category: string) => {
  const index = collapsedCategories.value.indexOf(category)
  if (index >= 0) {
    collapsedCategories.value.splice(index, 1)
  } else {
    collapsedCategories.value.push(category)
  }
}

const onDragStart = (event: DragEvent, nodeConfig: NodeTypeConfig) => {
  if (!event.dataTransfer) return
  
  // Set drag data
  event.dataTransfer.setData('application/node-type', JSON.stringify({
    type: nodeConfig.type,
    label: nodeConfig.label,
    description: nodeConfig.description,
    color: nodeConfig.color
  }))
  
  event.dataTransfer.effectAllowed = 'copy'
  
  // Create a custom drag image
  const dragImage = document.createElement('div')
  dragImage.className = 'p-2 bg-white border border-gray-300 rounded-lg shadow-lg flex items-center gap-2'
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-1000px'
  dragImage.innerHTML = `
    <div class="w-6 h-6 rounded flex items-center justify-center text-white text-xs" style="background-color: ${nodeConfig.color}">
      ${nodeConfig.label.charAt(0)}
    </div>
    <span class="text-sm font-medium">${nodeConfig.label}</span>
  `
  
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, 0, 0)
  
  // Clean up drag image after drag starts
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
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
