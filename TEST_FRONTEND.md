# 🧪 Test Frontend Offline (Connected to Hugging Face Backend)

## Quick Start

### Option 1: Use the Server I Just Started

The frontend server is already running! Open in your browser:

- **Recruitment Form:** http://localhost:8080/recruitment.html
- **Admin Panel:** http://localhost:8080/admin.html

### Option 2: Start Your Own Server

Open a terminal and run:

```bash
cd "/Users/basiljoy/VS code/Member_reg_2026/frontend"
python3 -m http.server 8080
```

Then open:
- **Recruitment Form:** http://localhost:8080/recruitment.html
- **Admin Panel:** http://localhost:8080/admin.html

### Option 3: Open Files Directly

Simply double-click:
- `frontend/recruitment.html`
- `frontend/admin.html`

They will connect to: `https://ccpccuj-mem-reg-2026.hf.space`

---

## Testing Checklist

### ✅ Recruitment Form Test

1. Open: http://localhost:8080/recruitment.html
2. Fill out all fields:
   - Full Name
   - Email (use a test email)
   - Mobile Number
   - Department
   - Registration Number
   - About
   - Batch (select from dropdown)
   - Preferred Language (select from dropdown)
3. Click **"Join Now"**
4. Should see success message: "Form submitted. Check your e-mail"
5. Check backend logs on Hugging Face Spaces to verify user was created

### ✅ Admin Panel Test

1. Open: http://localhost:8080/admin.html
2. **Login:**
   - Enter your `ADMIN_TOKEN` (from your `.env` file)
   - Click "Login"
   - Should see "Admin authenticated" message
3. **View Users:**
   - Click "Refresh Users" button
   - Should see a table with all registered users
4. **Send Email:**
   - Select one or more users (checkboxes)
   - Enter subject and message
   - Click "Send to Selected" or "Send to All"
   - Should see success message

---

## Backend URL

Both frontends are configured to use:
```
https://ccpccuj-mem-reg-2026.hf.space
```

This is your Hugging Face Spaces backend (production).

---

## Troubleshooting

### ❌ CORS Error in Browser Console

If you see CORS errors, the backend might not be running or CORS is not configured. Check:
- Backend is running on Hugging Face Spaces
- Backend has `cors()` middleware enabled (it does)

### ❌ "Failed to fetch" Error

- Check backend is accessible: https://ccpccuj-mem-reg-2026.hf.space/health
- Should return: `{"ok":true,"status":"healthy",...}`

### ❌ Admin Login Fails

- Make sure you're using the correct `ADMIN_TOKEN`
- Check it matches the one in your Hugging Face Space settings

---

## Stop the Server

If you started the server manually, press `Ctrl+C` in the terminal.

If the background server is running, you can kill it:
```bash
lsof -ti:8080 | xargs kill
```

---

## Next Steps

Once testing is complete:
1. ✅ Frontend works with production backend
2. ✅ Recruitment form creates users
3. ✅ Admin panel can view users and send emails
4. 🚀 Ready to deploy frontend to production (GitHub Pages, Netlify, etc.)

