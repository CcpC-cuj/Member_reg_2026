const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());

// ---------------- MongoDB Connection ----------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

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

async function sendEmail(email, name) {
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
      return res.status(400).json({ message: "All fields are required" });
    }

    const alreadyExistUser = await User.findOne({ email });
    if (alreadyExistUser) {
      return res.status(400).json({ ok: true, message: "User already exists" });
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

    sendEmail(email, name);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
});

// ---------------- Start Server ----------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
