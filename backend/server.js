import express, { json, urlencoded } from "express";
import { connect, Schema, model } from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { schedule } from "node-cron";
import nodemailer from "nodemailer";
import axios from "axios"; 
import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken";
import Joi from "joi"; 
import dotenv from "dotenv"; 

dotenv.config(); 

const app = express();
const { createTransport } = nodemailer;
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";
const createDefaultAdmin = async () => {
  try {
    const existing = await Admin.findOne({ email: "admin@example.com" });
    if (existing) return;

    const hashedPassword = await bcrypt.hash("admin123", 10); // Change in prod!
    const admin = new Admin({
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "superadmin",
    });
    await admin.save();
    console.log(
      "Default admin created: admin@example.com / password: admin123"
    );
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    exposedHeaders: ["Authorization"],
  })
);
app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: true }));

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.admin = admin; // Attach admin to request
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/subscription_db";

    console.log("Attempting to connect to MongoDB...");
    console.log(
      `Connection URI: ${mongoUri.replace(
        /\/\/([^:]+):([^@]+)@/,
        "//***:***@"
      )}`
    );

    const conn = await connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("Connected to MongoDB");
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}:${conn.connection.port}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    // Provide helpful error messages
    if (error.message.includes("ECONNREFUSED")) {
      console.log("\nTROUBLESHOOTING TIPS:");
      console.log("1. Make sure MongoDB is installed and running locally");
      console.log("2. Try: brew services start mongodb-community (macOS)");
      console.log(
        "3. Or use MongoDB Atlas (cloud): https://cloud.mongodb.com/"
      );
      console.log("4. Update MONGODB_URI in your .env file");
    }

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.log("Running in development mode - continuing without database");
      console.log("Will retry connection in 30 seconds...");
      setTimeout(connectDB, 30000);
    }
  }
};

// Connect to MongoDB
connectDB().then(createDefaultAdmin);


// Database Models
const ClientSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  company: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SubscriptionSchema = new Schema({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  planName: { type: String, required: true },
  priceUSD: { type: Number, required: true },
  duration: { type: String, enum: ["monthly", "yearly"], required: true },
  startDate: { type: Date, required: true },
  nextBilling: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "cancelled", "expired"],
    default: "active",
  },
  paystackCustomerCode: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const InvoiceSchema = new Schema({
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  invoiceNumber: { type: String, required: true, unique: true },
  amountUSD: { type: Number, required: true },
  amountNGN: { type: Number, required: true },
  exchangeRate: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },
  paymentReference: { type: String },
  paystackReference: { type: String },
  paymentLink: { type: String },
  paidAt: { type: Date },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PaymentSchema = new Schema({
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
  },
  paystackReference: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  status: { type: String, required: true },
  channel: { type: String },
  paidAt: { type: Date },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

// Admin Schema
const AdminSchema = new Schema({
  name: { type: String, default: "Admin" },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Utility: Generate JWT
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Create models
const Client = model("Client", ClientSchema);
const Subscription = model("Subscription", SubscriptionSchema);
const Invoice = model("Invoice", InvoiceSchema);
const Payment = model("Payment", PaymentSchema);
const Admin = model("Admin", AdminSchema);

// Email Configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility Functions
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp.slice(-8)}-${random}`;
};

const getExchangeRate = async () => {
  try {
    const response = await axios.get(
      process.env.EXCHANGE_RATE_API ||
        "https://api.exchangerate-api.com/v4/latest/USD"
    );
    return response.data.rates.NGN || 1600;
  } catch (error) {
    console.error("Error fetching exchange rate:", error.message);
    return 1600; // fallback rate
  }
};

const initializePaystackPayment = async (invoice, client) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key not configured");
    }

    const amountInKobo = Math.round(invoice.amountNGN * 100);

    const paymentData = {
      email: client.email,
      amount: amountInKobo,
      currency: "NGN",
      reference: `${invoice.invoiceNumber}-${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_action: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        invoice_id: invoice._id.toString(),
        subscription_id: invoice.subscriptionId.toString(),
        client_id: client._id.toString(),
        invoice_number: invoice.invoiceNumber,
        custom_fields: [
          {
            display_name: "Invoice Number",
            variable_name: "invoice_number",
            value: invoice.invoiceNumber,
          },
        ],
      },
    };

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Payment initialization failed"
    );
  }
};

const sendReminderEmail = async (
  invoice,
  client,
  subscription,
  paymentLink
) => {
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Renewal Reminder</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 10px; 
          overflow: hidden; 
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 30px 20px; }
        .invoice-details { 
          background: #f8f9fa; 
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 8px; 
          border-left: 4px solid #667eea;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin: 8px 0; 
          padding: 5px 0;
        }
        .detail-label { font-weight: 600; color: #555; }
        .detail-value { color: #333; }
        .amount-highlight { 
          font-size: 24px; 
          font-weight: bold; 
          color: #28a745; 
          text-align: center; 
          margin: 20px 0;
        }
        .payment-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #28a745, #20c997); 
          color: white; 
          padding: 15px 40px; 
          text-decoration: none; 
          border-radius: 50px; 
          margin: 25px 0;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: transform 0.3s ease;
        }
        .payment-button:hover { transform: translateY(-2px); }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
          font-size: 14px; 
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }
        .company-info { 
          margin-top: 30px; 
          padding: 20px; 
          background: #f8f9fa; 
          border-radius: 8px; 
          text-align: center;
        }
        .urgent { 
          background: #fff3cd; 
          border: 1px solid #ffeaa7; 
          color: #856404; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Renewal</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your service renewal is due</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; margin-bottom: 10px;">Hello <strong>${
            client.name
          }</strong>,</p>
          <p>We hope you've been enjoying our ${
            subscription.planName
          } service! Your subscription is due for renewal.</p>
          
          <div class="urgent">
            <strong>Action Required:</strong> Please renew your subscription to continue enjoying uninterrupted service.
          </div>

          <div class="invoice-details">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">Invoice Details</h3>
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value"><strong>${
                invoice.invoiceNumber
              }</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${subscription.planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Billing Cycle:</span>
              <span class="detail-value" style="text-transform: capitalize;">${
                subscription.duration
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value"><strong>${new Date(
                invoice.dueDate
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</strong></span>
            </div>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #dee2e6;">
            <div class="amount-highlight">
              $${invoice.amountUSD} USD<br>
              <span style="font-size: 18px; color: #666;">(₦${invoice.amountNGN.toLocaleString()} NGN)</span>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 20px; font-size: 16px;">Ready to continue your subscription?</p>
            <a href="${paymentLink}" class="payment-button">Pay Now - Secure Payment</a>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Why renew?</strong></p>
            <ul style="margin: 10px 0 0 20px; font-size: 14px;">
              <li>Uninterrupted access to premium features</li>
              <li>Priority customer support</li>
              <li>Regular updates and improvements</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
          
          <div class="company-info">
            <p style="margin: 0; font-weight: 600;">${
              process.env.COMPANY_NAME || "Your Company"
            }</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
              ${process.env.COMPANY_EMAIL || "support@yourcompany.com"} | 
              Support Available 24/7
            </p>
          </div>
          
          <p style="margin-top: 20px; text-align: center;">
            <small>Thank you for choosing our services!</small>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">This is an automated reminder. Please do not reply to this email.</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">
            © ${new Date().getFullYear()} ${
    process.env.COMPANY_NAME || "Your Company"
  }. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: {
      name: process.env.COMPANY_NAME || "Subscription Service",
      address: process.env.EMAIL_USER,
    },
    to: client.email,
    subject: `Subscription Renewal Due - ${subscription.planName} - Invoice #${invoice.invoiceNumber}`,
    html: emailTemplate,
    priority: "normal",
  };

  try {
    transporter.sendMail(mailOptions);
    console.log(
      `Reminder email sent to ${client.email} for invoice ${invoice.invoiceNumber}`
    );

    // Update invoice to mark reminder as sent
    await Invoice.findByIdAndUpdate(invoice._id, {
      reminderSent: true,
      reminderSentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Validation Schemas - Use Joi directly
const clientSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  company: Joi.string().max(100).optional().allow(""),
});

const subscriptionSchema = Joi.object({
  clientId: Joi.string().required(),
  planName: Joi.string().min(3).max(100).required(),
  priceUSD: Joi.number().positive().min(1).required(),
  duration: Joi.string().valid("monthly", "yearly").required(),
  startDate: Joi.date().optional(),
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// API Routes
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Update last login
    admin.lastLogin = new Date();
    admin.updatedAt = new Date();
    await admin.save();

    // Generate JWT
    const token = generateToken(admin);

    // Return success (never send password)
    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/invoices/generate", authenticateAdmin, async (req, res) => {
  const { subscriptionId } = req.body;

  try {
    const subscription = await Subscription.findById(subscriptionId).populate(
      "clientId"
    );
    if (!subscription || subscription.status !== "active") {
      return res.status(400).json({ error: "Active subscription not found" });
    }

    // Check if invoice is already due or pending
    const existingInvoice = await Invoice.findOne({
      subscriptionId,
      status: { $in: ["pending", "overdue"] },
    });

    if (existingInvoice) {
      return res.status(400).json({ error: "Pending invoice already exists" });
    }

    // Create new invoice
    const invoice = new Invoice({
      clientId: subscription.clientId._id,
      subscriptionId: subscription._id,
      amountUSD: subscription.priceUSD,
      dueDate: new Date(subscription.nextBillingDate),
      status: "pending",
      invoiceNumber: `INV-${Date.now()}`,
    });

    await invoice.save();

    res.json({
      message: "Invoice generated successfully",
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/payments/verify/:reference",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { reference } = req.params;

      const payment = await Payment.findOne({ paystackReference: reference })
        .populate("invoiceId", "invoiceNumber amountUSD amountNGN")
        .populate("invoiceId.clientId", "name email")
        .populate("invoiceId.subscriptionId", "planName duration");

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Optional: Confirm with Paystack
      const paystackRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (paystackRes.data.data.status !== "success") {
        return res
          .status(400)
          .json({ error: "Payment not successful on Paystack" });
      }

      res.json({
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        receiptUrl: paystackRes.data.data.gateway_response, // or receipt link
        invoiceNumber: payment.invoiceId.invoiceNumber,
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  }
);

app.post("/invoices/generate", authenticateAdmin, async (req, res) => {
  const { subscriptionId } = req.body;

  try {
    const subscription = await Subscription.findById(subscriptionId).populate(
      "clientId"
    );
    if (!subscription || subscription.status !== "active") {
      return res.status(400).json({ error: "Active subscription not found" });
    }

    // Check if invoice is already due or pending
    const existingInvoice = await Invoice.findOne({
      subscriptionId,
      status: { $in: ["pending", "overdue"] },
    });

    if (existingInvoice) {
      return res.status(400).json({ error: "Pending invoice already exists" });
    }

    // Create new invoice
    const invoice = new Invoice({
      clientId: subscription.clientId._id,
      subscriptionId: subscription._id,
      amountUSD: subscription.priceUSD,
      dueDate: new Date(subscription.nextBillingDate),
      status: "pending",
      invoiceNumber: `INV-${Date.now()}`,
    });

    await invoice.save();

    res.json({
      message: "Invoice generated successfully",
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/clients", authenticateAdmin, async (req, res) => {
  try {
    const { error } = clientSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = new Client({
      ...req.body,
      updatedAt: new Date(),
    });
    await client.save();

    console.log(`New client created: ${client.name} (${client.email})`);
    res.status(201).json(client);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Error creating client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/clients", authenticateAdmin, async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/clients/:id", authenticateAdmin, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/clients/:id", authenticateAdmin, async (req, res) => {
  try {
    const { error } = clientSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!client) return res.status(404).json({ error: "Client not found" });

    console.log(`Client updated: ${client.name} (${client.email})`);
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/clients/:id", authenticateAdmin, async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });

    // Also delete related subscriptions and invoices
    await Subscription.deleteMany({ clientId: req.params.id });
    await Invoice.deleteMany({ clientId: req.params.id });

    console.log(`Client deleted: ${client.name} (${client.email})`);
    res.json({ message: "Client and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: error.message });
  }
});

// Subscription Routes
app.post("/subscriptions", authenticateAdmin, async (req, res) => {
  try {
    const { error } = subscriptionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const client = await Client.findById(req.body.clientId);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const startDate = req.body.startDate
      ? new Date(req.body.startDate)
      : new Date();
    const nextBilling = new Date(startDate);

    if (req.body.duration === "monthly") {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    const subscription = new Subscription({
      ...req.body,
      startDate,
      nextBilling,
      updatedAt: new Date(),
    });

    await subscription.save();

    // Create first invoice
    await createInvoiceForSubscription(subscription);

    console.log(
      `New subscription created: ${subscription.planName} for ${client.name}`
    );
    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/subscriptions", authenticateAdmin, async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("clientId", "name email company")
      .sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/subscriptions/:id", authenticateAdmin, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate(
      "clientId"
    );
    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });
    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/subscriptions/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate("clientId");
    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    console.log(`Subscription updated: ${subscription.planName}`);
    res.json(subscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/subscriptions/:id", authenticateAdmin, async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    // Delete related invoices
    await Invoice.deleteMany({ subscriptionId: req.params.id });

    console.log(`Subscription deleted: ${subscription.planName}`);
    res.json({
      message: "Subscription and related invoices deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Invoice Routes
app.get("/invoices", authenticateAdmin, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("clientId", "name email company")
      .populate("subscriptionId", "planName duration")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/invoices/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("clientId")
      .populate("subscriptionId");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create invoice for subscription
const createInvoiceForSubscription = async (subscription) => {
  try {
    const exchangeRate = await getExchangeRate();
    const amountNGN = Math.round(subscription.priceUSD * exchangeRate);
    const fee = amountNGN * 0.05; // 5% payment processing fee
    const totalAmountNGN = amountNGN + fee;

    const invoice = new Invoice({
      subscriptionId: subscription._id,
      clientId: subscription.clientId,
      invoiceNumber: generateInvoiceNumber(),
      amountUSD: subscription.priceUSD,
      amountNGN,
      exchangeRate,
      dueDate: subscription.nextBilling,
      status: "pending",
      totalAmountNGN,
    });

    await invoice.save();

    // Generate payment link
    const client = await Client.findById(subscription.clientId);
    if (client && process.env.PAYSTACK_SECRET_KEY) {
      try {
        const paymentData = await initializePaystackPayment(invoice, client);

        invoice.paymentLink = paymentData.authorization_url;
        invoice.paystackReference = paymentData.reference;
        invoice.totalAmountNGN = totalAmountNGN;

        await invoice.save();

        console.log(
          `Invoice created with payment link: ${invoice.invoiceNumber}`
        );
      } catch (paymentError) {
        console.error("Payment link creation failed:", paymentError.message);
        // Continue without payment link - invoice still created
      }
    }

    return invoice;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

// Send reminder email for subscription
app.post(
  "/subscriptions/:id/send-reminder",
  authenticateAdmin,
  async (req, res) => {
    try {
      const subscription = await Subscription.findById(req.params.id).populate(
        "clientId"
      );
      if (!subscription)
        return res.status(404).json({ error: "Subscription not found" });

      // Find or create pending invoice
      let invoice = await Invoice.findOne({
        subscriptionId: subscription._id,
        status: "pending",
      });

      if (!invoice) {
        invoice = await createInvoiceForSubscription(subscription);
      }

      const emailSent = await sendReminderEmail(
        invoice,
        subscription.clientId,
        subscription,
        invoice.paymentLink
      );

      if (emailSent) {
        res.json({
          message: "Reminder email sent successfully",
          invoice: invoice.invoiceNumber,
          sentTo: subscription.clientId.email,
        });
      } else {
        res.status(500).json({ error: "Failed to send reminder email" });
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Payment webhook from Paystack
app.post("/webhook/paystack", async (req, res) => {
  try {
    const event = req.body;
    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const invoice = await Invoice.findOne({ paystackReference: reference });
      if (invoice) {
        // Update invoice status
        invoice.status = "paid";
        invoice.paidAt = new Date();
        invoice.updatedAt = new Date();
        await invoice.save();

        // Update subscription next billing date
        const subscription = await Subscription.findById(
          invoice.subscriptionId
        );
        if (!subscription) {
          console.warn(`Subscription not found for invoice: ${invoice._id}`);
          return res.status(200).send("OK");
        }

        const nextBilling = new Date(subscription.nextBilling);
        if (subscription.duration === "monthly") {
          nextBilling.setMonth(nextBilling.getMonth() + 1);
        } else {
          nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        }
        subscription.nextBilling = nextBilling;
        subscription.updatedAt = new Date();
        await subscription.save();
        await createInvoiceForSubscription(subscription);

        // Create payment record
        const payment = new Payment({
          invoiceId: invoice._id,
          paystackReference: reference,
          amount: event.data.amount / 100, // Convert from kobo
          currency: event.data.currency,
          status: event.data.status,
          channel: event.data.channel,
          paidAt: new Date(),
          metadata: event.data.metadata,
        });
        await payment.save();

        console.log(
          `Payment successful: ${invoice.invoiceNumber} - ₦${(
            event.data.amount / 100
          ).toLocaleString()} (Total: $${invoice.totalAmountUSD}, Base: $${
            invoice.baseAmountUSD
          }, Fee: $${invoice.processingFeeUSD})`
        );
        console.log(
          `New invoice generated for next cycle: Subscription ID ${subscription._id}`
        );
      } else {
        console.warn(`Invoice not found for payment reference: ${reference}`);
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get("/dashboard/stats", async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });

    const monthlyRevenue = await Subscription.aggregate([
      { $match: { status: "active", duration: "monthly" } },
      { $group: { _id: null, total: { $sum: "$priceUSD" } } },
    ]);

    const yearlyRevenue = await Subscription.aggregate([
      { $match: { status: "active", duration: "yearly" } },
      { $group: { _id: null, total: { $sum: "$priceUSD" } } },
    ]);

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dueSubscriptions = await Subscription.countDocuments({
      status: "active",
      nextBilling: { $lte: nextWeek, $gte: now },
    });

    const pendingInvoices = await Invoice.countDocuments({ status: "pending" });
    const paidInvoices = await Invoice.countDocuments({ status: "paid" });
    const overdueInvoices = await Invoice.countDocuments({ status: "overdue" });

    const totalRevenue =
      (monthlyRevenue[0]?.total || 0) + (yearlyRevenue[0]?.total || 0);

    res.json({
      totalClients,
      activeSubscriptions,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      yearlyRevenue: yearlyRevenue[0]?.total || 0,
      totalRevenue,
      dueSubscriptions,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get exchange rate
app.get("/exchange-rate", async (req, res) => {
  try {
    const rate = await getExchangeRate();
    res.json({
      rate,
      currency: "NGN",
      base: "USD",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
app.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: "invoiceId",
        populate: [
          { path: "clientId", select: "name email" },
          { path: "subscriptionId", select: "planName" },
        ],
      })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk send reminders
app.post("/bulk-reminders", async (req, res) => {
  try {
    const now = new Date();
    const reminderDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    const dueSubscriptions = await Subscription.find({
      status: "active",
      nextBilling: { $lte: reminderDate, $gte: now },
    }).populate("clientId");

    const results = [];

    for (const subscription of dueSubscriptions) {
      try {
        // Check if reminder already sent recently
        const recentInvoice = await Invoice.findOne({
          subscriptionId: subscription._id,
          status: "pending",
          reminderSent: true,
          reminderSentAt: {
            $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        });

        if (!recentInvoice) {
          let invoice = await Invoice.findOne({
            subscriptionId: subscription._id,
            status: "pending",
          });

          if (!invoice) {
            invoice = await createInvoiceForSubscription(subscription);
          }

          const emailSent = await sendReminderEmail(
            invoice,
            subscription.clientId,
            subscription,
            invoice.paymentLink
          );

          results.push({
            subscriptionId: subscription._id,
            clientName: subscription.clientId.name,
            clientEmail: subscription.clientId.email,
            invoiceNumber: invoice.invoiceNumber,
            success: emailSent,
          });
        }
      } catch (error) {
        console.error(
          `Error processing subscription ${subscription._id}:`,
          error
        );
        results.push({
          subscriptionId: subscription._id,
          clientName: subscription.clientId?.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `Bulk reminder completed: ${successCount}/${results.length} emails sent`
    );

    res.json({
      message: `Processed ${results.length} subscriptions, sent ${successCount} reminders`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk reminder:", error);
    res.status(500).json({ error: error.message });
  }
});

// Scheduled Tasks

// Check for due subscriptions and send reminders (runs daily at 9 AM)
schedule("0 9 * * *", async () => {
  console.log("Running daily reminder check...");

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dueSubscriptions = await Subscription.find({
      status: "active",
      nextBilling: { $lte: threeDaysFromNow, $gte: now },
    }).populate("clientId");

    let reminderCount = 0;

    for (const subscription of dueSubscriptions) {
      try {
        // Check if reminder already sent recently
        const recentInvoice = await Invoice.findOne({
          subscriptionId: subscription._id,
          status: "pending",
          reminderSent: true,
          reminderSentAt: {
            $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        });

        if (!recentInvoice) {
          let invoice = await Invoice.findOne({
            subscriptionId: subscription._id,
            status: "pending",
          });

          if (!invoice) {
            invoice = await createInvoiceForSubscription(subscription);
          }

          const emailSent = await sendReminderEmail(
            invoice,
            subscription.clientId,
            subscription,
            invoice.paymentLink
          );
          if (emailSent) reminderCount++;
        }
      } catch (error) {
        console.error(
          `Error processing subscription ${subscription._id}:`,
          error
        );
      }
    }

    console.log(
      `Daily reminder check completed: ${reminderCount} reminders sent from ${dueSubscriptions.length} due subscriptions`
    );
  } catch (error) {
    console.error("Error in scheduled reminder task:", error);
  }
});

// Update expired subscriptions (runs daily at midnight)
schedule("0 0 * * *", async () => {
  console.log("Checking for expired subscriptions...");

  try {
    const now = new Date();

    // Update expired subscriptions
    const expiredResult = await Subscription.updateMany(
      {
        status: "active",
        nextBilling: { $lt: now },
      },
      {
        status: "expired",
        updatedAt: now,
      }
    );

    // Update overdue invoices
    const overdueResult = await Invoice.updateMany(
      {
        status: "pending",
        dueDate: { $lt: now },
      },
      {
        status: "overdue",
        updatedAt: now,
      }
    );

    console.log(
      `Midnight cleanup completed: ${expiredResult.modifiedCount} expired subscriptions, ${overdueResult.modifiedCount} overdue invoices`
    );
  } catch (error) {
    console.error("Error updating expired subscriptions:", error);
  }
});

// Update exchange rate every 6 hours
schedule("0 */6 * * *", async () => {
  console.log("Updating exchange rate...");
  try {
    const newRate = await getExchangeRate();
    console.log(`Exchange rate updated: $1 USD = ₦${newRate} NGN`);
  } catch (error) {
    console.error("Error updating exchange rate:", error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log("Scheduled tasks initialized");
  console.log("Ready to accept connections!");
});

export default app;
