# Email Notification Setup Guide for Campus Pulse

This guide will help you integrate email notifications for event reminders, registrations, and updates in Campus Pulse.

## Table of Contents
1. [Email Service Options](#email-service-options)
2. [SendGrid Integration](#sendgrid-integration)
3. [Gmail SMTP Integration](#gmail-smtp-integration)
4. [AWS SES Integration](#aws-ses-integration)
5. [Implementation](#implementation)
6. [Email Templates](#email-templates)
7. [Testing](#testing)

---

## Email Service Options

Choose one of these email service providers:

1. **SendGrid** (Recommended)
   - Free tier: 100 emails/day
   - Easy setup and reliable
   - Good documentation

2. **Gmail SMTP**
   - Free but limited (500 emails/day)
   - Good for development
   - Requires app password

3. **AWS SES**
   - Very cheap ($0.10 per 1000 emails)
   - Requires AWS account
   - Production-grade

---

## SendGrid Integration

### Step 1: Create SendGrid Account

1. Go to https://signup.sendgrid.com
2. Sign up for a free account
3. Verify your email address
4. Complete sender authentication

### Step 2: Create API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it "Campus Pulse"
4. Select **Full Access** or **Restricted Access** (Mail Send)
5. Click **Create & View**
6. Copy the API key (you won't see it again!)

### Step 3: Verify Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - From Name: Campus Pulse
   - From Email: noreply@yourdomain.com
   - Reply To: support@yourdomain.com
4. Verify the email address

### Step 4: Configure Environment Variables

Add to `/app/backend/.env`:

```bash
SENDGRID_API_KEY=SG.YOUR_API_KEY_HERE
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME="Campus Pulse"
```

### Step 5: Install SendGrid Python SDK

```bash
cd /app/backend
pip install sendgrid
pip freeze > requirements.txt
```

### Step 6: Add Email Service Code

Create `/app/backend/email_service.py`:

```python
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.environ.get('SENDGRID_API_KEY')
        self.from_email = os.environ.get('FROM_EMAIL')
        self.from_name = os.environ.get('FROM_NAME', 'Campus Pulse')
        self.client = SendGridAPIClient(self.api_key) if self.api_key else None
    
    async def send_email(self, to_email: str, subject: str, html_content: str):
        if not self.client:
            logger.warning("SendGrid not configured. Email not sent.")
            return False
        
        try:
            message = Mail(
                from_email=Email(self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            response = self.client.send(message)
            logger.info(f"Email sent to {to_email}. Status: {response.status_code}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_registration_confirmation(self, user_email: str, user_name: str, event_title: str, event_date: str, event_venue: str):
        subject = f"Registration Confirmed: {event_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Campus Pulse</h1>
                </div>
                <div style="padding: 40px; background: #f8fafc;">
                    <h2>Hi {user_name},</h2>
                    <p>You have successfully registered for:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #667eea;">{event_title}</h3>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {event_date}</p>
                        <p style="margin: 5px 0;"><strong>Venue:</strong> {event_venue}</p>
                    </div>
                    <p>Your QR ticket is ready! Log in to Campus Pulse to view your ticket.</p>
                    <a href="https://your-campus-pulse-domain.com/my-tickets" 
                       style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 20px 0;">View My Tickets</a>
                    <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
                        See you at the event!<br>
                        Team Campus Pulse
                    </p>
                </div>
            </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)
    
    async def send_event_reminder(self, user_email: str, user_name: str, event_title: str, event_date: str, event_venue: str):
        subject = f"Reminder: {event_title} is coming up!"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Campus Pulse</h1>
                </div>
                <div style="padding: 40px; background: #f8fafc;">
                    <h2>Hi {user_name},</h2>
                    <p>This is a reminder that your registered event is coming up soon:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #667eea;">{event_title}</h3>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {event_date}</p>
                        <p style="margin: 5px 0;"><strong>Venue:</strong> {event_venue}</p>
                    </div>
                    <p>Don't forget to bring your QR ticket for check-in!</p>
                    <a href="https://your-campus-pulse-domain.com/my-tickets" 
                       style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 20px 0;">View My Tickets</a>
                    <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
                        We look forward to seeing you!<br>
                        Team Campus Pulse
                    </p>
                </div>
            </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)
    
    async def send_event_update(self, user_email: str, user_name: str, event_title: str, update_message: str):
        subject = f"Update: {event_title}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Campus Pulse</h1>
                </div>
                <div style="padding: 40px; background: #f8fafc;">
                    <h2>Hi {user_name},</h2>
                    <p>There's an update regarding your registered event:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #667eea;">{event_title}</h3>
                        <p style="margin: 15px 0; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
                            {update_message}
                        </p>
                    </div>
                    <a href="https://your-campus-pulse-domain.com/my-tickets" 
                       style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 20px 0;">View Event Details</a>
                    <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
                        Thanks for your attention!<br>
                        Team Campus Pulse
                    </p>
                </div>
            </body>
        </html>
        """
        return await self.send_email(user_email, subject, html_content)

# Initialize email service
email_service = EmailService()
```

### Step 7: Update Server Code

Add to `server.py`:

```python
from email_service import email_service
from datetime import datetime, timezone
from dateutil import parser

# Update registration endpoint to send email
@api_router.post("/registrations/{event_id}")
async def register_for_event(event_id: str, current_user: dict = Depends(get_current_user)):
    # ... existing registration code ...
    
    # Send confirmation email
    event_date = parser.parse(event['start_date']).strftime('%B %d, %Y at %I:%M %p')
    await email_service.send_registration_confirmation(
        current_user['email'],
        current_user['name'],
        event['title'],
        event_date,
        event['venue']
    )
    
    return registration
```

### Step 8: Restart Backend

```bash
pip install python-dateutil
pip freeze > requirements.txt
sudo supervisorctl restart backend
```

---

## Gmail SMTP Integration

### Step 1: Enable 2-Factor Authentication

1. Go to Google Account settings
2. Security → 2-Step Verification
3. Enable 2-step verification

### Step 2: Generate App Password

1. Go to Security → 2-Step Verification → App passwords
2. Select "Mail" and "Other"
3. Name it "Campus Pulse"
4. Click **Generate**
5. Copy the 16-character password

### Step 3: Configure Environment

Add to `/app/backend/.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your.email@gmail.com
FROM_NAME="Campus Pulse"
```

### Step 4: Install Dependencies

```bash
pip install aiosmtplib
pip freeze > requirements.txt
```

### Step 5: Create SMTP Email Service

Create `/app/backend/smtp_email_service.py`:

```python
import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

class SMTPEmailService:
    def __init__(self):
        self.smtp_host = os.environ.get('SMTP_HOST')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_user = os.environ.get('SMTP_USER')
        self.smtp_password = os.environ.get('SMTP_PASSWORD')
        self.from_email = os.environ.get('FROM_EMAIL')
        self.from_name = os.environ.get('FROM_NAME', 'Campus Pulse')
    
    async def send_email(self, to_email: str, subject: str, html_content: str):
        try:
            message = MIMEMultipart('alternative')
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            message['Subject'] = subject
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True
            )
            
            logger.info(f"Email sent to {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    # Add same methods as SendGrid service above
```

---

## AWS SES Integration

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Create an account or sign in
3. Navigate to Amazon SES

### Step 2: Verify Email Address

1. Go to **Verified identities**
2. Click **Create identity**
3. Select **Email address**
4. Enter your email
5. Verify the email

### Step 3: Create IAM User

1. Go to IAM Console
2. Create new user with **Programmatic access**
3. Attach policy: **AmazonSESFullAccess**
4. Save Access Key ID and Secret Access Key

### Step 4: Configure Environment

Add to `/app/backend/.env`:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
FROM_EMAIL=verified@yourdomain.com
FROM_NAME="Campus Pulse"
```

### Step 5: Install Boto3

```bash
pip install boto3
pip freeze > requirements.txt
```

### Step 6: Create SES Email Service

```python
import boto3
from botocore.exceptions import ClientError

class SESEmailService:
    def __init__(self):
        self.client = boto3.client(
            'ses',
            region_name=os.environ.get('AWS_REGION'),
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
        )
        self.from_email = os.environ.get('FROM_EMAIL')
    
    async def send_email(self, to_email: str, subject: str, html_content: str):
        try:
            response = self.client.send_email(
                Source=self.from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {'Html': {'Data': html_content}}
                }
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to send email: {e.response['Error']['Message']}")
            return False
```

---

## Scheduled Email Reminders

To send automated event reminders, create a background task:

```python
import asyncio
from datetime import datetime, timedelta, timezone

async def send_event_reminders():
    while True:
        try:
            # Get events happening in next 24 hours
            tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
            events = await db.events.find({
                "start_date": {
                    "$gte": datetime.now(timezone.utc).isoformat(),
                    "$lte": tomorrow.isoformat()
                }
            }).to_list(1000)
            
            for event in events:
                # Get all registrations
                registrations = await db.registrations.find({
                    "event_id": event['id']
                }).to_list(1000)
                
                # Send reminder to each registered user
                for reg in registrations:
                    event_date = parser.parse(event['start_date']).strftime('%B %d, %Y at %I:%M %p')
                    await email_service.send_event_reminder(
                        reg['user_email'],
                        reg['user_name'],
                        event['title'],
                        event_date,
                        event['venue']
                    )
            
            # Sleep for 1 hour
            await asyncio.sleep(3600)
        
        except Exception as e:
            logger.error(f"Error in reminder task: {str(e)}")
            await asyncio.sleep(3600)

# Start background task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(send_event_reminders())
```

---

## Testing

### Test Email Sending

Create a test endpoint:

```python
@api_router.get("/test-email")
async def test_email(email: str):
    success = await email_service.send_email(
        email,
        "Test Email from Campus Pulse",
        "<h1>Test Email</h1><p>If you receive this, email service is working!</p>"
    )
    return {"success": success}
```

Test it:
```bash
curl "http://localhost:8001/api/test-email?email=your@email.com"
```

---

## Troubleshooting

### Common Issues

1. **Emails going to spam**
   - Set up SPF, DKIM, and DMARC records
   - Use verified domain email
   - Add unsubscribe link

2. **SendGrid API errors**
   - Verify API key is correct
   - Check sender is verified
   - Review SendGrid activity logs

3. **Gmail blocking**
   - Use app password, not regular password
   - Check "Less secure app access" is enabled
   - Verify 2FA is enabled

---

## Best Practices

1. **Respect user preferences** - Allow users to opt-out
2. **Rate limiting** - Don't send too many emails at once
3. **Error handling** - Log failures and retry
4. **Personalization** - Use user's name and preferences
5. **Responsive design** - Email templates should work on mobile
6. **Unsubscribe link** - Always include option to unsubscribe

---

## Support

- SendGrid Docs: https://docs.sendgrid.com
- Gmail SMTP: https://support.google.com/mail/answer/7126229
- AWS SES Docs: https://docs.aws.amazon.com/ses

---

**Last Updated:** January 2025
**Integration Guide Version:** 1.0