# 🔧 Hugging Face Spaces Health Check Fix

## Issue
Space shows "starting" for 30 minutes then times out with no error.

## Root Cause
Hugging Face Spaces health check expects:
1. Server to respond on PORT (usually 7860)
2. Health endpoint to respond quickly
3. Server to start within timeout window

## Fix Applied

### 1. Health Endpoints Moved to Top
- `/health` and `/` now respond immediately (before MongoDB connects)
- Server starts listening right away

### 2. MongoDB Connection Made Non-Blocking
- Server starts even if MongoDB is slow/unavailable
- Connection timeout reduced to 5 seconds

### 3. PORT Handling Improved
- Better logging to see what PORT is being used
- Validation and error handling added

## Next Steps

### Option 1: Verify PORT is Set (Recommended)

1. Go to your Space: `https://huggingface.co/spaces/ccpccuj/mem_reg_2026/settings`
2. Check **"Variables"** section
3. **Add** if missing:
   - **Name:** `PORT`
   - **Value:** `7860`
   - **Type:** Variable (not Secret)

### Option 2: Check Logs After Deploy

After pushing, check the logs. You should see:
```
🔧 Environment check:
   - NODE_ENV: production
   - PORT env var: 7860
   - Server will listen on port: 7860
✅ Server running on port 7860
```

If you see `PORT env var: NOT SET`, then add PORT=7860 in Space settings.

## Test Health Check

Once deployed, test:
```bash
curl https://ccpccuj-mem-reg-2026.hf.space/health
```

Should return: `{"ok":true,"status":"healthy","timestamp":"..."}`

## If Still Timing Out

1. Check Space logs for any errors
2. Verify all environment variables are set:
   - `MONGO_URI`
   - `BREVO_API_KEY`
   - `EMAIL_FROM`
   - `ADMIN_TOKEN`
   - `PORT` (should be 7860)

3. Try accessing the Space URL directly in browser:
   - `https://ccpccuj-mem-reg-2026.hf.space/`
   - Should return JSON response immediately

