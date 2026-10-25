# Califnco Automated Social Media Marketing Engine

This directory contains the production-ready daily social media marketing engine that automatically posts one featured product per day to **Instagram** with an AI-generated product image, a strictly factual caption, and an optional **WhatsApp Status** broadcast via WAHA.

---

## 1. Primary Scheduler: GitHub Actions (`.github/workflows/daily-post.yml`)

The primary automation engine runs serverlessly on **GitHub Actions** daily at **10:00 AM IST** (`cron: '30 4 * * *'`, corresponding to 04:30 UTC):

- Workflow file: `.github/workflows/daily-post.yml`
- Runner script: `automation/runDailyPost.js`
- Runtime environment: Node.js 20 on `ubuntu-latest`
- Trigger types: Scheduled cron and manual `workflow_dispatch`

### GitHub Actions Secrets Configuration

To configure the automation pipeline on GitHub:
1. Navigate to your repository: **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret** and add the following keys:

| Secret Name | Description | Source / Notes |
|-------------|-------------|----------------|
| `SERVER_URL` | Live backend URL (`https://califnco-app.onrender.com` or custom domain) | Render service dashboard |
| `GROQ_API_KEY` | Groq API Key for fast LLaMA 3.3 70B caption generation | [console.groq.com](https://console.groq.com) |
| `HUGGINGFACE_API_KEY` | Hugging Face Access Token for FLUX.1-schnell image model | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name for media delivery | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Signed Cloudinary API Key | Cloudinary Dashboard -> API Keys |
| `CLOUDINARY_API_SECRET` | Signed Cloudinary API Secret | Cloudinary Dashboard -> API Keys |
| `META_ACCESS_TOKEN` | Long-lived Meta User/Page Access Token with `instagram_content_publish` | Meta for Developers |
| `IG_USER_ID` | Instagram Professional / Business Account ID | Meta Graph API Explorer |
| `WAHA_URL` | *(Optional)* Self-hosted WhatsApp HTTP API instance | `http://<your-host>:3000` |

---

## 2. Pipeline Execution Steps (`automation/runDailyPost.js`)

1. **Catalog Rotation**: Calls `GET ${SERVER_URL}/automation/next-product` with 60 second timeout and 3 retries (handling Render cold starts gracefully).
2. **Factual Caption Generation**: Queries Groq API (`llama-3.3-70b-versatile` primary with runtime fallback check). Constraints: strictly factual product data only; forbids invented discounts, festive offers, percentage claims, delivery/installation promises, and health claims. Markdown is stripped. Output is 2 to 4 short lines, one call-to-action mentioning the Califnco app, and 5 to 8 relevant hashtags.
3. **Studio Product Image Generation**: Tries Hugging Face `FLUX.1-schnell` via router endpoint if `HUGGINGFACE_API_KEY` is configured; falls back automatically to Pollinations FLUX. Prompt: clean product photograph of the named item on white/neutral studio background, no text/people/logos. Validates that returned buffer is JPEG/PNG > 10 KB. Never substitutes catalog photo.
4. **Cloudinary Upload & Optimization**: Uploads signed image to folder `califnco/daily-posts`, public ID `<productId>-<YYYYMMDD>`, overwrite true. Derives 1:1 Instagram square URL (`/upload/f_jpg,c_fill,ar_1:1,w_1080,q_auto/`) and verifies with a `HEAD` request (requires HTTP 200 and `image/jpeg`).
5. **Meta Instagram Publishing**: When `META_ACCESS_TOKEN` and `IG_USER_ID` are set, creates container via `POST /{IG_USER_ID}/media`, polls status until `FINISHED` (60s timeout), publishes via `POST /{IG_USER_ID}/media_publish`, fetches permalink, and logs output. If credentials are missing, prints `NOT POSTED: Meta credentials missing (META_ACCESS_TOKEN, IG_USER_ID)` and exits with code 2.
6. **Optional WAHA Status Broadcast**: If `WAHA_URL` is set, dispatches a status update via `POST ${WAHA_URL}/api/sendImage` without blocking the pipeline.

---

## 3. Local CLI Execution

```bash
# Live execution
node automation/runDailyPost.js

# Dry-run execution (verifies generation rules without external API calls)
node automation/runDailyPost.js --dry-run
```

---

## 4. Alternative Design: n8n Workflow (`automation/workflow.json`)

As an alternative visual workflow architecture, `automation/workflow.json` provides an export that can be imported directly into any n8n instance:

- **Schedule Trigger**: Daily at 10:00 AM IST (`0 10 * * *`)
- **HTTP Request**: Retrieves next product from `/automation/next-product`
- **Groq LLaMA 3.3 Node**: Formats factual marketing copy conforming to the exact negative constraints
- **Cloudinary Node**: Generates CDN delivery URL
- **Meta Graph API Nodes**: 2-step media container creation and publication
- **WAHA Node**: Optional broadcast to WhatsApp status
