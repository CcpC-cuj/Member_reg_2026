# 🧪 Offline Testing Guide

## Quick Start

### 1. Start Backend (API Server)
```bash
cd "/Users/basiljoy/VS code/Member_reg_2026"
npm start
```

**Expected output:**
```
Server running on port 3000
MongoDB Connected
```

**Test backend is working:**
```bash
curl http://localhost:3000/health
# Should return: {"ok":true,"status":"healthy"}
```

---

### 2. Serve Frontend (Separate Terminal)

Open a **new terminal** and run:

```bash
cd "/Users/basiljoy/VS code/Member_reg_2026/frontend"
python3 -m http.server 5173
```

**Or if you have Node.js http-server:**
```bash
npx http-server -p 5173
```

---

### 3. Open in Browser

- **Recruitment Form:** http://localhost:5173/recruitment.html
- **Admin Panel:** http://localhost:5173/admin.html

---

## Testing Checklist

### ✅ Backend API Tests

```bash
# Health check
curl http://localhost:3000/health

# Test registration (should create user)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "dept123",
    "phone": "1234567890",
    "PreferedLanguage": "javascript",
    "Skills": "Web Development",
    "reg_no": "REG001",
    "Batch": "2024"
  }'

# Test admin login (replace YOUR_ADMIN_TOKEN)
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_ADMIN_TOKEN"}'

# Get all users (requires admin token)
curl http://localhost:3000/admin/users \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

### ✅ Frontend Tests

1. **Recruitment Form:**
   - Fill out all fields
   - Submit form
   - Should see success message
   - Check backend logs for "Email sent successfully"

2. **Admin Panel:**
   - Login with `ADMIN_TOKEN` from `.env`
   - Click "Refresh Users" → should list registered users
   - Select users → send custom email
   - Test "Send to All" button

---

## Troubleshooting

### ❌ `{"ok":false,"message":"Not Found"}`
- **Cause:** You're accessing the backend directly in browser
- **Fix:** Backend is API-only. Use frontend files from `frontend/` folder

### ❌ `MongoDB Error`
- **Cause:** `MONGO_URI` not set or invalid
- **Fix:** Check `.env` file has valid MongoDB connection string

### ❌ `Admin token not configured`
- **Cause:** `ADMIN_TOKEN` missing in `.env`
- **Fix:** Generate token and add to `.env`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### ❌ CORS errors in browser console
- **Cause:** Frontend trying to call backend from different origin
- **Fix:** Backend has `cors()` enabled, should work. Check `API_BASE_URL` in frontend JS files matches backend URL.

---

## Environment Variables Required

Make sure your `.env` has:
```bash
PORT=3000
MONGO_URI=mongodb+srv://...
BREVO_API_KEY=xkeysib-...
EMAIL_FROM=you@example.com
ADMIN_TOKEN=your-secret-token-here
```

---

## Next Steps After Testing

Once everything works offline:
1. ✅ Test recruitment form creates users
2. ✅ Test admin panel can view users
3. ✅ Test email sending (if Brevo configured)
4. ✅ Ready to deploy to Hugging Face Spaces!

