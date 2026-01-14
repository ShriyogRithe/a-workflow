<template>
  <g>
    <!-- Main edge path -->
    <path
      :id="`edge-path-${id}`"
      :d="edgePath"
      :style="edgeStyle"
      class="vue-flow__edge-path"
      fill="none"
      :stroke-width="strokeWidth"
      :stroke="strokeColor"
      :marker-end="markerEnd"
      @click="handleEdgeClick"
    />
    
    <!-- Interactive path (invisible, wider for easier clicking) -->
    <path
      :d="edgePath"
      fill="none"
      stroke="transparent"
      :stroke-width="10"
      class="vue-flow__edge-interaction"
      @click="handleEdgeClick"
    />
    
    <!-- Edge label -->
    <text
      v-if="label"
      :x="labelPosition.x"
      :y="labelPosition.y"
      text-anchor="middle"
      dominant-baseline="middle"
      class="vue-flow__edge-text"
      :style="labelStyle"
    >
      {{ label }}
    </text>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getBezierPath } from '@vue-flow/core'
import type { Position } from '@vue-flow/core'

interface EdgeStyle {
  stroke?: string
  strokeWidth?: number
  [key: string]: any
}

interface Props {
  id: string
  data?: Record<string, any>
  source: string
  target: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  label?: string
  style?: EdgeStyle
  markerEnd?: string
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
  label: '',
  style: () => ({}),
  markerEnd: 'url(#vue-flow__arrowclosed)',
  selected: false
})

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  labelChange: [id: string, label: string]
}>()

// Calculate edge path using Bezier curve
const edgePath = computed(() => {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })
  return path
})

// Calculate label position (center of the path)
const labelPosition = computed(() => {
  return {
    x: (props.sourceX + props.targetX) / 2,
    y: (props.sourceY + props.targetY) / 2
  }
})

// Edge styling
const strokeColor = computed(() => {
  if (props.selected) return '#3b82f6'
  return props.style?.stroke || '#6b7280'
})

const strokeWidth = computed(() => {
  if (props.selected) return 3
  return props.style?.strokeWidth || 2
})

const edgeStyle = computed(() => ({
  ...props.style,
  stroke: strokeColor.value,
  strokeWidth: strokeWidth.value
}))

const labelStyle = computed(() => ({
  fontSize: '12px',
  fontWeight: '500',
  fill: '#374151',
  pointerEvents: 'none' as const,
  userSelect: 'none' as const
}))

const handleEdgeClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('select', props.id)
}
</script>

<style scoped>
.vue-flow__edge-path {
  cursor: pointer;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.vue-flow__edge-path:hover {
  stroke-width: 3px;
}

.vue-flow__edge-text {
  pointer-events: none;
  user-select: none;
}
</style>
