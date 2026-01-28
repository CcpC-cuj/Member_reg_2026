const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

const app = express();

// Read PORT from environment
// Hugging Face Spaces automatically sets PORT=7860
// For local dev, default to 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Debug logging
console.log(`🔧 Environment check:`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   - PORT env var: ${process.env.PORT || 'NOT SET (using default 3000)'}`);
console.log(`   - Server will listen on port: ${PORT}`);

// Validate PORT immediately
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`❌ Invalid PORT: ${PORT}. Must be between 1-65535`);
  process.exit(1);
}

// Middlewares
app.use(express.json());
app.use(cors());

// ---------------- Health & Root Endpoints (respond immediately) ----------------
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ 
    ok: true, 
    message: "Member Registration API", 
    health: "/health",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// ---------------- MongoDB Connection (non-blocking) ----------------
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    // Don't exit - allow server to start even if DB is temporarily unavailable
    console.log("⚠️  Server will continue without MongoDB connection");
  });

// ---------------- User Schema ----------------
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  PreferedLanguage: String,
  Skills: String,
  reg_no: String,
  Batch: String
});

const User = mongoose.model("User", userSchema);

// ---------------- Brevo Email Setup ----------------
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendRegistrationEmail(email, name) {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Code Crafters Programming Club"
      },
      to: [{ email }],
      subject: "Next Steps for Your Code Crafters Programming Club Registration",
      textContent: `Dear ${name},

Thank you for registering for the Code Crafters Programming Club.

Task Document:
https://docs.google.com/document/d/1jUdkuXKYLQf1zCbwS0CzkaRxxbeb2RqNBUeKYI4Fvn8/edit

Response Form:
https://forms.gle/UbESfaUvxLCADXEj6

Best Regards,
Code Crafters Programming Club`
    });

    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    return false;
  }
}

async function sendCustomEmail(toEmails, subject, textContent) {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Code Crafters Programming Club"
      },
      to: toEmails.map((email) => ({ email })),
      subject,
      textContent
    });
    console.log(`Custom email sent to ${toEmails.length} recipient(s)`);
    return true;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    return false;
  }
}

// ---------------- Admin Auth ----------------
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN) {
    return res
      .status(500)
      .json({ ok: false, message: "Admin token not configured" });
  }
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  return next();
}

// ---------------- API Route ----------------
app.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      PreferedLanguage,
      Skills,
      reg_no,
      Batch
    } = req.body;

    if (
      !email ||
      !password ||
      !name ||
      !phone ||
      !PreferedLanguage ||
      !Skills ||
      !reg_no ||
      !Batch
    ) {
      return res
        .status(400)
        .json({ ok: false, message: "All fields are required" });
    }

    const alreadyExistUser = await User.findOne({ email });
    if (alreadyExistUser) {
      return res
        .status(409)
        .json({ ok: false, message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      PreferedLanguage,
      Skills,
      reg_no,
      Batch
    });

    await newUser.save();

    res.status(200).json({
      ok: true,
      message: "Form submitted. Check your e-mail"
    });

    // Do not block the response on email sending
    sendRegistrationEmail(email, name);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({
      ok: false,
      message: "Something went wrong. Please try again."
    });
  }
});

// ---------------- Admin APIs ----------------

// Optional login check for frontend (token verification)
app.post("/admin/login", async (req, res) => {
  const { token } = req.body || {};
  if (!process.env.ADMIN_TOKEN) {
    return res
      .status(500)
      .json({ ok: false, message: "Admin token not configured" });
  }
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, message: "Invalid admin token" });
  }
  return res.json({ ok: true, message: "Admin authenticated" });
});

app.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ _id: -1 });
    res.json({ ok: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch users" });
  }
});

app.get("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }
    res.json({ ok: true, user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch user" });
  }
});

app.post("/admin/email/user/:id", requireAdmin, async (req, res) => {
  try {
    const { subject, text } = req.body || {};
    if (!subject || !text) {
      return res
        .status(400)
        .json({ ok: false, message: "Subject and text are required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const ok = await sendCustomEmail([user.email], subject, text);
    if (!ok) return res.status(500).json({ ok: false, message: "Email failed" });
    res.json({ ok: true, message: "Email sent" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ ok: false, message: "Failed to send email" });
  }
});

app.post("/admin/email/users", requireAdmin, async (req, res) => {
  try {
    const { userIds, subject, text } = req.body || {};
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ ok: false, message: "userIds must be a non-empty array" });
    }
    if (!subject || !text) {
      return res
        .status(400)
        .json({ ok: false, message: "Subject and text are required" });
    }

    const users = await User.find({ _id: { $in: userIds } });
    const emails = users.map((u) => u.email);
    if (emails.length === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "No users found for provided IDs" });
    }

    const ok = await sendCustomEmail(emails, subject, text);
    if (!ok) return res.status(500).json({ ok: false, message: "Email failed" });
    res.json({ ok: true, message: "Emails sent" });
  } catch (err) {
    console.error("Error sending emails:", err);
    res.status(500).json({ ok: false, message: "Failed to send emails" });
  }
});

app.post("/admin/email/all", requireAdmin, async (req, res) => {
  try {
    const { subject, text } = req.body || {};
    if (!subject || !text) {
      return res
        .status(400)
        .json({ ok: false, message: "Subject and text are required" });
    }
    const users = await User.find({});
    const emails = users.map((u) => u.email);
    if (emails.length === 0) {
      return res.status(404).json({ ok: false, message: "No users found" });
    }

    const ok = await sendCustomEmail(emails, subject, text);
    if (!ok) return res.status(500).json({ ok: false, message: "Email failed" });
    res.json({ ok: true, message: "Emails sent to all users" });
  } catch (err) {
    console.error("Error sending emails:", err);
    res.status(500).json({ ok: false, message: "Failed to send emails" });
  }
});

// API-only 404
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Not Found" });
});

// ---------------- Start Server (start immediately, don't wait for MongoDB) ----------------
// Start server immediately so health checks can pass
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`✅ Root endpoint: http://0.0.0.0:${PORT}/`);
  console.log(`✅ API ready to accept requests`);
  console.log(`✅ Listening on 0.0.0.0:${PORT} (all interfaces)`);
});

// Handle server errors
server.on("error", (err) => {
  console.error(`❌ Server error: ${err.message}`);
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});
