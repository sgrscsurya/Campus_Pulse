# Razorpay Payment Integration Guide for Campus Pulse

This guide will help you integrate Razorpay payment gateway for paid event registrations in Campus Pulse.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Razorpay Account Setup](#razorpay-account-setup)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Testing](#testing)
6. [Going Live](#going-live)

---

## Prerequisites

- Campus Pulse application running
- Node.js and Python installed
- Active Razorpay account (or create one at https://razorpay.com)

---

## Razorpay Account Setup

### Step 1: Create Razorpay Account

1. Go to https://razorpay.com
2. Click on "Sign Up" and complete the registration
3. Verify your email address
4. Complete your business profile (required for live mode)

### Step 2: Get API Keys

1. Log in to your Razorpay Dashboard
2. Navigate to **Settings** → **API Keys**
3. Generate Test Keys for development:
   - Test Key ID (starts with `rzp_test_`)
   - Test Secret Key
4. **IMPORTANT**: Keep these keys secure and never commit them to version control

### Step 3: Store API Keys

Add the following to your `/app/backend/.env` file:

```bash
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_SECRET_KEY=YOUR_SECRET_KEY
```

Add to your `/app/frontend/.env` file:

```bash
REACT_APP_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
```

---

## Backend Integration

### Step 1: Install Razorpay Python SDK

```bash
cd /app/backend
pip install razorpay
pip freeze > requirements.txt
```

### Step 2: Update Backend Code

Add the following imports to `server.py`:

```python
import razorpay
from datetime import datetime, timezone
```

Initialize Razorpay client (add after database initialization):

```python
# Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_SECRET_KEY'))
)
```

### Step 3: Add Payment Models

Add to your Pydantic models:

```python
class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: str
    amount: float
    currency: str = "INR"
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    status: str = "pending"  # pending, completed, failed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentCreate(BaseModel):
    event_id: str
    amount: float

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
```

### Step 4: Add Payment Endpoints

Add these routes to `server.py`:

```python
import hmac
import hashlib

# Create Order
@api_router.post("/payments/create-order")
async def create_payment_order(
    payment_data: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Get event details
        event = await db.events.find_one({"id": payment_data.event_id}, {"_id": 0})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Create Razorpay order
        order_data = {
            "amount": int(payment_data.amount * 100),  # Amount in paise
            "currency": "INR",
            "receipt": f"event_{payment_data.event_id}_{current_user['id']}",
            "notes": {
                "event_id": payment_data.event_id,
                "event_title": event['title'],
                "user_id": current_user['id'],
                "user_email": current_user['email']
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Save payment record
        payment = Payment(
            user_id=current_user['id'],
            event_id=payment_data.event_id,
            amount=payment_data.amount,
            razorpay_order_id=razorpay_order['id']
        )
        
        await db.payments.insert_one(payment.model_dump())
        
        return {
            "order_id": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "key_id": os.environ.get('RAZORPAY_KEY_ID')
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Verify Payment
@api_router.post("/payments/verify")
async def verify_payment(
    payment_verify: PaymentVerify,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Verify signature
        generated_signature = hmac.new(
            os.environ.get('RAZORPAY_SECRET_KEY').encode(),
            f"{payment_verify.razorpay_order_id}|{payment_verify.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != payment_verify.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Update payment record
        await db.payments.update_one(
            {"razorpay_order_id": payment_verify.razorpay_order_id},
            {
                "$set": {
                    "razorpay_payment_id": payment_verify.razorpay_payment_id,
                    "razorpay_signature": payment_verify.razorpay_signature,
                    "status": "completed"
                }
            }
        )
        
        # Get payment details
        payment = await db.payments.find_one(
            {"razorpay_order_id": payment_verify.razorpay_order_id},
            {"_id": 0}
        )
        
        if payment:
            # Auto-register user for the event
            event = await db.events.find_one({"id": payment['event_id']}, {"_id": 0})
            
            registration = Registration(
                event_id=payment['event_id'],
                user_id=current_user['id'],
                user_name=current_user['name'],
                user_email=current_user['email'],
                qr_code=generate_qr_code(f"{payment['event_id']}:{current_user['id']}")
            )
            
            await db.registrations.insert_one(registration.model_dump())
            await db.events.update_one(
                {"id": payment['event_id']},
                {"$inc": {"registered_count": 1}}
            )
            
            await create_notification(
                current_user['id'],
                "Payment Successful",
                f"Your payment for {event['title']} has been processed successfully!"
            )
        
        return {"message": "Payment verified successfully", "status": "completed"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 5: Restart Backend

```bash
sudo supervisorctl restart backend
```

---

## Frontend Integration

### Step 1: Install Razorpay Checkout

Add Razorpay script to `/app/frontend/public/index.html` in the `<head>` section:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 2: Create Payment Handler Component

Create `/app/frontend/src/components/PaymentHandler.js`:

```javascript
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const initiatePayment = async (eventId, amount, token, onSuccess) => {
  try {
    // Create order
    const orderResponse = await axios.post(
      `${API}/payments/create-order`,
      { event_id: eventId, amount },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { order_id, key_id, currency } = orderResponse.data;

    // Razorpay options
    const options = {
      key: key_id,
      amount: amount * 100,
      currency: currency,
      name: 'Campus Pulse',
      description: 'Event Registration Payment',
      order_id: order_id,
      handler: async function (response) {
        try {
          // Verify payment
          await axios.post(
            `${API}/payments/verify`,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success('Payment successful! You are now registered.');
          if (onSuccess) onSuccess();
        } catch (error) {
          toast.error('Payment verification failed');
        }
      },
      prefill: {
        email: 'user@example.com',
      },
      theme: {
        color: '#6366f1',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    toast.error('Failed to initiate payment');
  }
};
```

### Step 3: Update Event Registration

In your `EventDetails.js` page, modify the registration handler:

```javascript
import { initiatePayment } from '../components/PaymentHandler';

const handleRegister = async () => {
  if (event.cost > 0) {
    // Paid event - initiate payment
    await initiatePayment(event.id, event.cost, token, () => {
      setIsRegistered(true);
      fetchEventDetails();
    });
  } else {
    // Free event - direct registration
    try {
      await axios.post(`${API}/registrations/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Successfully registered for event!');
      setIsRegistered(true);
      fetchEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  }
};
```

### Step 4: Restart Frontend

```bash
sudo supervisorctl restart frontend
```

---

## Testing

### Test Mode Cards

Use these test cards for testing payments:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Failed Payment:**
- Card Number: `4111 1111 1111 1112`

**UPI Testing:**
- UPI ID: `success@razorpay`

### Test Flow

1. Create a paid event as organizer (e.g., $10 entry fee)
2. Login as a student
3. Navigate to the event details
4. Click "Register Now"
5. Complete payment using test card
6. Verify registration and QR ticket generation

---

## Going Live

### Step 1: Complete KYC

1. Submit business documents to Razorpay
2. Wait for verification (2-3 business days)
3. Complete bank account verification

### Step 2: Generate Live Keys

1. Navigate to **Settings** → **API Keys**
2. Click "Generate Live Keys"
3. Note down:
   - Live Key ID (starts with `rzp_live_`)
   - Live Secret Key

### Step 3: Update Environment Variables

Replace test keys with live keys in `.env` files:

```bash
# Backend
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_SECRET_KEY=YOUR_LIVE_SECRET_KEY

# Frontend
REACT_APP_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
```

### Step 4: Restart Services

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

---

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Always verify payment signatures** on the backend
3. **Use HTTPS** in production
4. **Implement rate limiting** on payment endpoints
5. **Log all payment transactions** for audit purposes
6. **Handle webhooks** for automatic payment status updates

---

## Webhook Integration (Optional)

To handle payment status updates automatically:

### Step 1: Create Webhook Endpoint

```python
@api_router.post("/payments/webhook")
async def payment_webhook(request: Request):
    try:
        webhook_body = await request.body()
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        
        # Verify webhook signature
        razorpay_client.utility.verify_webhook_signature(
            webhook_body.decode(),
            webhook_signature,
            os.environ.get('RAZORPAY_WEBHOOK_SECRET')
        )
        
        # Process webhook event
        data = await request.json()
        event_type = data.get('event')
        
        if event_type == 'payment.captured':
            # Handle successful payment
            pass
        elif event_type == 'payment.failed':
            # Handle failed payment
            pass
        
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Step 2: Configure Webhook in Dashboard

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Select events to listen for
4. Save webhook secret to `.env`

---

## Troubleshooting

### Common Issues

1. **"Invalid Key" Error**
   - Verify API keys are correct
   - Ensure keys match the environment (test/live)

2. **Payment Not Completing**
   - Check browser console for errors
   - Verify Razorpay script is loaded
   - Check backend logs for signature verification errors

3. **Signature Verification Failed**
   - Ensure secret key is correct
   - Check that order_id and payment_id match

---

## Support

- Razorpay Documentation: https://razorpay.com/docs
- Razorpay Support: https://razorpay.com/support
- Campus Pulse Issues: Contact your development team

---

**Last Updated:** January 2025
**Integration Guide Version:** 1.0