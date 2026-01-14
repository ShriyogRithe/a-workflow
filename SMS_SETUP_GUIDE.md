# SMS Setup Guide - How to Send Real SMS Messages

## 🚨 Problem Fixed: SMS Not Sending to Mobile

The SMS node was previously only simulating message sending. I've now implemented **real SMS functionality** with actual API integrations.

## 📱 SMS Provider Setup Instructions

### Option 1: Twilio (Recommended)

#### **Step 1: Create Twilio Account**
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for free account (includes trial credits)
3. Verify your phone number

#### **Step 2: Get Credentials**
1. Go to Twilio Console Dashboard
2. Find your **Account SID** and **Auth Token**
3. Purchase a phone number (or use trial number)

#### **Step 3: Configure SMS Node**
```json
{
  "label": "Send SMS Notification",
  "provider": "twilio",
  "apiKey": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "apiSecret": "your_auth_token_here",
  "from": "+15551234567",
  "to": "+15559876543",
  "message": "Hello! Your workflow executed successfully."
}
```

### Option 2: ClickSend

#### **Step 1: Create ClickSend Account**
1. Go to [clicksend.com](https://www.clicksend.com)
2. Sign up and verify account
3. Add credits to your account

#### **Step 2: Get API Credentials**
1. Go to Dashboard → API Credentials
2. Copy your **Username** and **API Key**

#### **Step 3: Configure SMS Node**
```json
{
  "label": "Send SMS Alert",
  "provider": "clicksend", 
  "apiKey": "your_clicksend_username",
  "apiSecret": "your_clicksend_api_key",
  "to": "+15559876543",
  "message": "Alert: Your CRM integration failed!"
}
```

## 🔧 SMS Node Configuration Fields

### **Required Fields:**
- **Provider**: `twilio` or `clicksend`
- **API Key**: Your provider's account identifier
- **API Secret**: Your provider's authentication token
- **To**: Recipient phone number (E.164 format: +1234567890)
- **Message**: SMS text content

### **Optional Fields:**
- **From**: Sender phone number (required for Twilio)
- **Label**: Description of the SMS action

## 📋 Environment Variables (Recommended)

Instead of hardcoding credentials, use environment variables:

### **Create `.env` file:**
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+15551234567

# ClickSend Configuration  
CLICKSEND_USERNAME=your_username
CLICKSEND_API_KEY=your_api_key
```

### **SMS Node Configuration with Env Variables:**
```json
{
  "label": "Send SMS",
  "provider": "twilio",
  "to": "+15559876543", 
  "message": "Your account has been created successfully!"
}
```
*The system will automatically use environment variables for credentials*

## 🌊 Real Example Workflow

### **Complete Lead Processing with SMS:**

1. **Webhook Trigger** → New lead received
2. **HTTP Request** → Add lead to CRM
3. **Condition** → Check if CRM success (status == 200)
4. **SMS (Success Branch)** → Notify customer: "Welcome! Account created."
5. **SMS (Error Branch)** → Alert support: "CRM integration failed for lead {{name}}"

### **Success SMS Configuration:**
```json
{
  "label": "Customer Welcome SMS",
  "provider": "twilio",
  "to": "{{webhook.body.phone}}",
  "message": "Hi {{webhook.body.name}}! Welcome to our service. Your account ID is {{http_request.response.data.id}}"
}
```

### **Error SMS Configuration:**
```json
{
  "label": "Support Alert SMS", 
  "provider": "twilio",
  "to": "+1234567890",
  "message": "ALERT: Failed to add lead {{webhook.body.name}} ({{webhook.body.email}}) to CRM. Status: {{http_request.response.status}}"
}
```

## 🔍 How to View SMS Results

After SMS execution:

1. **Check node status** - Green = sent successfully, Red = failed
2. **Click "View All"** on execution logs to see:
   - SMS provider API request details
   - Response from SMS service
   - Message ID and delivery status
   - Cost information
   - Error details (if failed)

## 📊 SMS Response Data Structure

**Successful Twilio SMS:**
```json
{
  "sent": true,
  "provider": "twilio",
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "cost": "-0.0075",
  "response": {
    "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "status": "queued",
    "to": "+15559876543",
    "from": "+15551234567"
  }
}
```

## ⚠️ Common Issues & Solutions

### **Issue: "SMS service not configured"**
**Solution:** Add API credentials to SMS node configuration

### **Issue: "Invalid phone number format"** 
**Solution:** Use E.164 format: +1234567890 (include country code)

### **Issue: "Twilio API error: 21211"**
**Solution:** Invalid 'To' phone number format

### **Issue: "Insufficient funds"**
**Solution:** Add credits to your SMS provider account

### **Issue: "Network error"**
**Solution:** Check internet connection and API endpoint availability

## 🎯 Best Practices

1. **Use Environment Variables** for API credentials (never hardcode)
2. **Validate Phone Numbers** before sending SMS
3. **Handle Rate Limits** - don't send too many SMS too quickly  
4. **Monitor Costs** - each SMS costs money
5. **Test with Trial Numbers** first before production
6. **Include Opt-out Instructions** for marketing messages
7. **Keep Messages Under 160 characters** to avoid additional charges

## 🚀 Testing Your SMS Setup

1. **Configure SMS node** with your provider credentials
2. **Add a test phone number** (your own number for testing)
3. **Create simple workflow**: Manual Trigger → SMS Node
4. **Execute workflow** and check if you receive the SMS
5. **Check execution logs** for detailed API responses

Your SMS functionality is now **fully operational** and will send real messages to mobile phones! 📱✅
