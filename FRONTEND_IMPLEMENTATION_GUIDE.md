# Frontend Implementation Guide - Rate Limiting & CAPTCHA

## Backend Changes Summary
The backend now has:
- ✅ **Rate Limiting**: Max 5 registration attempts per IP per hour
- ✅ **reCAPTCHA v3**: Bot detection (silent, no user friction)
- ✅ **Error handling**: Returns 403 if bot detected, 429 if rate limited

---

## Frontend Implementation Tasks

### Step 1: Add reCAPTCHA v3 Script
Add this to your HTML `<head>` section:

```html
<!-- reCAPTCHA v3 Script -->
<script src="https://www.google.com/recaptcha/api.js"></script>
```

### Step 2: Initialize reCAPTCHA in JavaScript
Add this JavaScript code (replace `YOUR_SITE_KEY` with actual key):

```javascript
// Get your SITE_KEY from: https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = "YOUR_SITE_KEY"; // e.g., "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"

// Function to get reCAPTCHA token
async function getRecaptchaToken() {
  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: "submit" })
        .then((token) => {
          console.log("✅ reCAPTCHA token received");
          resolve(token);
        })
        .catch((error) => {
          console.error("❌ reCAPTCHA error:", error);
          reject(error);
        });
    });
  });
}
```

### Step 3: Update Registration Form Submission
When submitting the registration form, get the CAPTCHA token first:

```javascript
// Example: Update your form submission handler
async function submitRegistrationForm(e) {
  e.preventDefault();

  try {
    // Get reCAPTCHA token
    const recaptchaToken = await getRecaptchaToken();
    
    // Prepare form data
    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value, // Department
      phone: document.getElementById("phone").value,
      PreferedLanguage: document.getElementById("language").value,
      Skills: document.getElementById("skills").value,
      reg_no: document.getElementById("reg_no").value,
      Batch: document.getElementById("batch").value,
      recaptchaToken: recaptchaToken // ← ADD THIS
    };

    // Send to backend
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.status === 403) {
      // Bot detected
      alert("❌ Bot detection triggered. Please try again.");
      return;
    }

    if (response.status === 429) {
      // Rate limited
      alert("⚠️ Too many attempts. Please try again in 1 hour.");
      return;
    }

    if (result.ok) {
      alert("✅ Registration successful! Check your email.");
      // Redirect or clear form
    } else {
      alert(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("❌ An error occurred. Please try again.");
  }
}
```

### Step 4: Example HTML Form Structure
Ensure your form has these input fields:

```html
<form onsubmit="submitRegistrationForm(event)">
  <input type="text" id="name" name="name" placeholder="Full Name" required />
  <input type="email" id="email" name="email" placeholder="Email" required />
  <input type="password" id="password" name="password" placeholder="Department" required />
  <input type="tel" id="phone" name="phone" placeholder="Phone" required />
  
  <select id="language" name="language" required>
    <option value="">Select Language</option>
    <option value="English">English</option>
    <option value="Hindi">Hindi</option>
  </select>
  
  <input type="text" id="skills" name="skills" placeholder="Skills" required />
  <input type="text" id="reg_no" name="reg_no" placeholder="Registration Number" required />
  
  <select id="batch" name="batch" required>
    <option value="">Select Batch</option>
    <option value="2024">2024</option>
    <option value="2025">2025</option>
    <option value="2026">2026</option>
  </select>

  <button type="submit">Register</button>
</form>
```

---

## Setup Steps for Frontend Agent

1. **Get reCAPTCHA Keys**:
   - Visit: https://www.google.com/recaptcha/admin
   - Sign in with Google account
   - Create new site → Select **reCAPTCHA v3**
   - Add your domain (e.g., `ccpccuj-mem-reg-2026.hf.space`)
   - Copy **Site Key** and **Secret Key**

2. **Set Backend Environment Variable**:
   - Add to `.env` file:
     ```
     RECAPTCHA_SECRET_KEY=your_secret_key_here
     ```

3. **Update Frontend**:
   - Add reCAPTCHA script to HTML head
   - Add `getRecaptchaToken()` function
   - Update form submission to include `recaptchaToken`
   - Add error handling for 403 (bot) and 429 (rate limit) responses

4. **Test**:
   - Try submitting form 6 times in quick succession
   - Should get: "Too many registration attempts. Please try again after 1 hour."
   - Submit with valid token should work normally
   - Try with bot-like behavior (no delay, rapid clicks) - should fail with "Bot detection triggered"

---

## Error Messages Users Will See

| Status Code | Error Message | What Happened |
|---|---|---|
| 200 | "Registration successful. Check your e-mail" | ✅ Success |
| 400 | "All fields are required" | Missing form fields |
| 403 | "Bot detection triggered. Please try again." | reCAPTCHA score too low (bot detected) |
| 409 | "User already exists" | Email already registered |
| 429 | "Too many registration attempts. Please try again after 1 hour." | Rate limit exceeded (5+ attempts/hour) |
| 500 | "Something went wrong. Please try again." | Server error |

---

## Files to Update

- [index.html](index.html) - Add reCAPTCHA script + form
- [index.js](index.js) - Add `getRecaptchaToken()` and update form submission
- [frontend/recruitment.html](frontend/recruitment.html) - If using this form
- [frontend/recruitment.js](frontend/recruitment.js) - If using this form

---

## Quick Testing Checklist

- [ ] Add reCAPTCHA script to HTML head
- [ ] Add `getRecaptchaToken()` function to JavaScript
- [ ] Update form submission to include `recaptchaToken`
- [ ] Handle 403 (bot) error response
- [ ] Handle 429 (rate limit) error response
- [ ] Test: Submit form 6+ times quickly → should be blocked
- [ ] Test: Submit normally → should succeed
- [ ] Verify "Check your email" message appears

---

## Support

If reCAPTCHA is not loading:
1. Check browser console for errors
2. Verify Site Key is correct
3. Ensure domain is registered in reCAPTCHA admin
4. Check CORS settings (should allow your domain)

If rate limiting not working:
1. Clear browser cache
2. Try from different IP or use VPN
3. Wait 1 hour or restart server to reset rate limit

