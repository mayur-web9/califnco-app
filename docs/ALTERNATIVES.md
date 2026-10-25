# Alternatives — Tool Substitutions and Reasons

This document records each tool or service substitution implemented in the Califnco project, why the traditional or proposed tool could not be used without cost or operational friction, and how the chosen zero-cost alternative operates in evaluation and production.

---

## Tool Substitution Matrix

| Category | Proposed / Traditional Tool | Substitute Selected | Why Traditional Tool Cannot Work for Free | How Substitute Operates at Zero Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Automation Scheduler** | Local self-hosted n8n instance | **GitHub Actions (`.github/workflows/daily-post.yml`)** | Self-hosted n8n requires an always-on VM or local server running 24/7 with network tunneling (e.g. ngrok) to receive external triggers, incurring compute or subscription costs. | GitHub Actions provides free scheduled cron runners (`cron: '30 4 * * *'`, 10:00 AM IST) executing `node automation/runDailyPost.js` completely serverless in under 1 minute per day within GitHub's free 2,000 monthly minutes. |
| **Image Generation** | OpenAI DALL-E 3 / Midjourney / Hugging Face Router | **Pollinations FLUX & Hugging Face FLUX.1-schnell** | DALL-E 3 and Midjourney require paid credits/subscriptions. Hugging Face serverless router tokens frequently hit rate limits or account credit requirements. | Pollinations FLUX operates serverlessly with no API key, zero KYC, and zero cost, returning valid 1080x1080 JPEG product photography (> 10 KB). The script tries Hugging Face first when credits exist and falls back automatically to Pollinations. |
| **AI Copywriting** | OpenAI GPT-4o / Anthropic Claude | **Groq Cloud (`llama-3.3-70b-versatile` with runtime fallback)** | OpenAI and Anthropic require credit card registration and upfront prepaid credit deposits ($5+). | Groq provides a generous free tier (14,400 requests/day) with ultra-fast (< 500 ms) inference. The automation script queries Groq's active model list at runtime, selecting `llama-3.3-70b-versatile` or an active fallback, enforcing strict factual constraints with zero invented claims. |
| **Address Geocoding** | Google Places / Google Maps Platform | **OpenStreetMap Nominatim (with Geoapify fallback)** | Google Maps requires Google Cloud billing activation with an active credit card; accidental quota spikes risk credit card charges. | OpenStreetMap Nominatim is 100% open-source and free without API keys, proxied via backend `GET /address/search` with a compliant `User-Agent: CalifncoApp/1.0`. Geoapify provides 3,000 free credits/day as an API fallback. |
| **Email Gateway** | SendGrid / Mailgun / AWS SES | **Brevo (formerly Sendinblue)** | SendGrid and Mailgun enforce strict custom domain verification (SPF/DKIM/DMARC) and credit card entry, blocking free webmail accounts. AWS SES requires manual sandbox approval tickets. | Brevo provides a free tier of **300 transactional emails per day** forever with zero credit card required, supporting both direct REST API dispatch (`POST /v3/smtp/email`) and standard SMTP. |
| **SMS Gateway** | Twilio / Gupshup / Fast2SMS | **TextBee Android Gateway (`https://textbee.dev`)** | India's Telecom Regulatory Authority of India (TRAI) TCCCPR mandate requires ₹5,900+ DLT registration, company CIN/GST, and pre-approved templates. Twilio cannot deliver cross-border SMS to Indian numbers on trial balances. | TextBee connects via WebSocket to a spare Android device with an Indian SIM card (using included free carrier SMS quotas from Jio/Airtel plans), delivering real SMS at ₹0 cost without DLT delays. |
| **Mobile Build & Distribution** | Local Android Studio / Google Play Store ($25 developer account) | **Expo Application Services (EAS) Cloud Build Preview APK** | Local Android Studio requires high-end local hardware and native SDK setup. Google Play Store requires a $25 developer registration fee and multi-day review times. | `eas build -p android --profile preview` compiles a standalone installable Android APK in Expo's cloud infrastructure for free. Users can download and install the APK directly on any Android device via link or QR code. |

---

## Detailed Substitution Rationale

### 1. GitHub Actions Scheduler vs. Local n8n
While `automation/workflow.json` remains fully documented and exportable for users running n8n, running daily scheduled social media posts via local n8n requires leaving a computer powered on continuously. GitHub Actions runs scheduled cron workflows on GitHub's cloud runners at zero cost, pulling secrets safely from repository settings and executing the complete 5-step automation pipeline.

### 2. Pollinations FLUX vs. Paid Generative Engines
Generative image models like Midjourney and DALL-E 3 have no perpetual free API tier. Hugging Face's serverless router occasionally requires paid compute credits depending on token tier. Pollinations FLUX provides instant, high-resolution (1080x1080) photorealistic studio images on a white/neutral background with zero API key requirement, ensuring the daily social post pipeline never fails due to quota exhaustion.

### 3. Groq LLaMA 3.3 Model Selection
Instead of hardcoding a fixed model string that might be deprecated or unavailable in a user's API tier, the automation runner dynamically queries `GET https://api.groq.com/openai/v1/models` at runtime. It checks for `llama-3.3-70b-versatile` as the primary model and falls back to at most one active model in Groq's catalog (e.g. `openai/gpt-oss-120b`). Nonexistent model names are pruned.

### 4. Nominatim Geocoding vs. Google Maps
Nominatim provides reverse and forward geocoding for Indian addresses (pincodes, localities, streets) without authentication. To comply with OpenStreetMap's usage policy, our Express server proxies requests with a custom `User-Agent` header, caching responses and eliminating the risk of unexpected credit card charges.

### 5. Brevo Transactional Email
Brevo's API requires only an API key to send branded transactional receipts with itemized order summaries, eliminating the need to own a paid custom domain or setup DNS MX/TXT records.

### 6. TextBee Android Gateway
TextBee bridges cloud events to cellular SMS by relaying API payloads to an Android app via WebSockets. The phone's native telephony manager sends the SMS using standard cellular plan quotas.

### 7. EAS Cloud Build Preview APK
Expo's EAS Build cloud compiles React Native 0.74 / Expo SDK 51 directly into a production-signed `.apk` without requiring Android Studio, Gradle, or Java Development Kit on the host machine.
