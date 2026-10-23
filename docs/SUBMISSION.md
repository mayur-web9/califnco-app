# Califnco Submission & Testing Guide

**Candidate:** Mayur  
**Repository:** https://github.com/mayur-web9/califnco-app  
**Company:** Califnco Water Systems  
**Evaluator:** Al Amin  
**Deadline:** 25 October 2026, 11:59 PM IST  

---

## 1. Project Links & Assets

| Asset | Location / URL | Status |
| :--- | :--- | :--- |
| **GitHub Repository** | `https://github.com/mayur-web9/califnco-app` | Verified (`main` branch) |
| **Admin Web Portal** | `admin-web/` (Vercel-ready with Vite) | Verified & Tested |
| **Backend REST API** | `https://califnco-app.onrender.com` (Health: `https://califnco-app.onrender.com/health`) | **LIVE on Render** 🎉 |
| **Mobile Application** | `mobile/` (React Native Expo 51 + EAS Build) | Tested & Validated |
| **n8n Automation Workflow** | `automation/workflow.json` | Tested (Groq + FLUX.1-schnell) |
| **Clean ZIP Submission** | `califnco-submission-clean.zip` | Sanitized (Zero secrets/keys) |

---

## 2. Test Credentials & Authentication

Use these pre-seeded test accounts in Firebase Auth for evaluation across the Admin Web Portal and Mobile App.

| Role | Email | Password | Access Scope & Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `Admin@123456` | **Full Administrative Access**: Logs into the Admin Web Portal (`admin-web`). Can view financial KPI cards, manage product inventory and wholesale prices, approve or reject dealer applications, change order statuses (confirmed -> shipped -> delivered), and assign service technicians to customer tickets. |
| **Approved Dealer** | `dealer@test.com` | `Dealer@123456` | **B2B Wholesale Portal**: Approved dealer account (`dealerStatus: "approved"`). Logs into the Mobile App to unlock the wholesale catalog (`wholesale/` collection), discounted bulk pricing, minimum order quantity rules (`minQty`), and places bulk orders via server route `POST /orders/bulk`. |
| **Pending Dealer** | `dealer.pending@test.com` | `Dealer@123456` | **Pending Approval Flow**: Newly registered dealer (`dealerStatus: "pending"`). Mobile app locks navigation to `PendingApprovalScreen`. If an attacker attempts to call `POST /orders/bulk`, the server independently blocks them with HTTP `403 Forbidden`. |
| **Customer** | `customer@test.com` | `Customer@123456` | **B2C Retail Experience**: Standard retail customer. Browses retail products (`products/`), adds items to cart, checks out with server-computed tamper-proof Razorpay payment, receives multi-channel order notifications, tracks orders in real time, and books service requests. |

---

## 3. Payment Gateway Testing (Razorpay Test Mode)

Use the following Razorpay test credentials when verifying the tamper-proof checkout flow:

- **Card Number**: `4111 1111 1111 1111`
- **Expiry Date**: Any future date (e.g., `12/30`)
- **CVV**: Any 3 digits (e.g., `123`)
- **OTP**: Any 4-6 digits (e.g., `123456`) in Razorpay sandbox popup

---

## 4. What Works (Verified Test Results)

1. **Security & Server Idempotency**:
   - `server/scripts/testServerSecurityAndIdempotency.js`: **25/25 PASSED**.
   - Mandatory Firebase ID token verification on all protected endpoints (`401 Unauthorized` without token).
   - Role-based authorization (`403 Forbidden` for retail customers and pending dealers calling `/orders/bulk`).
   - Idempotent payment verification (duplicate `/payment/verify` calls return existing confirmed order without re-decrementing inventory).
   - Atomic inventory stock decrement and rollback inside Firestore transactions (`db.runTransaction`).
2. **Phase 3 Verification**:
   - `server/scripts/verifyPhase3.js`: **25/25 PASSED**.
   - Server-side price recomputation (`/payment/create-order` and `/orders/bulk`).
   - HMAC SHA-256 signature verification.
   - Address geocoding proxy (`/address/search`) using OpenStreetMap Nominatim with compliant User-Agent headers.
3. **Multi-Channel Notifications (Email, SMS, FCM)**:
   - `server/scripts/testNotificationService.js`: **6/6 PASSED**.
   - Transactional Email via Brevo REST API v3 / SMTP.
   - Transactional SMS via TextBee Free Android Gateway (bypassing India TRAI DLT regulations).
   - `server/scripts/testFcmAndServicePush.js`: **9/9 PASSED**.
   - Native device FCM push token registration in `users/{uid}.fcmToken`.
   - Real-time FCM push notification triggers on order status changes (`PATCH /orders/:id/status`) and service request updates (`PATCH /services/:id/status`).
4. **Mobile Features**:
   - **Dark Mode**: Persistent dark obsidian theme with instant toggle switch in `ProfileScreen.js` backed by `AsyncStorage`.
   - **Pinch-to-Zoom**: Fullscreen product image viewer in `ProductDetailScreen.js` with multi-touch pinch zoom (up to 4x).
   - **Dealer Flow**: Automatic routing between Retail Catalog, Pending Approval Screen, and Wholesale B2B Bulk Order Screen.
5. **Admin Web Portal**:
   - Real-time Firestore synchronization for orders, inventory, wholesale pricing, dealer approvals, and service tickets.
   - Dark/Light mode theme toggle.
   - Clean authentication with zero pre-filled hardcoded credentials.
6. **AI & Social Automation**:
   - Automated product promotion workflow (`automation/workflow.json`).
   - Groq AI copywriting with supported `llama-3.3-70b-versatile` model.
   - Image generation with Hugging Face Serverless Router (`FLUX.1-schnell`).

---

## 5. Security & Secret Protection

- All `.env` files and `*serviceAccountKey*.json` files are strictly excluded via `.gitignore`.
- Automated packaging script `server/scripts/packageSubmission.js` builds clean release archives `califnco-submission-clean.zip` with zero secrets, keys, or node_modules.
- Server enforces startup exit (`process.exit(1)`) in production environments if Razorpay keys are missing or placeholders.
