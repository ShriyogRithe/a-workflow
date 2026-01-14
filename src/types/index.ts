// Node Types
export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  type: NodeType;
  config: Record<string, any>;
  description?: string;
}

export enum NodeType {
  // Triggers
  MANUAL_TRIGGER = 'manual_trigger',
  WEBHOOK_TRIGGER = 'webhook_trigger',
  
  // Actions
  HTTP_REQUEST = 'http_request',
  EMAIL = 'email',
  SMS = 'sms',
  DELAY = 'delay',
  
  // Logic
  CONDITION = 'condition',
  TRANSFORM = 'transform',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: NodeData;
  executionStatus?: ExecutionStatus;
  executionLogs?: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  condition?: 'true' | 'false'; // For condition branches
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Form Schema Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox' | 'url';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: any;
  description?: string;
}

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  description: string;
  category: 'trigger' | 'action' | 'logic';
  icon: string;
  color: string;
  formSchema: FormField[];
  handles: {
    source?: boolean;
    target?: boolean;
    sourceCount?: number;
    targetCount?: number;
  };
}

// Execution Types
export interface ExecutionContext {
  workflowId: string;
  nodeId: string;
  data: any;
  variables: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  logs: string[];
}

// Store Types
export interface AppState {
  currentWorkflow: Workflow | null;
  workflows: Workflow[];
  selectedNodeId: string | null;
  isExecuting: boolean;
  executionLogs: Record<string, string[]>;
  history: {
    past: Workflow[];
    future: Workflow[];
  };
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}
