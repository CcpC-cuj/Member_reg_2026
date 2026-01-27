# 🚀 Deployment Guide: Hugging Face Spaces

## Step-by-Step Instructions

---

## Part 1: Get Your Hugging Face Credentials

### 1.1 Create/Login to Hugging Face Account

1. Go to: **https://huggingface.co/**
2. **Sign up** (if new) or **Log in** (if existing)
3. Your **username** = `HF_USERNAME` (you'll see it in your profile URL: `https://huggingface.co/YOUR_USERNAME`)

**Example:** If your profile is `https://huggingface.co/johnsmith`, then `HF_USERNAME = johnsmith`

---

### 1.2 Create Hugging Face Access Token (HF_TOKEN)

1. Go to: **https://huggingface.co/settings/tokens**
2. Click **"New token"**
3. Fill in:
   - **Token name:** `github-actions-deploy` (or any name)
   - **Type:** Select **"Write"** (needs write permission to push to Spaces)
4. Click **"Generate token"**
5. **Copy the token immediately** (you won't see it again!)
   - This is your `HF_TOKEN`

**⚠️ Important:** Save this token somewhere safe. It looks like: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 1.3 Create a Hugging Face Space

1. Go to: **https://huggingface.co/new-space**
2. Fill in:
   - **Space name:** Choose a name (e.g., `member-reg-2026`)
     - This becomes your `HF_SPACE_NAME`
   - **SDK:** Select **"Docker"** ⚠️ (NOT Gradio, Streamlit, etc.)
   - **Visibility:** Public or Private (your choice)
3. Click **"Create Space"**
4. **Note down your Space name** - you'll need it for GitHub Variables

**Example:** If Space URL is `https://huggingface.co/spaces/johnsmith/member-reg-2026`
- `HF_USERNAME` = `johnsmith` ccpccuj
- `HF_SPACE_NAME` = `member-reg-2026`mem_reg_2026

---

## Part 2: Add Credentials to GitHub

### 2.1 Go to GitHub Repository Settings

1. Open your repo: **https://github.com/YOUR_USERNAME/Member_reg_2026**
2. Click **"Settings"** (top menu)
3. In left sidebar: **"Secrets and variables"** → **"Actions"**

---

### 2.2 Add GitHub Secrets

Click **"New repository secret"** for each:

#### Secret 1: `HF_USERNAME`
- **Name:** `HF_USERNAME`
- **Secret:** Paste your Hugging Face username (e.g., `johnsmith`)
- Click **"Add secret"**

#### Secret 2: `HF_TOKEN`
- **Name:** `HF_TOKEN`
- **Secret:** Paste your Hugging Face access token (e.g., `hf_xxxxxxxxxxxx...`)
- Click **"Add secret"**

---

### 2.3 Add GitHub Variable

Click **"Variables"** tab → **"New repository variable"**:

#### Variable: `HF_SPACE_NAME`
- **Name:** `HF_SPACE_NAME`
- **Value:** Paste your Space name (e.g., `member-reg-2026`)
- Click **"Add variable"**

**✅ Done!** Your GitHub Actions workflow will now use these automatically.

---

## Part 3: Add Environment Variables to Hugging Face Space

### 3.1 Go to Your Space Settings

1. Open your Space: **https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME**
2. Click **"Settings"** tab (top menu)

---

### 3.2 Add Space Secrets

In **"Repository secrets"** section, click **"New secret"** for each:

#### Secret 1: `MONGO_URI`
- **Name:** `MONGO_URI`
- **Secret:** Your MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
- Click **"Add secret"**

#### Secret 2: `BREVO_API_KEY`
- **Name:** `BREVO_API_KEY`
- **Secret:** Your Brevo API key
  - Example: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Click **"Add secret"**

#### Secret 3: `EMAIL_FROM`
- **Name:** `EMAIL_FROM`
- **Secret:** Your sender email (verified in Brevo)
  - Example: `noreply@example.com`
- Click **"Add secret"**

#### Secret 4: `ADMIN_TOKEN`
- **Name:** `ADMIN_TOKEN`
- **Secret:** Your admin token (from your local `.env` file)
  - Example: `ffa307fa26f8b018fb59deedb6af1637da02101a14fd7761670c9c4e6e4c92dd`
- Click **"Add secret"**

**✅ Done!** Your Space will use these when running.

---

## Part 4: Deploy!

### 4.1 Push to GitHub `main` Branch

```bash
cd "/Users/basiljoy/VS code/Member_reg_2026"
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 4.2 Watch GitHub Actions

1. Go to: **https://github.com/YOUR_USERNAME/Member_reg_2026/actions**
2. You should see a workflow run: **"Deploy to Hugging Face Spaces (Docker)"**
3. Click it to watch progress
4. Wait for green checkmark ✅

### 4.3 Check Your Space

1. Go to: **https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME**
2. Click **"Logs"** tab to see build/deploy progress
3. Once running, your backend URL will be:
   ```
   https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space
   ```

**Example:** If `HF_USERNAME=johnsmith` and `HF_SPACE_NAME=member-reg-2026`
- Backend URL: `https://johnsmith-member-reg-2026.hf.space`

---

## Part 5: Test Your Deployed Backend

### 5.1 Test Health Endpoint

```bash
curl https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/health
```

Should return: `{"ok":true,"status":"healthy"}`

### 5.2 Update Frontend to Use Production URL

Edit `frontend/recruitment.js` and `frontend/admin.js`:

**Change this line:**
```js
const API_BASE_URL = "http://localhost:3000";
```

**To:**
```js
const API_BASE_URL = "https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space";
```

**Example:**
```js
const API_BASE_URL = "https://johnsmith-member-reg-2026.hf.space";
```

---

## Quick Reference Checklist

### ✅ GitHub Secrets (Settings → Secrets and variables → Actions → Secrets)
- [ ] `HF_USERNAME` = Your HF username
- [ ] `HF_TOKEN` = Your HF access token (Write permission)

### ✅ GitHub Variable (Settings → Secrets and variables → Actions → Variables)
- [ ] `HF_SPACE_NAME` = Your Space name

### ✅ Hugging Face Space Secrets (Space → Settings → Repository secrets)
- [ ] `MONGO_URI` = MongoDB connection string
- [ ] `BREVO_API_KEY` = Brevo API key
- [ ] `EMAIL_FROM` = Sender email
- [ ] `ADMIN_TOKEN` = Admin token (from `.env`)

### ✅ Deploy
- [ ] Push code to `main` branch
- [ ] Watch GitHub Actions workflow
- [ ] Check Space logs for deployment
- [ ] Test backend URL: `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/health`

---

## Troubleshooting

### ❌ GitHub Actions fails: "Authentication failed"
- **Fix:** Check `HF_TOKEN` is correct and has **Write** permission

### ❌ Space build fails: "Cannot find module"
- **Fix:** Make sure `package.json` has all dependencies listed

### ❌ Space crashes: "MongoDB Error"
- **Fix:** Check `MONGO_URI` secret is set correctly in Space settings

### ❌ Backend returns 500: "Admin token not configured"
- **Fix:** Check `ADMIN_TOKEN` secret is set in Space settings

---

## Need Help?

If you get stuck, share:
1. Which step you're on
2. Any error messages
3. Screenshots (if helpful)

Good luck! 🚀

