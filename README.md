---
title: Member Registration API
emoji: 🚀
colorFrom: blue
colorTo: purple
sdk: docker
app_file: server.js
pinned: false
---

# Member_reg_2026 — Full-Stack (API + Recruitment Form + Admin Panel)

This project provides:
- **Backend**: Node.js + Express + MongoDB (Mongoose) API with **Brevo Transactional Emails**
- **Frontend (separate)**:
  - Recruitment form that submits to `POST /login`
  - Admin panel to view users and send custom emails (single / multiple / all)
- **DevOps**:
  - Dockerfile compatible with **Hugging Face Spaces (Docker SDK)**
  - GitHub Actions workflow to build & push Docker image to Hugging Face on every push to `main`

> Note: The backend is intended to be **API-only**. The UI lives under `frontend/` and should be hosted separately.

## Folder structure

```
.
├─ server.js                      # backend API
├─ package.json
├─ Dockerfile
├─ .github/workflows/deploy-hf.yml
└─ frontend/
   ├─ recruitment.html
   ├─ recruitment.js
   ├─ admin.html
   ├─ admin.js
   └─ styles.css
```

## Backend: environment variables

Set these in your environment (locally via `.env`, on Hugging Face via Space “Variables”):

- **PORT**: server listen port (Hugging Face sets this automatically)
- **MONGO_URI**: MongoDB connection string (required)
- **BREVO_API_KEY**: Brevo API key (required to send email)
- **EMAIL_FROM**: verified sender email in Brevo (required to send email)
- **ADMIN_TOKEN**: secret token for admin APIs (required for admin panel)

Example `.env` (DO NOT commit):

```bash
PORT=3000
MONGO_URI=mongodb+srv://...
BREVO_API_KEY=...
EMAIL_FROM=you@yourdomain.com
ADMIN_TOKEN=replace-with-a-long-random-secret
```

## Backend: local run

```bash
npm install
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

## Backend: API endpoints

### Public

#### `GET /health`
Returns `{ ok: true, status: "healthy" }`.

#### `POST /login`
Creates a registration record and sends the “next steps” email via Brevo.

Body:

```json
{
  "email": "user@example.com",
  "password": "Department",
  "name": "Full Name",
  "phone": "9999999999",
  "PreferedLanguage": "javascript",
  "Skills": "About...",
  "reg_no": "REG123",
  "Batch": "2024"
}
```

Responses (unchanged behavior):
- `200`: `{ ok: true, message: "Form submitted. Check your e-mail" }`
- `409`: `{ ok: false, message: "User already exists" }`
- `400`: `{ ok: false, message: "All fields are required" }`

### Admin (secure)

All admin requests must include:

```http
x-admin-token: <ADMIN_TOKEN>
```

#### `POST /admin/login`
Body: `{ "token": "<ADMIN_TOKEN>" }`
Used by the admin frontend to verify the token.

#### `GET /admin/users`
Returns all registered users (most recent first).

#### `GET /admin/users/:id`
Returns a single user.

#### `POST /admin/email/user/:id`
Send email to one user.

Body:

```json
{ "subject": "Hello", "text": "Your custom message..." }
```

#### `POST /admin/email/users`
Send email to multiple users.

Body:

```json
{
  "userIds": ["<id1>", "<id2>"],
  "subject": "Hello",
  "text": "Your custom message..."
}
```

#### `POST /admin/email/all`
Send email to all users.

Body:

```json
{ "subject": "Announcement", "text": "Your custom message..." }
```

## Frontend (separate): recruitment form + admin panel

### Local testing

1) Start backend at `http://localhost:3000`
2) In `frontend/recruitment.js` and `frontend/admin.js`, ensure:

```js
const API_BASE_URL = "http://localhost:3000";
```

3) Open:
- `frontend/recruitment.html`
- `frontend/admin.html`

### Production

Host the `frontend/` folder on any static host (GitHub Pages, Netlify, etc.).  
Then update both JS files:

```js
const API_BASE_URL = "https://<HF_USERNAME>-<SPACE_NAME>.hf.space";
```

## Docker (Hugging Face Spaces)

Build locally:

```bash
docker build -t member_reg_2026 .
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e MONGO_URI="..." \
  -e BREVO_API_KEY="..." \
  -e EMAIL_FROM="..." \
  -e ADMIN_TOKEN="..." \
  member_reg_2026
```

## CI/CD: GitHub Actions → Hugging Face Spaces (Docker)

Workflow: `.github/workflows/deploy-hf.yml`

### Required GitHub Secrets

- **HF_USERNAME**
- **HF_TOKEN**

### Required GitHub Repository Variable

- **HF_SPACE_NAME** (Space name, not secret)

On every push to `main`, the workflow:
1) builds the Docker image
2) pushes it to Hugging Face

## Hugging Face Spaces setup

1) Create a **Space** using **Docker** SDK.
2) Add Space variables (in Space settings):
   - `MONGO_URI`
   - `BREVO_API_KEY`
   - `EMAIL_FROM`
   - `ADMIN_TOKEN`
   - (Hugging Face will set `PORT` automatically)
3) After deployment, your backend base URL will be:
   - `https://<HF_USERNAME>-<HF_SPACE_NAME>.hf.space`

## Security notes (production)

- **ADMIN_TOKEN**: treat like a password; rotate periodically.
- **CORS**: restrict allowed origins instead of `*` when hosting your frontend.
- **Rate limiting / abuse protection**: recommended for `POST /login` and admin email endpoints.
- **Secrets**: never commit `.env` or hardcode keys in code.