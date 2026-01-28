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

// ---------------- CORS & Middlewares ----------------
app.use(express.json());

const allowedOrigins = [
  "https://ccpc-cuj.web.app",
  "https://ccpc-cuj.firebaseapp.com",
  "https://ccpccuj-mem-reg-2026.hf.space"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools / same-origin / curl (no origin)
      if (!origin) {
        return callback(null, true);
      }

      const isLocalhost =
        /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin) ||
        /^https?:\/\/0\.0\.0\.0(:\d+)?$/i.test(origin);

      if (allowedOrigins.includes(origin) || isLocalhost) {
        return callback(null, true);
      }

      // Block unexpected origins
      return callback(null, false);
    }
  })
);

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
const userSchema = new mongoose.Schema(
  {
  name: String,
  email: { type: String, unique: true },
    password: String, // used as Department in UI
  phone: String,
  PreferedLanguage: String,
  Skills: String,
  reg_no: String,
    Batch: String,
    // Fields used by old React admin panel
    active: { type: Boolean, default: true },
    tasks: { type: [String], default: [] }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ---------------- Settings Schema (registration status etc.) ----------------
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

// ---------------- Email Log Schema (admin audit trail) ----------------
const emailLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["individual", "bulk", "custom"], required: true },
    userIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    subject: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: String, default: "unknown" },
    status: { type: String, enum: ["success", "failed"], required: true },
    message: { type: String, default: "" }
  },
  { timestamps: true }
);

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

// cached registration status default
let registrationIsOpen = true;

// ---------------- Email Setup (Brevo / EMAIL_SERVICE_CREDENTIALS) ----------------
const emailApiKey =
  process.env.BREVO_API_KEY || process.env.EMAIL_SERVICE_CREDENTIALS || "";

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = emailApiKey;

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

async function sendCustomEmailHtml(toEmails, subject, htmlContent, plainText) {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Code Crafters Programming Club"
      },
      to: toEmails.map((email) => ({ email })),
      subject,
      htmlContent: htmlContent || undefined,
      textContent: plainText || undefined
    });
    console.log(`Custom HTML email sent to ${toEmails.length} recipient(s)`);
    return true;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    return false;
  }
}

function getSentBy(req) {
  // Prefer explicit header from admin frontend if provided
  const headerEmail =
    (req.headers["x-admin-email"] || req.headers["x_admin_email"] || "").toString().trim();
  if (headerEmail) return headerEmail;
  // Fallback to body (optional)
  const bodyEmail = (req.body && (req.body.sentBy || req.body.adminEmail)) || "";
  if (typeof bodyEmail === "string" && bodyEmail.trim()) return bodyEmail.trim();
  return "unknown";
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
      message: "Registration successful. Check your e-mail"
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

// Alias for clients expecting /api/register
app.post("/api/register", async (req, res) => {
  // Delegate to /login handler
  return app._router.handle(
    { ...req, url: "/login", originalUrl: "/login", method: "POST" },
    res,
    () => {}
  );
});

// ---------------- Admin APIs (token-based, existing) ----------------

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

// ---------------- React Admin-compatible APIs (old admin panel) ----------------

// Admin login expected by old React AdminLogin component
// POST /api/admin/login  body: { email, password } -> { success, token, message }
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const adminEmailEnv = process.env.ADMIN_EMAIL || "";
    const adminPasswordEnv = process.env.ADMIN_PASSWORD || "";

    // Support multiple admin accounts: values can be like "email1||email2"
    const adminEmails = adminEmailEnv.split("||").map((e) => e.trim()).filter(Boolean);
    const adminPasswords = adminPasswordEnv
      .split("||")
      .map((p) => p.trim())
      .filter(Boolean);

    if (!adminEmails.length || !adminPasswords.length || !process.env.ADMIN_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Admin credentials not configured on server"
      });
    }

    // Check if provided credentials match any configured pair
    let isValid = false;
    for (let i = 0; i < adminEmails.length; i++) {
      const e = adminEmails[i];
      const p = adminPasswords[i] || adminPasswords[0]; // fall back to first password if fewer passwords
      if (email === e && password === p) {
        isValid = true;
        break;
      }
    }

    if (isValid) {
      return res.json({
        success: true,
        token: process.env.ADMIN_TOKEN,
        message: "Admin authenticated"
      });
    }

    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials. Please try again." });
  } catch (err) {
    console.error("Error in /api/admin/login:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to login. Please try again." });
  }
});

// Registration status used by old React Home + RegistrationForm
// GET /api/settings/registration-status -> { isOpen: boolean }
app.get("/api/settings/registration-status", async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: "registrationIsOpen" });
    if (setting && typeof setting.value === "boolean") {
      registrationIsOpen = setting.value;
    }
    res.json({ isOpen: registrationIsOpen });
  } catch (err) {
    console.error("Error reading registration status:", err);
    // fall back to cached value
    res.json({ isOpen: registrationIsOpen });
  }
});

// PUT /api/settings/registration-status  body: { isOpen: boolean }
app.put("/api/settings/registration-status", async (req, res) => {
  try {
    const { isOpen } = req.body || {};
    registrationIsOpen = !!isOpen;

    await Setting.findOneAndUpdate(
      { key: "registrationIsOpen" },
      { value: registrationIsOpen },
      { upsert: true, new: true }
    );

    res.json({
      isOpen: registrationIsOpen,
      message: `Registration is now ${registrationIsOpen ? "OPEN" : "CLOSED"}`
    });
  } catch (err) {
    console.error("Error updating registration status:", err);
    res.status(500).json({
      message: "Failed to update registration status",
      isOpen: registrationIsOpen
    });
  }
});

// Users listing used by old React Users component
// GET /api/users -> [user, ...]
app.get("/api/users", async (req, res) => {
  try {
    const status = (req.query.status || "all").toString().toLowerCase();
    const filter = {};
    if (status === "active") filter.active = true;
    if (status === "inactive") filter.active = false;

    const docs = await User.find(filter).sort({ createdAt: -1 }).lean();
    const users = docs.map((u) => ({
      ...u,
      // alias fields to match old frontend expectations
      batch: u.Batch,
      skills: u.Skills,
      preferedLanguage: u.PreferedLanguage
    }));
    res.json(users);
  } catch (err) {
    console.error("Error fetching users for /api/users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update active status: PUT /api/users/:id/status  body: { active: boolean }
app.put("/api/users/:id/status", async (req, res) => {
  try {
    const { active } = req.body || {};
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: !!active },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// Assign single task: POST /api/users/:id/task  body: { task: string }
app.post("/api/users/:id/task", async (req, res) => {
  try {
    const { task } = req.body || {};
    if (!task) {
      return res.status(400).json({ message: "Task is required" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!Array.isArray(user.tasks)) {
      user.tasks = [];
    }
    user.tasks.push(task);
    await user.save();
    res.json(user);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ message: "Failed to add task" });
  }
});

// Replace tasks: PUT /api/users/:id/updateTasks  body: { tasks: string[] }
app.put("/api/users/:id/updateTasks", async (req, res) => {
  try {
    const { tasks } = req.body || {};
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: "tasks must be an array of strings" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { tasks },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error updating tasks:", err);
    res.status(500).json({ message: "Failed to update tasks" });
  }
});

// Individual email send: POST /api/email/send-individual  body: { userId }
app.post("/api/email/send-individual", async (req, res) => {
  const sentBy = getSentBy(req);
  try {
    const { userId } = req.body || {};
    if (!userId) {
      await EmailLog.create({
        type: "individual",
        userIds: [],
        subject: "Registration email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: "userId is required"
      });
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      await EmailLog.create({
        type: "individual",
        userIds: [],
        subject: "Registration email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: "User not found"
      });
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ok = await sendRegistrationEmail(user.email, user.name);
    if (!ok) {
      await EmailLog.create({
        type: "individual",
        userIds: [user._id],
        subject: "Registration email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: "Failed to send email"
      });
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email" });
    }

    const log = await EmailLog.create({
      type: "individual",
      userIds: [user._id],
      subject: "Registration email",
      sentAt: new Date(),
      sentBy,
      status: "success",
      message: "Email sent successfully"
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Error in /api/email/send-individual:", err);
    try {
      await EmailLog.create({
        type: "individual",
        userIds: [],
        subject: "Registration email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: err.message || "Unexpected error"
      });
    } catch (_) {}
    res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
  }
});

// Bulk email send: POST /api/email/send-bulk
// Sends to all active users
app.post("/api/email/send-bulk", async (req, res) => {
  const sentBy = getSentBy(req);
  try {
    const users = await User.find({ active: true });
    const emails = users.map((u) => u.email);
    const userIds = users.map((u) => u._id);

    if (emails.length === 0) {
      await EmailLog.create({
        type: "bulk",
        userIds: [],
        subject: "Bulk welcome email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: "No active users to email"
      });
      return res
        .status(404)
        .json({ success: false, message: "No active users to email" });
    }

    const ok = await sendCustomEmail(
      emails,
      "Code Crafters Programming Club - Welcome",
      "Welcome to Code Crafters Programming Club!"
    );

    if (!ok) {
      await EmailLog.create({
        type: "bulk",
        userIds,
        subject: "Bulk welcome email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: "Failed to send bulk email"
      });
      return res
        .status(500)
        .json({ success: false, message: "Failed to send bulk email" });
    }

    const log = await EmailLog.create({
      type: "bulk",
      userIds,
      subject: "Bulk welcome email",
      sentAt: new Date(),
      sentBy,
      status: "success",
      message: `Bulk email sent to ${emails.length} active users`
    });

    res.json({
      success: true,
      message: `Bulk email sent to ${emails.length} active users`
    });
  } catch (err) {
    console.error("Error in /api/email/send-bulk:", err);
    try {
      await EmailLog.create({
        type: "bulk",
        userIds: [],
        subject: "Bulk welcome email",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: err.message || "Unexpected error"
      });
    } catch (_) {}
    res
      .status(500)
      .json({ success: false, message: "Failed to send bulk email" });
  }
});

// ---------------- Custom Email (HTML) + Email Logs ----------------

// POST /api/email/send-custom
// body: { userIds: [], subject, htmlContent, plainText }
app.post("/api/email/send-custom", async (req, res) => {
  const sentBy = getSentBy(req);
  try {
    const { userIds, subject, htmlContent, plainText } = req.body || {};

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "userIds must be a non-empty array" });
    }
    if (!subject || typeof subject !== "string") {
      return res.status(400).json({ success: false, message: "subject is required" });
    }
    if (!htmlContent && !plainText) {
      return res.status(400).json({
        success: false,
        message: "Provide htmlContent and/or plainText"
      });
    }

    const users = await User.find({ _id: { $in: userIds } });
    const emails = users.map((u) => u.email);
    const resolvedUserIds = users.map((u) => u._id);

    if (emails.length === 0) {
      const log = await EmailLog.create({
        type: "custom",
        userIds: [],
        subject,
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: "No users found for provided IDs"
      });
      return res
        .status(404)
        .json({ success: false, message: "No users found for provided IDs" });
    }

    const ok = await sendCustomEmailHtml(emails, subject, htmlContent, plainText);

    const log = await EmailLog.create({
      type: "custom",
      userIds: resolvedUserIds,
      subject,
      sentAt: new Date(),
      sentBy,
      status: ok ? "success" : "failed",
      message: ok
        ? `Custom email sent to ${emails.length} users`
        : "Failed to send custom email"
    });

    if (!ok) {
      return res.status(500).json({
        success: false,
        message: "Failed to send custom email"
      });
    }

    return res.json({
      success: true,
      message: `Custom email sent to ${emails.length} users`,
      emailLogId: log._id
    });
  } catch (err) {
    console.error("Error in /api/email/send-custom:", err);
    try {
      const log = await EmailLog.create({
        type: "custom",
        userIds: [],
        subject: (req.body && req.body.subject) || "",
        sentAt: new Date(),
        sentBy,
        status: "failed",
        message: err.message || "Unexpected error"
      });
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to send custom email",
        emailLogId: log._id
      });
    } catch (_) {
      return res.status(500).json({ success: false, message: "Failed to send custom email" });
    }
  }
});

// GET /api/email/logs -> array
// Query param: ?type=custom|individual|bulk|all (default: all)
app.get("/api/email/logs", async (req, res) => {
  try {
    const { type = "all" } = req.query || {};
    const filter = type === "all" ? {} : { type };
    
    const logs = await EmailLog.find(filter)
      .sort({ sentAt: -1 })
      .select("_id type userIds subject sentAt sentBy status message createdAt")
      .lean();
    
    // Ensure sentAt is ISO string for frontend
    const formattedLogs = logs.map(log => ({
      ...log,
      sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : new Date().toISOString(),
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString()
    }));
    
    res.json(formattedLogs);
  } catch (err) {
    console.error("Error fetching email logs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch email logs" });
  }
});

// GET /api/email/logs/:id -> single log
app.get("/api/email/logs/:id", async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id).lean();
    if (!log) {
      return res.status(404).json({ success: false, message: "Email log not found" });
    }
    
    // Format dates as ISO strings
    const formattedLog = {
      ...log,
      sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : new Date().toISOString(),
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString()
    };
    
    res.json(formattedLog);
  } catch (err) {
    console.error("Error fetching email log:", err);
    res.status(500).json({ success: false, message: "Failed to fetch email log" });
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
