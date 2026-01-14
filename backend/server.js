import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body, fromName, fromEmail, toName, replyTo } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, body'
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        error: 'Email server not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: fromEmail ? `"${fromName || 'Workflow Builder'}" <${fromEmail}>` : `"${fromName || 'Workflow Builder'}" <${process.env.EMAIL_USER}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      replyTo: replyTo || fromEmail || process.env.EMAIL_USER
    };

    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      to: to,
      subject: subject,
      timestamp: new Date().toISOString(),
      provider: 'nodemailer-smtp',
      response: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        envelope: info.envelope
      }
    });

  } catch (error) {
    console.error('Email sending failed:', error);

    let errorMessage = 'Unknown error occurred';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check EMAIL_USER and EMAIL_PASS credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Check SMTP server settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: `Email sending failed: ${errorMessage}`,
      code: error.code
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'workflow-builder-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

app.get('/api/test-email-config', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.'
      });
    }

    const transporter = createTransporter();
    const verified = await transporter.verify();

    if (verified) {
      res.json({
        success: true,
        message: 'Email configuration is valid',
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.EMAIL_USER
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Email configuration verification failed'
      });
    }
  } catch (error) {
    console.error('Email config test failed:', error);
    res.status(500).json({
      success: false,
      error: `Email configuration test failed: ${error.message}`,
      code: error.code
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/send-email',
      'GET /api/health',
      'GET /api/test-email-config'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Workflow Builder Backend running on port ${PORT}`);
  console.log(`📧 Email configuration: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🌐 CORS enabled for frontend communication`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/send-email`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/test-email-config`);
});
