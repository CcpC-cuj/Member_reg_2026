# 🔧 Quick Fix: Add HF_SPACE_NAME Variable

## Option 1: Add GitHub Repository Variable (Recommended)

1. Go to your GitHub repo: **https://github.com/YOUR_USERNAME/Member_reg_2026**
2. Click **"Settings"** (top menu)
3. Left sidebar: **"Secrets and variables"** → **"Actions"**
4. Click **"Variables"** tab (NOT Secrets)
5. Click **"New repository variable"**
6. Fill in:
   - **Name:** `HF_SPACE_NAME`
   - **Value:** `mem_reg_2026` (your Space name)
7. Click **"Add variable"**
m
**✅ Done!** Now push to `main` again and the workflow should work.

---

## Option 2: Use Secret Instead (Alternative)

If you prefer to use a Secret instead of a Variable, I can update the workflow file to use `secrets.HF_SPACE_NAME` instead of `vars.HF_SPACE_NAME`.

Let me know which you prefer!

