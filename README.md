# Subscription Management System

A comprehensive subscription management system with automated billing, payment processing via Paystack, email notifications, and currency conversion (USD to NGN).

## Features

- **Client Management**: Complete CRUD operations for customer data
- **Subscription Management**: Flexible monthly/yearly billing cycles
- **Automated Invoicing**: Generate invoices with unique numbers
- **Payment Processing**: Seamless Paystack integration
- **Currency Conversion**: Real-time USD to NGN conversion
- **Email Notifications**: Professional HTML email templates
- **Scheduled Reminders**: Automatic payment reminders
- **Dashboard Analytics**: Comprehensive business metrics
- **Webhook Integration**: Real-time payment status updates


## Screenshots

<img width="1314" height="897" alt="image" src="https://github.com/user-attachments/assets/a9688471-b435-4fb9-952b-e69fb5e5f2f6" />

<img width="1652" height="902" alt="image" src="https://github.com/user-attachments/assets/eda2cba3-9904-4dcc-83ba-1a241c2532a8" />

<img width="1604" height="439" alt="image" src="https://github.com/user-attachments/assets/c189ffbf-9082-4cd5-8e27-9ea8771362da" />

<img width="1426" height="546" alt="image" src="https://github.com/user-attachments/assets/114ef489-40f5-40f4-8303-f9852355f917" />

<img width="1477" height="693" alt="image" src="https://github.com/user-attachments/assets/e6a5c44f-3809-4c51-bfab-47c5924a4821" />

<img width="631" height="1548" alt="image" src="https://github.com/user-attachments/assets/80cd6847-e2a5-4d3a-8601-609dfbcba705" />


## Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Paystack** for payment processing
- **Nodemailer** for email services
- **Node-cron** for scheduled tasks
- **Winston** for logging

### Frontend

- **React.js** with hooks
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons
- **Recharts** for analytics

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Paystack account
- Gmail account (for emails) or other SMTP service

## Quick Start

### 1. Clone and Setup

```bash
# Extract the zip file
unzip subscription-management.zip
cd subscription-management

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your settings:

```env
MONGODB_URI=mongodb://localhost:27017/subscription_db
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_PUBLIC_KEY=pk_test_your_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 3. Start Services

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm start
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health
- Login Credentials: admin@example.com / admin123

## API Documentation

### Clients

- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Subscriptions

- `GET /api/subscriptions` - List all subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `POST /api/subscriptions/:id/send-reminder` - Send reminder email

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/exchange-rate` - Get current USD/NGN rate

## Automated Features

### Daily Scheduled Tasks

- **9:00 AM**: Check subscriptions due in 3 days and send reminders
- **12:00 AM**: Update expired subscriptions status

### Payment Workflow

1. Invoice generated with unique number
2. Payment link created via Paystack API
3. Email sent to customer with payment details
4. Webhook processes successful payments
5. Subscription renewed automatically

## Configuration Guide

### Email Setup (Gmail)

1. Enable 2-Factor Authentication
2. Generate App Password
3. Use app password in EMAIL_PASS

### Paystack Setup

1. Create Paystack account
2. Get test/live API keys
3. Configure webhook URL: `your-domain.com/api/webhook/paystack`
4. Set webhook events: `charge.success`

### MongoDB Setup
**Local:**
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community
# Start service
brew services start mongodb-community
```

**Atlas (Cloud):**

1. Create MongoDB Atlas account
2. Create cluster and database
3. Get connection string
4. Update MONGODB_URI in .env

## Deployment

### Using Docker

```bash
docker-compose up -d
```

### Manual Deployment

1. **Backend** (on platforms like Heroku, Railway, DigitalOcean)
2. **Frontend** (on Vercel, Netlify, AWS S3)
3. **Database** (MongoDB Atlas recommended)

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas
- [ ] Configure proper CORS origins
- [ ] Set up SSL/HTTPS
- [ ] Configure domain for webhooks
- [ ] Set up monitoring and logging
- [ ] Backup strategy for database

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Documentation](https://reactjs.org/docs/)

## Support

For support and questions:

- Create an issue in the repository
- Email: <support@focuslinkstech.com.ng>

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Coding!**
