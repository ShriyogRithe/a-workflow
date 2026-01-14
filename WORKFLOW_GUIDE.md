# Complete Workflow Guide: Lead Processing with Conditional Branching

This guide shows you how to build a complete workflow for lead processing with conditional branching based on CRM response status.

## Workflow Overview

**Flow**: Webhook trigger (new lead) → Send Email (welcome) → Delay (1 hour) → HTTP Request (add lead to CRM) → Condition (if response.status == 200) → True branch: Send SMS (success message) → False branch: Send SMS (error alert to support)

## Step-by-Step Instructions

### Step 1: Add Webhook Trigger (New Lead)

1. **Drag** the "Webhook Trigger" from the TRIGGER section to the canvas
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   Webhook Label: "New Lead Webhook"
   Webhook Path: "/webhook/new-lead"
   HTTP Method: "POST"
   Require Authentication: ✓ (checked)
   ```

### Step 2: Add Send Email (Welcome)

1. **Drag** the "Send Email" from the ACTION section to the canvas (to the right of the webhook)
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   Email Label: "Welcome Email"
   To Email: "{{webhook.body.email}}" (use lead's email from webhook)
   Subject: "Welcome to Our Service!"
   Email Body: "Hi {{webhook.body.name}}, welcome! We're excited to have you on board."
   From Name: "Your Company"
   ```

### Step 3: Add Delay (1 Hour)

1. **Drag** the "Delay" from the ACTION section to the canvas
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   Delay Label: "Wait 1 Hour"
   Duration: 1
   Time Unit: "Hours"
   ```

### Step 4: Add HTTP Request (Add to CRM)

1. **Drag** the "HTTP Request" from the ACTION section to the canvas
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   Request Label: "Add Lead to CRM"
   URL: "https://your-crm.com/api/leads"
   HTTP Method: "POST"
   Headers (JSON): {
     "Content-Type": "application/json",
     "Authorization": "Bearer YOUR_CRM_API_TOKEN"
   }
   Request Body: {
     "name": "{{webhook.body.name}}",
     "email": "{{webhook.body.email}}",
     "phone": "{{webhook.body.phone}}",
     "source": "website"
   }
   Timeout (seconds): 30
   ```

### Step 5: Add Condition (Check CRM Response)

1. **Drag** the "Condition" from the LOGIC section to the canvas
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   Condition Label: "Check CRM Success"
   Field to Check: "http_request.response.status"
   Operator: "Equals (==)"
   Value to Compare: "200"
   ```

### Step 6: Add Success SMS (True Branch)

1. **Drag** the "Send SMS" from the ACTION section to the canvas (above the condition)
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   SMS Label: "Success Notification"
   Phone Number: "{{webhook.body.phone}}"
   Message: "Hi {{webhook.body.name}}! Your account has been successfully created. Welcome aboard!"
   ```

### Step 7: Add Error SMS (False Branch)

1. **Drag** another "Send SMS" from the ACTION section to the canvas (below the condition)
2. **Click** on the node to configure it
3. **Configure** with these settings:
   ```
   SMS Label: "Error Alert"
   Phone Number: "+1234567890" (your support team's number)
   Message: "ALERT: Failed to add lead {{webhook.body.name}} ({{webhook.body.email}}) to CRM. Status: {{http_request.response.status}}"
   ```

## Step 8: Connect the Nodes

Connect the nodes in this order using the connection handles (drag from the right handle of one node to the left handle of the next):

1. **Webhook Trigger** → **Send Email**
2. **Send Email** → **Delay**
3. **Delay** → **HTTP Request**
4. **HTTP Request** → **Condition**
5. **Condition** (True output) → **Success SMS**
6. **Condition** (False output) → **Error SMS**

## Step 9: Test Your Workflow

1. **Click** the "Save" button to save your workflow
2. **Use the webhook URL** to test with sample data:
   ```json
   POST /webhook/new-lead
   {
     "name": "John Doe",
     "email": "john@example.com",
     "phone": "+1234567890"
   }
   ```

## How to View HTTP Request Results

After running the workflow:

1. **Look for the HTTP Request node** that shows a green status indicator (success)
2. **Click the "View API Response" button** that appears on the HTTP Request node
3. **In the modal**, you can see:
   - **Execution Logs**: Step-by-step execution details
   - **API Response**: Full response from your CRM including status, headers, and response body
   - **Configuration**: The exact settings used for the request

## Understanding Variable References

In your configurations, you can reference data from previous steps:

- `{{webhook.body.field_name}}` - Data from the webhook payload
- `{{http_request.response.status}}` - HTTP response status code
- `{{http_request.response.data.field}}` - Response data fields
- `{{delay.completed_at}}` - Timestamp when delay finished

## Advanced Tips

### Error Handling
- The condition node automatically creates two branches (True/False)
- You can add multiple conditions for complex logic
- Use the Transform Data node to modify data between steps

### Monitoring
- Each node shows its execution status with colored indicators
- Green = Success, Red = Error, Blue = Running
- Click "View All" on any node to see detailed execution logs

### Webhook Security
- Always enable "Require Authentication" for production webhooks
- Use HTTPS URLs for all external API calls
- Store sensitive data like API tokens in environment variables

This workflow provides a complete lead processing system with error handling and notifications for both success and failure scenarios.
