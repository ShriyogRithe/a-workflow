import type { NodeTypeConfig } from '@/types'
import { NodeType } from '@/types'
import * as yup from 'yup'

export const NODE_CONFIGURATIONS: Record<NodeType, NodeTypeConfig> = {
  [NodeType.MANUAL_TRIGGER]: {
    type: NodeType.MANUAL_TRIGGER,
    label: 'Manual Trigger',
    description: 'Manually trigger the workflow execution',
    category: 'trigger',
    icon: 'play',
    color: '#10B981',
    handles: {
      source: true,
      target: false,
    },
    formSchema: [
      {
        name: 'label',
        label: 'Trigger Label',
        type: 'text',
        required: true,
        placeholder: 'Enter trigger name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe what triggers this workflow',
      },
    ],
  },

  [NodeType.WEBHOOK_TRIGGER]: {
    type: NodeType.WEBHOOK_TRIGGER,
    label: 'Webhook Trigger',
    description: 'Trigger workflow via HTTP webhook',
    category: 'trigger',
    icon: 'globe',
    color: '#3B82F6',
    handles: {
      source: true,
      target: false,
    },
    formSchema: [
      {
        name: 'label',
        label: 'Webhook Label',
        type: 'text',
        required: true,
        placeholder: 'Enter webhook name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'path',
        label: 'Webhook Path',
        type: 'text',
        required: true,
        placeholder: '/webhook/your-endpoint',
        validation: yup.string().required('Path is required'),
      },
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
        ],
        validation: yup.string().required('Method is required'),
      },
      {
        name: 'authentication',
        label: 'Require Authentication',
        type: 'checkbox',
      },
    ],
  },

  [NodeType.HTTP_REQUEST]: {
    type: NodeType.HTTP_REQUEST,
    label: 'HTTP Request',
    description: 'Make HTTP requests to external services',
    category: 'action',
    icon: 'arrow-path',
    color: '#F59E0B',
    handles: {
      source: true,
      target: true,
    },
    formSchema: [
      {
        name: 'label',
        label: 'Request Label',
        type: 'text',
        required: true,
        placeholder: 'Enter request name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'url',
        label: 'URL',
        type: 'url',
        required: true,
        placeholder: 'https://api.example.com/endpoint',
        validation: yup.string().url('Must be a valid URL').required('URL is required'),
      },
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
        ],
        validation: yup.string().required('Method is required'),
      },
      {
        name: 'headers',
        label: 'Headers (JSON)',
        type: 'textarea',
        placeholder: '{"Content-Type": "application/json"}',
      },
      {
        name: 'body',
        label: 'Request Body',
        type: 'textarea',
        placeholder: 'Request body content',
      },
      {
        name: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        placeholder: '30',
        validation: yup.number().min(1).max(300),
      },
    ],
  },

  [NodeType.EMAIL]: {
    type: NodeType.EMAIL,
    label: 'Send Email',
    description: 'Send email notifications',
    category: 'action',
    icon: 'envelope',
    color: '#EF4444',
    handles: {
      source: true,
      target: true,
    },
    formSchema: [
      {
        name: 'label',
        label: 'Email Label',
        type: 'text',
        required: true,
        placeholder: 'Enter email action name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'to',
        label: 'To Email',
        type: 'email',
        required: true,
        placeholder: 'recipient@example.com',
        validation: yup.string().email('Must be a valid email').required('To email is required'),
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        required: true,
        placeholder: 'Email subject',
        validation: yup.string().required('Subject is required'),
      },
      {
        name: 'body',
        label: 'Email Body',
        type: 'textarea',
        required: true,
        placeholder: 'Email content...',
        validation: yup.string().required('Email body is required'),
      },
      {
        name: 'fromName',
        label: 'From Name',
        type: 'text',
        placeholder: 'Your Name',
      },
    ],
  },

  [NodeType.SMS]: {
    type: NodeType.SMS,
    label: 'Send SMS',
    description: 'Send SMS notifications',
    category: 'action',
    icon: 'chat-bubble-left',
    color: '#8B5CF6',
    handles: {
      source: true,
      target: true,
    },
    formSchema: [
      {
        name: 'label',
        label: 'SMS Label',
        type: 'text',
        required: true,
        placeholder: 'Enter SMS action name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'to',
        label: 'Phone Number',
        type: 'text',
        required: true,
        placeholder: '+1234567890',
        validation: yup.string().required('Phone number is required'),
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        placeholder: 'SMS message content...',
        validation: yup.string().max(160, 'Message too long').required('Message is required'),
      },
    ],
  },

  [NodeType.DELAY]: {
    type: NodeType.DELAY,
    label: 'Delay',
    description: 'Wait for a specified time before continuing',
    category: 'action',
    icon: 'clock',
    color: '#6B7280',
    handles: {
      source: true,
      target: true,
    },
    formSchema: [
      {
        name: 'label',
        label: 'Delay Label',
        type: 'text',
        required: true,
        placeholder: 'Enter delay name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'number',
        required: true,
        placeholder: '60',
        validation: yup.number().min(1).required('Duration is required'),
      },
      {
        name: 'unit',
        label: 'Time Unit',
        type: 'select',
        required: true,
        options: [
          { label: 'Seconds', value: 'seconds' },
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' },
        ],
        validation: yup.string().required('Unit is required'),
      },
    ],
  },

  [NodeType.CONDITION]: {
    type: NodeType.CONDITION,
    label: 'Condition',
    description: 'Branch workflow based on conditions',
    category: 'logic',
    icon: 'arrow-path-rounded-square',
    color: '#F97316',
    handles: {
      source: true,
      target: true,
      sourceCount: 2, // True and False outputs
    },
    formSchema: [
      {
        name: 'label',
        label: 'Condition Label',
        type: 'text',
        required: true,
        placeholder: 'Enter condition name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'conditions',
        label: 'Conditions (JSON Array)',
        type: 'textarea',
        required: true,
        placeholder: '[{"field": "response.status", "operator": "equals", "value": "200"}]',
        validation: yup.string().required('Conditions are required'),
        description: 'Array of condition objects. Each condition has field, operator, and value properties.'
      },
      {
        name: 'logic',
        label: 'Logic Operator',
        type: 'select',
        required: true,
        options: [
          { label: 'AND (all conditions must be true)', value: 'AND' },
          { label: 'OR (any condition can be true)', value: 'OR' },
        ],
        validation: yup.string().required('Logic operator is required'),
        description: 'How to combine multiple conditions'
      },
      {
        name: 'dataSource',
        label: 'Data Source',
        type: 'select',
        required: true,
        options: [
          { label: 'Previous Node Output', value: 'previous' },
          { label: 'Workflow Variables', value: 'variables' },
          { label: 'Static Values', value: 'static' },
        ],
        validation: yup.string().required('Data source is required'),
        description: 'Where to get the data for evaluation'
      },
    ],
  },

  [NodeType.TRANSFORM]: {
    type: NodeType.TRANSFORM,
    label: 'Transform Data',
    description: 'Transform and manipulate data',
    category: 'logic',
    icon: 'arrow-path',
    color: '#06B6D4',
    handles: {
      source: true,
      target: true,
    },
    formSchema: [
      {
        name: 'label',
        label: 'Transform Label',
        type: 'text',
        required: true,
        placeholder: 'Enter transform name',
        validation: yup.string().required('Label is required'),
      },
      {
        name: 'operation',
        label: 'Operation',
        type: 'select',
        required: true,
        options: [
          { label: 'Map Fields', value: 'map' },
          { label: 'Filter Data', value: 'filter' },
          { label: 'Convert Format', value: 'convert' },
          { label: 'Extract Values', value: 'extract' },
          { label: 'Merge Objects', value: 'merge' },
        ],
        validation: yup.string().required('Operation is required'),
      },
      {
        name: 'mapping',
        label: 'Transformation Rules (JSON)',
        type: 'textarea',
        required: true,
        placeholder: '{"newField": "oldField", "calculated": "field1 + field2"}',
        validation: yup.string().required('Mapping is required'),
      },
    ],
  },
}

export const getNodeTypeConfig = (nodeType: NodeType): NodeTypeConfig => {
  return NODE_CONFIGURATIONS[nodeType]
}

export const getNodesByCategory = () => {
  const categories = {
    trigger: [] as NodeTypeConfig[],
    action: [] as NodeTypeConfig[],
    logic: [] as NodeTypeConfig[],
  }
  
  Object.values(NODE_CONFIGURATIONS).forEach(config => {
    categories[config.category].push(config)
  })
  
  return categories
}
