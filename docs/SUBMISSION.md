# Califnco Submission & Verification Guide

Candidate: Mayur  
Repository: https://github.com/mayur-web9/califnco-app  
Company: Califnco Water Systems  
Evaluator: Al Amin  
Submission Date: 25 October 2026  

---

## 1. Project Links & Deliverables

| Deliverable | URL / Path | Notes |
| :--- | :--- | :--- |
| **GitHub Repository** | `https://github.com/mayur-web9/califnco-app` | Verified on `main` branch |
| **Working Video Demonstration** | `[Insert Google Drive / Loom Link Here]` | End-to-end walkthrough (Customer, Dealer, Admin, Automation) |
| **Standalone Android APK** | [Download APK](https://expo.dev/artifacts/eas/0CE54Nq4YFMHztXnvg6rSMadDKrIyU8INncF5MAhn7s.apk) | Build ID: `8ab46fe7` via EAS Cloud (Ready to install) |
| **Admin Web Portal** | `https://califnco-app-phi.vercel.app` | Hosted on Vercel (Admin credentials below) |
| **Backend REST API** | `https://califnco-app.onrender.com` | Health endpoint: `https://califnco-app.onrender.com/health` |
| **Live Instagram Daily Post** | `https://www.instagram.com/p/De6NjyZDfoX/` | Published live via Meta Graph API & Pollinations FLUX |
| **Automation Workflow (n8n)** | `automation/workflow.json` | 1-click importable workflow file |
| **GitHub Actions Workflow** | `.github/workflows/daily-post.yml` | Scheduled daily at 10:00 AM IST (04:30 UTC) |

---

## 2. Test Account Credentials

Pre-seeded accounts in Firebase Auth and Firestore (`users/{uid}`):

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `Admin@123456` | Full administrative access to the Vercel admin dashboard. Manages orders, reviews and approves/rejects dealer applications, updates ticket statuses. Non-admin users are strictly blocked. |
| **Approved Dealer** | `dealer@test.com` | `Dealer@123456` | Logs into mobile app to view wholesale pricing, minimum order quantities (`minQty`), and places bulk orders via `POST /orders/bulk`. |
| **Pending Dealer** | `dealer.pending@test.com` | `Dealer@123456` | Newly registered dealer awaiting review. Locked to pending approval hold screen; server blocks wholesale orders with HTTP 403 Forbidden. |
| **Customer** | `customer@test.com` | `Customer@123456` | Retail customer. Browses products, adds items to cart, completes tamper-proof Razorpay checkout, tracks orders, and books service requests. |

---

## 3. Razorpay Payment Gateway Testing

Use the following Razorpay sandbox test credentials during mobile checkout:

- **Card Number**: `4111 1111 1111 1111`
- **Expiry Date**: Any future date (e.g., `12/30`)
- **CVV**: Any 3 digits (e.g., `123`)
- **OTP**: Any 4-6 digits (e.g., `123456`) in Razorpay sandbox popup

---

## 4. Test Verification Summary

Command lines and real test suite results executed in this repository:

1. **Firestore Client Security Rules (`node server/scripts/testRulesSecurity.js`)**:
   - **27/27 PASSED**
   - Asserts that unauthorized clients (Guests, Customers, Dealers) receive `permission-denied` on:
     - Reading or writing `payment_orders`
     - Reading `wholesale/` (permitted only for approved dealers & admins)
     - Creating orders directly from the client (`allow create: if false`)
     - Modifying sensitive user profile fields (`role`, `dealerStatus`)
2. **Server Auth, Idempotency & Transactions (`node server/scripts/testServerSecurityAndIdempotency.js`)**:
   - **28/28 PASSED**
   - Mandatory Bearer token authentication (401 without token)
   - Role enforcement (403 for customers/pending dealers on `/orders/bulk`)
   - Idempotent payment verification (duplicate calls return existing order without double-decrementing stock)
   - Atomic inventory stock decrement and transaction rollback on insufficient stock
   - Cancelled and failed payments create zero order documents in Firestore
3. **Phase 3 Integration (`node server/scripts/verifyPhase3.js`)**:
   - **31/31 PASSED**
   - Server-side price recomputation
   - HMAC SHA256 signature verification
   - Tampered client items in request body are discarded in favor of server-stored session records
   - Nominatim address lookup proxy
4. **Daily Post Automation (`node automation/runDailyPost.js`)**:
   - Live execution successfully retrieved next product (`prod_spare_03`) from live Render catalog rotation
   - Generated factual caption via Groq (`openai/gpt-oss-120b`) forbidding unverified numeric claims
   - Synthesized product image via Pollinations FLUX with deterministic seed (`361811`)
   - Cropped bottom 8% watermark and resized to 1080x1080 JPEG using `sharp` (71.2 KB, validated > 30 KB)
   - Uploaded to Cloudinary with signed credentials (`califnco/daily-posts`)
   - Confirmed transformed 1:1 Instagram image URL returns HTTP 200 and `image/jpeg` via HEAD request
   - Published live post via Instagram Graph API: Container `18084260447401221`, Media `18034520552889345`
   - Verified live post online: `https://www.instagram.com/p/De6Czs2jY42/`
5. **Admin Web Portal Build (`npm run build` in `admin-web`)**:
   - Built cleanly with Vite in 4.24s with zero compilation or lint errors.

---

## 5. Known Limitations & Blocked Items

- **Push Notifications on Real Devices**: In Expo Go and local development, remote FCM push notifications are simulated via mock tokens without crashing. Receiving native background push banners on an Android device requires running the standalone built preview APK configured with `google-services.json`.
- **Live Transactional Email & SMS Dispatch**: Marked **BLOCKED**. Real provider dispatches require user-supplied keys (`BREVO_API_KEY`, `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`, `TEST_EMAIL`, `TEST_PHONE`). The verification script `node server/scripts/testNotifications.js` exits non-zero and reports `BLOCKED` when these keys are not set. In server operations, notification dispatches run inside unawaited, non-blocking try-catch blocks; missing provider keys log payloads gracefully without causing transactions to fail.
- **Render Server Free-Tier Cold Starts**: Render's free compute tier spins down inactive web services. An initial cold-start request can take 30 to 45 seconds to wake up the server. Both the mobile app checkout flow and the automation catalog fetch implement 45 to 60-second timeouts with retry logic to handle cold starts cleanly.
