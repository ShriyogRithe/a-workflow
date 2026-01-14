<template>
  <div class="h-full relative bg-gray-50">
    <VueFlow
      :nodes="vueFlowNodes"
      :edges="vueFlowEdges"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @connect="onConnect"
      @drop="onDrop"
      @dragover="onDragOver"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @pane-click="onPaneClick"
      @move-end="onMoveEnd"
      :fit-view-on-init="true"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      class="vue-flow-canvas"
    >
      <!-- Background Pattern -->
      <Background 
        pattern-color="#94a3b8"
        :gap="20"
        :size="1"
      />

      <!-- Minimap -->
      <MiniMap 
        :node-stroke-width="2"
        node-stroke-color="#64748b"
        position="top-right"
        :width="200"
        :height="150"
      />

      <!-- Controls -->
      <Controls 
        :show-zoom="true"
        :show-fit-view="true"
        :show-interactive="true"
        position="bottom-left"
      />

      <!-- Custom Node Templates -->
      <template #node-custom="{ data, id }">
        <WorkflowNode 
          :id="id"
          :data="data"
          :selected="workflowStore.selectedNodeId === id"
          @select="onNodeSelect"
          @delete="onNodeDelete"
          @duplicate="onNodeDuplicate"
        />
      </template>

      <!-- Custom Edge Templates -->
      <template #edge-custom="{ data, id, source, target }">
        <WorkflowEdge 
          :id="id"
          :data="data"
          :source="source"
          :target="target"
          @select="onEdgeSelect"
          @delete="onEdgeDelete"
          @label-change="onEdgeLabelChange"
        />
      </template>
    </VueFlow>

    <!-- Canvas Toolbar -->
    <div class="absolute top-4 left-4 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      <!-- Zoom Controls -->
      <div class="flex items-center gap-1">
        <button
          @click="zoomIn"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom In"
        >
          <PlusIcon class="w-4 h-4" />
        </button>
        <button
          @click="zoomOut"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <MinusIcon class="w-4 h-4" />
        </button>
        <button
          @click="fitView"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fit to View"
        >
          <ArrowsPointingOutIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-6 bg-gray-300"></div>

      <!-- Selection Tools -->
      <div class="flex items-center gap-1">
        <button
          @click="selectAll"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Select All (Ctrl+A)"
        >
          <RectangleStackIcon class="w-4 h-4" />
        </button>
        <button
          @click="deleteSelected"
          :disabled="!workflowStore.selectedNodeId"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete Selected (Del)"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-6 bg-gray-300"></div>

      <!-- Layout Tools -->
      <div class="flex items-center gap-1">
        <button
          @click="autoLayout"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Auto Layout"
        >
          <Squares2X2Icon class="w-4 h-4" />
        </button>
        <button
          @click="centerNodes"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Center Nodes"
        >
          <ViewfinderCircleIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Node Counter -->
    <div class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
      <div class="text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>{{ workflowStore.workflowNodes.length }} nodes</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>{{ workflowStore.workflowEdges.length }} connections</span>
        </div>
      </div>
    </div>

    <!-- Drop Zone Overlay -->
    <div
      v-if="isDragging"
      class="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed flex items-center justify-center pointer-events-none z-10"
    >
      <div class="bg-white p-4 rounded-lg shadow-lg border border-blue-300">
        <div class="text-blue-600 text-center">
          <PlusCircleIcon class="w-8 h-8 mx-auto mb-2" />
          <p class="font-medium">Drop to add node</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@vue-flow/core'
import {
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  RectangleStackIcon,
  TrashIcon,
  Squares2X2Icon,
  ViewfinderCircleIcon,
  PlusCircleIcon
} from '@heroicons/vue/24/outline'
import { useWorkflowStore } from '@/stores/workflow'
import { getNodeTypeConfig } from '@/config/nodeTypes'
import { NodeType, ExecutionStatus } from '@/types'
import type { WorkflowNode as WorkflowNodeType, WorkflowEdge as WorkflowEdgeType, NodePosition } from '@/types'
import WorkflowNode from '@/components/WorkflowNode.vue'
import WorkflowEdge from '@/components/WorkflowEdge.vue'

const workflowStore = useWorkflowStore()
const { 
  fitView: vueFlowFitView,
  zoomIn: vueFlowZoomIn,
  zoomOut: vueFlowZoomOut,
  setViewport,
  getViewport,
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  updateNode,
  updateEdge
} = useVueFlow()

const isDragging = ref(false)

// Convert workflow nodes to VueFlow nodes
const vueFlowNodes = computed<Node[]>(() => {
  return workflowStore.workflowNodes.map((node: WorkflowNodeType) => {
    const config = getNodeTypeConfig(node.type)
    
    return {
      id: node.id,
      type: 'custom',
      position: { x: node.position.x, y: node.position.y },
      data: {
        ...node.data,
        executionStatus: node.executionStatus,
        executionLogs: node.executionLogs,
        config,
      },
      selected: workflowStore.selectedNodeId === node.id,
      draggable: true,
      selectable: true,
      style: {
        border: node.executionStatus === ExecutionStatus.RUNNING ? '2px solid #10b981' :
                node.executionStatus === ExecutionStatus.SUCCESS ? '2px solid #22c55e' :
                node.executionStatus === ExecutionStatus.ERROR ? '2px solid #ef4444' :
                workflowStore.selectedNodeId === node.id ? '2px solid #3b82f6' : '2px solid #d1d5db',
        backgroundColor: node.executionStatus === ExecutionStatus.RUNNING ? '#f0fdf4' : '#ffffff',
      },
    }
  })
})

// Convert workflow edges to VueFlow edges
const vueFlowEdges = computed<Edge[]>(() => {
  return workflowStore.workflowEdges.map((edge: WorkflowEdgeType) => ({
    id: edge.id,
    type: 'default', // Use default edge type instead of custom for now
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    animated: edge.animated || false,
    style: {
      stroke: '#6b7280',
      strokeWidth: 2,
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.9,
    },
    data: edge, // Pass the full edge data
  }))
})

// Handle node changes (position, selection, etc.)
const onNodesChange = (changes: NodeChange[]) => {
  changes.forEach((change: any) => {
    if (change.type === 'position' && change.position) {
      workflowStore.updateNode(change.id, {
        position: change.position
      })
    }
  })
}

// Handle edge changes
const onEdgesChange = (changes: EdgeChange[]) => {
  changes.forEach((change: any) => {
    if (change.type === 'remove') {
      workflowStore.deleteEdge(change.id)
    }
  })
}

// Handle new connections
const onConnect = (connection: Connection) => {
  if (connection.source && connection.target) {
    // Check if this is a condition node connection
    const sourceNode = workflowStore.workflowNodes.find(n => n.id === connection.source)
    let edgeData: any = {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
    }

    // If connecting from a condition node, set the condition and label based on sourceHandle
    if (sourceNode?.type === NodeType.CONDITION && connection.sourceHandle) {
      edgeData.condition = connection.sourceHandle as 'true' | 'false'
      edgeData.label = connection.sourceHandle === 'true' ? 'True' : 'False'
      edgeData.animated = true // Animate condition edges for better visibility
    }

    workflowStore.addEdge(edgeData)
  }
}

// Handle drop events (from palette)
const onDrop = (event: DragEvent) => {
  isDragging.value = false
  
  if (!event.dataTransfer) return
  
  const nodeTypeData = event.dataTransfer.getData('application/node-type')
  if (!nodeTypeData) return
  
  try {
    const data = JSON.parse(nodeTypeData)
    const position = {
      x: event.offsetX,
      y: event.offsetY,
    }
    
    workflowStore.addNode(data.type as NodeType, position, {
      label: data.label,
      description: data.description,
    })
  } catch (error) {
    console.error('Failed to parse dropped node data:', error)
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// Handle clicks
const onNodeClick = (event: any) => {
  workflowStore.selectNode(event.node.id)
}

const onEdgeClick = (event: any) => {
  // Could add edge selection in the future
  console.log('Edge clicked:', event.edge.id)
}

const onPaneClick = () => {
  workflowStore.selectNode(null)
}

// Handle viewport changes
const onMoveEnd = async () => {
  await nextTick()
  const viewport = getViewport()
  workflowStore.updateViewport(viewport)
}

// Node actions
const onNodeSelect = (nodeId: string) => {
  workflowStore.selectNode(nodeId)
}

const onNodeDelete = (nodeId: string) => {
  workflowStore.deleteNode(nodeId)
}

const onNodeDuplicate = (nodeId: string) => {
  workflowStore.duplicateNode(nodeId)
}

// Edge actions
const onEdgeSelect = (edgeId: string) => {
  console.log('Edge selected:', edgeId)
}

const onEdgeDelete = (edgeId: string) => {
  workflowStore.deleteEdge(edgeId)
}

const onEdgeLabelChange = (edgeId: string, label: string) => {
  workflowStore.updateEdge(edgeId, { label })
}

// Toolbar actions
const zoomIn = () => {
  vueFlowZoomIn()
}

const zoomOut = () => {
  vueFlowZoomOut()
}

const fitView = () => {
  vueFlowFitView({ padding: 50 })
}

const selectAll = () => {
  // TODO: Implement multi-select
  console.log('Select all nodes')
}

const deleteSelected = () => {
  if (workflowStore.selectedNodeId) {
    workflowStore.deleteNode(workflowStore.selectedNodeId)
  }
}

const autoLayout = () => {
  // TODO: Implement automatic layout
  console.log('Auto layout')
}

const centerNodes = () => {
  fitView()
}

// Watch for workflow changes to update viewport
watch(() => workflowStore.viewport, (newViewport) => {
  if (newViewport) {
    setViewport(newViewport)
  }
}, { deep: true })
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.vue-flow-canvas {
  background-color: #f8fafc;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #3b82f6;
  stroke-width: 3px;
}

.vue-flow__minimap {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.vue-flow__controls {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.vue-flow__controls button {
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  transition: all 0.2s;
}

.vue-flow__controls button:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.vue-flow__controls button:last-child {
  border-bottom: none;
}
</style>
