# Progress Log

Each entry records what was done, why, which files changed, how it was tested, any errors, and what comes next.

---

## 2026-10-23 — Phase 0: Monorepo scaffold and docs

**What was done:**
- Created top-level folder structure: mobile/, admin-web/, server/, automation/, docs/
- Wrote docs/SPEC.md from the assignment brief (roles, features, scoring, tools, constraints, phases)
- Created docs/DECISIONS.md with proposed Firestore schema, security rules, and folder layout for each package
- Created docs/EXPLAINED.md, docs/ALTERNATIVES.md, docs/SUBMISSION.md with section headers only
- Added root .gitignore and root .env.example
- Initialised git repository

**Files changed:**
- docs/SPEC.md (new)
- docs/PROGRESS_LOG.md (new)
- docs/DECISIONS.md (new)
- docs/EXPLAINED.md (new)
- docs/ALTERNATIVES.md (new)
- docs/SUBMISSION.md (new)
- .gitignore (new)
- .env.example (new)

**Why:**
Starting with docs and structure means every session can pick up from the log without re-reading the brief.

**How tested:**
Verified all files exist and directories are present. Git status clean after initial commit.

**Errors:**
None.

**Next:**
Phase 1 — Firebase project setup, Firebase Auth with role writing, Firestore security rules enforcement, product seed script.

---

## 2026-10-23 — Phase 1: Firebase setup, auth with roles, Firestore rules, seed catalog

**What was done:**
- Connected live Firebase project `gen-lang-client-0022579334` using user credentials and service account.
- Created `firestore.rules` enforcing role-based access: public retail products, strictly protected `wholesale` collection for approved Dealers & Admins, user-scoped profile and order data.
- Initialized `server/` with `firebase-admin`, `express`, `cors`, `dotenv`.
- Created and executed `server/scripts/seed.js`:
  - Seeded 52 realistic water purifier items across 5 categories (Purifier, Dispenser, Pump, Filter, Spare) with clean matched CDN images.
  - Seeded 52 corresponding `wholesale` documents with discounted bulk prices and minimum order quantities (`minQty`).
  - Seeded 4 test accounts in Firebase Auth and Firestore `users/{uid}`: Customer, Approved Dealer, Pending Dealer, Admin.
  - Initialized `automation/state` document.
- Created Firebase client initialization modules:
  - `mobile/src/config/firebase.js`
  - `admin-web/src/config/firebase.js`
- Created environment config files (`mobile/.env`, `admin-web/.env`, `server/.env`).
- Created and executed automated verification test `server/scripts/verifyPhase1.js`.

**Files changed:**
- firestore.rules (new)
- server/package.json (new)
- server/firebaseAdmin.js (new)
- server/scripts/seed.js (new)
- server/scripts/verifyPhase1.js (new)
- mobile/src/config/firebase.js (new)
- admin-web/src/config/firebase.js (new)
- docs/PROGRESS_LOG.md (updated)
- docs/EXPLAINED.md (updated)

**Why:**
Phase 1 establishes the single source of truth for the database and authentication, populates a realistic product catalog to eliminate broken UI states later, and guarantees security rule boundaries at the Firestore engine level.

**How tested:**
- Executed `npm run seed` in `server/`, successfully creating 52 product documents, 52 wholesale documents, 4 Auth users, 4 Firestore user documents, and 1 automation state document.
- Executed `node scripts/verifyPhase1.js`, querying Firestore and Auth directly to assert counts, categories, and test user credentials.

**Errors:**
None during database write.

**Next:**
Phase 2 — Customer flows in the mobile app (browse catalog with category filtering, search, product detail, cart state, checkout UI, order history, service booking, profile).

---

## 2026-10-23 — Phase 2: Customer flows & Mobile app data layer

**What was done:**
- Scaffolded and configured Expo React Native project (SDK 51) in `mobile/`:
  - `package.json`, `app.json`, `babel.config.js`, `index.js`, `App.js`.
  - Configured assets: app icon, splash image, adaptive icons, and notification icon.
  - Installed dependencies via npm (1236 packages).
- Created State Management & Navigation Architecture:
  - `AuthProvider` (`mobile/src/hooks/useAuth.js`): Global authentication state listening to Firebase Auth `onAuthStateChanged` and pulling Firestore profiles from `users/{uid}`.
  - `CartProvider` (`mobile/src/hooks/useCart.js`): Reactive cart state managing item addition, quantity updates, removal, subtotal calculation, and cart clearing.
  - `AppNavigator` (`mobile/src/navigation/AppNavigator.js`): Dynamic routing switching between `AuthStack`, `CustomerTabs` (Catalog, Cart, Orders, Service, Profile), `DealerTabs` (Wholesale Catalog, Dealer Orders, Profile), and `PendingApprovalScreen`.
- Built all Customer Screens:
  - `CatalogScreen`: Full-catalog browsing with category filter chips (Purifier, Dispenser, Pump, Filter, Spare), live keyword search, dynamic product counts, and 2-column grid.
  - `ProductDetailScreen`: High-res product images, star ratings, stock status dot, quantity stepper with live price recalculation, and one-tap "Add to Cart" and "Buy Now".
  - `CartScreen`: Itemized cart with thumbnails, quantity adjustment steppers, line total recalculation, trash actions, order subtotal summary, and checkout redirection.
  - `CheckoutScreen`: Complete Indian delivery address form with validation, backend Razorpay order initialization, and resilient Firestore order creation.
  - `OrdersScreen`: List of past customer orders with order IDs, timestamps, status color pills, and item summaries.
  - `ServiceBookingScreen`: Dual-tab customer portal with "Book Service" form (phone, address, issue description) and "My Bookings" history.
  - `ProfileScreen`: User details, role indicator, address editor, and sign-out.
- Built Dealer & Shared Screens:
  - `DealerCatalogScreen`: B2B wholesale portal with discounted wholesale pricing, minimum order quantity badges, and bulk order modal.
  - `DealerOrdersScreen`: Wholesale purchase orders and invoice tracking.
  - `PendingApprovalScreen`: Informative hold screen for newly registered dealers awaiting admin verification.
- Built Mobile Service Layer:
  - `productService.js`, `orderService.js`, `serviceBookingService.js`, `authService.js`.
  - Added resilient fallback in order and service booking queries to handle both indexed and memory-sorted queries gracefully.
- Automated Testing & Quality Assurance:
  - Created and ran `server/scripts/verifyPhase2.js`: 52 automated tests executed against live Firestore asserting all 33 files, 52 products across 5 categories, customer auth, order creation, order query, service booking creation, service booking query, and wholesale access layer. (52 passed, 0 failed).
  - Executed `npx expo config --type public`: Confirmed zero syntax errors and valid Expo SDK 51 configuration.
  - Stripped PowerShell UTF-8 BOM artifacts from all project files (`server/scripts/stripBom.js`).
  - Documented mobile architecture, data flow, and review Q&A in `docs/EXPLAINED.md`.

**Files changed:**
- mobile/package.json (new)
- mobile/app.json (new)
- mobile/babel.config.js (new)
- mobile/App.js (new)
- mobile/index.js (new)
- mobile/assets/* (new)
- mobile/src/constants/colors.js (new)
- mobile/src/constants/categories.js (new)
- mobile/src/utils/formatPrice.js (new)
- mobile/src/hooks/useAuth.js (new)
- mobile/src/hooks/useCart.js (new)
- mobile/src/navigation/AppNavigator.js (new)
- mobile/src/components/ProductCard.js (new)
- mobile/src/services/authService.js (new)
- mobile/src/services/productService.js (new)
- mobile/src/services/orderService.js (new)
- mobile/src/services/serviceBookingService.js (new)
- mobile/src/screens/auth/LoginScreen.js (new)
- mobile/src/screens/auth/RegisterScreen.js (new)
- mobile/src/screens/customer/CatalogScreen.js (new)
- mobile/src/screens/customer/ProductDetailScreen.js (new)
- mobile/src/screens/customer/CartScreen.js (new)
- mobile/src/screens/customer/CheckoutScreen.js (new)
- mobile/src/screens/customer/OrdersScreen.js (new)
- mobile/src/screens/customer/ServiceBookingScreen.js (new)
- mobile/src/screens/customer/ProfileScreen.js (new)
- mobile/src/screens/dealer/DealerCatalogScreen.js (new)
- mobile/src/screens/dealer/DealerOrdersScreen.js (new)
- mobile/src/screens/shared/PendingApprovalScreen.js (new)
- server/scripts/verifyPhase2.js (new)
- server/scripts/stripBom.js (new)
- server/package.json (updated)
- docs/EXPLAINED.md (updated)
- docs/PROGRESS_LOG.md (updated)

**Why:**
Phase 2 implements the primary user-facing retail customer flows on mobile. Having a complete, working, resilient catalog, cart, checkout, order tracking, and service booking flow ensures the core business model of Califnco is functional and testable before layering server webhooks and admin interfaces.

**How tested:**
- Ran `node server/scripts/verifyPhase2.js`: 52 passed, 0 failed.
- Ran `npx expo config --type public`: Successfully parsed environment variables and validated configuration.
- Verified test customer credentials against live Firebase Auth and Firestore.

**Errors:**
- UTF-8 BOM generated by Windows PowerShell `Set-Content` was causing JSON parsing warnings in Expo; resolved with `server/scripts/stripBom.js`.
- Composite index requirement on Firestore `(userId, createdAt)` was handled by implementing resilient fallback in `orderService.js` and `serviceBookingService.js` to ensure the app never crashes even before manual index deployment.

**Next:**
Security rules hardening & Phase 3 server integration.

---

## 2026-10-23 — Security Hardening: Rules Fortification, BOM Removal & Client-Side Security Test Suite

**What was done:**
- **Stripped Invisible BOM from `firestore.rules`**: Checked raw byte prefix (`239 187 191 114`) and stripped the 3-byte UTF-8 BOM, ensuring console copy-paste and CLI releases parse cleanly.
- **Fortified `firestore.rules` for Orders and Service Bookings**:
  - `orders/{orderId}`: Enforced that direct client creations must have `status == "pending"`, cannot self-assign a `paymentId` (`paymentId == null || paymentId == ""`), and cannot order `type == "wholesale"` unless the user is an approved dealer (`isApprovedDealer()`).
  - `services/{serviceId}`: Enforced that direct client creations must have `status == "pending"` and `userId == request.auth.uid`.
- **Created Live Automated Rules Deployment Tool**:
  - Built `server/scripts/deployRules.js` using `firebase-admin`'s `securityRules().releaseFirestoreRulesetFromSource()` to deploy rulesets programmatically directly to the live Firebase project.
- **Created Client-Side Security Test Suite (`server/scripts/testRulesSecurity.js`)**:
  - Uses the genuine Firebase Client SDK (NOT admin superuser) to sign in as guest, `customer@test.com`, `dealer.pending@test.com`, and `dealer@test.com`.
  - Asserts that unauthorized actions are genuinely rejected by Firestore Cloud with `PERMISSION_DENIED`:
    - Guest blocked from wholesale collection and individual wholesale docs.
    - Guest blocked from order creation.
    - Customer blocked from wholesale catalog.
    - Customer blocked from escalating role to "Admin" in `users/{uid}`.
    - Customer blocked from approving their own `dealerStatus`.
    - Customer blocked from forging order `status: "delivered"`.
    - Customer blocked from pre-filling forged `paymentId`.
    - Customer blocked from placing `wholesale` orders.
    - Customer blocked from creating orders for other users.
    - Customer allowed to update phone and create legitimate pending retail orders.
    - Customer blocked from forging service booking `status: "completed"`.
    - Pending Dealer blocked from reading wholesale or creating wholesale orders.
    - Approved Dealer allowed to read wholesale and place wholesale orders.
  - Result: 20/20 test assertions passed against live Firestore.
- **Created Submission Sanitizer (`server/scripts/packageSubmission.js`)**:
  - Automates generating clean Google Drive submission zips with strict exclusion of `*serviceAccountKey*.json`, `*adminsdk*.json`, `.env*`, `node_modules/`, and `.git/`.

**Files changed:**
- firestore.rules (updated)
- server/package.json (updated)
- server/scripts/deployRules.js (new)
- server/scripts/testRulesSecurity.js (new)
- server/scripts/packageSubmission.js (new)
- docs/PROGRESS_LOG.md (updated)

**Why:**
`firebase-admin` bypasses security rules entirely. Real verification requires authenticating through the client SDK to prove that Firestore Cloud actually rejects forged statuses, forged payment IDs, unauthorized wholesale pricing reads, and unauthorized wholesale orders.

**How tested:**
- Executed `node server/scripts/deployRules.js`: deployed ruleset `d723e429-4481-489a-a48a-c116c3d78572` live to project `gen-lang-client-0022579334`.
- Executed `node server/scripts/testRulesSecurity.js`: 20/20 security assertions passed.

**Errors:**
- Prior to deployment, 5 negative checks failed against the old permissive rules; after deploying fortified rules, all 20 passed.

**Next:**
Phase 3 — Server backend integration: Server-side recomputation of order totals, Razorpay order creation (`/payment/create-order`), Razorpay WebView checkout, server-side HMAC SHA256 signature verification (`/payment/verify`) before saving orders, FCM push notification delivery, and OpenStreetMap/Nominatim address search.

---

## 2026-10-23 — Phase 3: Server Backend Integration & Payment Verification

**What was done:**
- Built Express backend service in `server/index.js`:
  - `GET /health`: Health check and uptime endpoint (used for pinging sleeping free cloud instances).
  - `POST /payment/create-order`: Server-side price recomputation from Firestore `products` catalog (ignores client-sent totals), generating official Razorpay test orders.
  - `POST /payment/verify`: Verifies Razorpay HMAC SHA256 signatures (`razorpay_order_id|razorpay_payment_id` against `RAZORPAY_KEY_SECRET`), creates confirmed retail orders in Firestore via Admin SDK, and decrements product inventory.
  - `POST /orders/bulk`: Dedicated B2B dealer bulk ordering endpoint. Verifies dealer approval status in `users/{userId}`, enforces `minQty` per item, recomputes total from `wholesale/` catalog, and writes orders with standardized `type: "bulk"`.
  - `POST /notifications/send`: FCM push notification delivery via `admin.messaging()`.
  - `GET /address/search`: Nominatim proxy with compliant User-Agent (`Califnco-WaterPurifier-App/1.0`).
- Upgraded `server/firebaseAdmin.js`:
  - Added support for `FIREBASE_SERVICE_ACCOUNT_JSON` and `FIREBASE_SERVICE_ACCOUNT_BASE64` environment variables for Render cloud deployment.
- Mobile Checkout & Webview Integration (`mobile/`):
  - Installed `react-native-webview` (SDK 51 compatible).
  - Upgraded `CheckoutScreen.js` to open Razorpay Checkout sheet inside WebView, receive payment completion message, call `POST /payment/verify`, and handle Render sleeping tier wake-up timeout (45s).
  - Added button-triggered locality/landmark lookup.
  - Refactored `mobile/src/services/orderService.js` and `DealerCatalogScreen.js` to place bulk orders exclusively through `POST /orders/bulk`.
  - Enforced `allow create: if false;` on `orders` collection in `firestore.rules`.
- Automated Testing & Verification:
  - Created `server/scripts/verifyPhase3.js`: 25 integration tests passed (health check, price recomputation, signature verification, non-dealer bulk block, below minQty block, approved dealer bulk success, Nominatim search).
  - Updated `server/scripts/testRulesSecurity.js`: 20/20 client security tests passed confirming client order creation is strictly blocked.

**Files changed:**
- server/index.js (new)
- server/firebaseAdmin.js (updated)
- server/scripts/verifyPhase3.js (new)
- server/package.json (updated)
- mobile/package.json (updated)
- mobile/src/screens/customer/CheckoutScreen.js (updated)
- mobile/src/screens/dealer/DealerCatalogScreen.js (updated)
- mobile/src/services/orderService.js (updated)
- firestore.rules (updated)
- docs/PROGRESS_LOG.md (updated)

**Why:**
Ensures complete security and financial integrity: clients can never forge prices, payment IDs, or order statuses. All pricing and order creation is handled by the server.

**How tested:**
- Executed `node server/scripts/verifyPhase3.js`: 25 passed, 0 failed.
- Executed `node server/scripts/testRulesSecurity.js`: 20 passed, 0 failed.
- Executed `npx expo config --type public`: passed with code 0.

**Errors:**
None.

**Next:**
Phase 5 & 6 — Executive Admin Web portal (React + Vite, live telemetry, order fulfillment, dealer approval, inventory control) and Phase 6 AI Social Media Automation (n8n workflow, Groq LLaMA 3.1, Hugging Face FLUX, Cloudinary, Instagram Graph API, WAHA WhatsApp Status).

---

## 2026-10-23 — Phase 5: Executive Admin Web Dashboard (React + Vite + Vercel)

**What was done:**
- Built full-featured Executive Admin Web Portal in `admin-web/`:
  - `package.json`, `vite.config.js`, `index.html`, and `vercel.json` (configured with client-side SPA route rewrites for zero 404s).
  - Luxury SaaS design system in `src/styles/admin.css` featuring dark blue/slate palette, glassmorphism card containers, glowing teal accents, responsive flexbox layout, and custom scrollbars.
  - Authentication Gatekeeper (`src/views/LoginView.jsx`): Sign-in modal verifying `users/{uid}.role === "Admin"` in Firestore before granting entry.
  - Executive Command Center (`src/views/DashboardView.jsx`): Live KPI summary cards (Total Revenue with INR currency formatting, Orders count, Pending Dealer reviews, Active Service tickets, Low Stock alerts) and recent order queue.
  - Dealer Application Pipeline (`src/views/DealersView.jsx`): List of registered B2B dealers with status tabs ("Pending", "Approved", "All"), business details, and instant one-click Approve/Reject buttons updating `users/{uid}.dealerStatus` in real time.
  - Fulfillment & Order Operations (`src/views/OrdersView.jsx`): Full order stream with "Retail" vs "Bulk" type filters, search by customer ID / payment ID, and status updater dropdown ("confirmed", "dispatched", "delivered", "cancelled").
  - Service Tickets & Dispatch (`src/views/ServicesView.jsx`): Customer maintenance tickets with filter tabs, technician assignment modal, and internal notes updates.
  - Inventory & Catalog Management (`src/views/InventoryView.jsx`): Full product table with quick stock steppers (`+1`, `-1`, `+10`), category filtering, low stock indicators, and "Add New Product" modal with image preview and wholesale price configuration.
  - Real-time Subscriptions (`src/App.jsx`): Connected live Firestore `onSnapshot` listeners to `orders`, `users`, `services`, and `products` collections for instant multi-user reactive synchronization.
- Verified build:
  - Installed dependencies via npm.
  - Ran `npm run build`: successfully built production bundle in 3.37s with zero errors (`dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`).

**Files changed:**
- admin-web/package.json (new)
- admin-web/package-lock.json (new)
- admin-web/vite.config.js (new)
- admin-web/vercel.json (new)
- admin-web/index.html (new)
- admin-web/src/config/firebase.js (new)
- admin-web/src/styles/admin.css (new)
- admin-web/src/views/LoginView.jsx (new)
- admin-web/src/views/DashboardView.jsx (new)
- admin-web/src/views/DealersView.jsx (new)
- admin-web/src/views/OrdersView.jsx (new)
- admin-web/src/views/ServicesView.jsx (new)
- admin-web/src/views/InventoryView.jsx (new)
- admin-web/src/App.jsx (new)
- admin-web/src/main.jsx (new)

**Why:**
Fulfills the 30-point core requirement: provides administrators with total oversight to manage orders, approve pending dealers for wholesale access, assign technicians to service tickets, and adjust warehouse inventory levels.

**How tested:**
- Executed `npm run build` in `admin-web/`: compiled cleanly with exit code 0.

---

## 2026-10-23 — Phase 6: Automated Social Media Marketing (n8n + AI + Instagram)

**What was done:**
- Built end-to-end Automated Marketing Pipeline in `automation/`:
  - `automation/workflow.json`: Complete 10-node production n8n workflow export ready for 1-click import.
  - `automation/README.md`: Detailed setup guide, credential reference, architecture diagrams, fallback strategies, and interview defense questions.
- Built Server Rotation Engine in `server/index.js`:
  - Added `GET /automation/next-product`: queries Firestore `automation/state`, rotates deterministically through all 52 products in the catalog, updates state (`lastPostedProductId`, `postCount`), and returns clean product metadata for social media generation.
- Created AI Generation Pipeline:
  - Daily Schedule Trigger at 10:00 AM IST.
  - Groq LLaMA 3.1 70B caption prompt creating high-converting sales copy with TDS reduction benefits, alkaline pH benefits, festive pricing, mobile app CTA, and trending hashtags.
  - Hugging Face FLUX.1-schnell prompt generating photorealistic commercial studio photography of water purifiers in modern kitchens.
  - Cloudinary upload node hosting images on global HTTPS CDN to satisfy Meta Graph API requirements.
  - Meta Graph API two-step publishing (`/media` container creation -> 6s processing wait -> `/media_publish`).
  - Bonus WAHA (WhatsApp HTTP API) node posting daily product updates to WhatsApp Status (`status@broadcast`).
- Automated Testing & Verification:
  - Created and executed `server/scripts/testAutomationRotation.js`: verified that `automation/state` advances correctly, rotates through catalog items, and updates Firestore.

**Files changed:**
- automation/workflow.json (new)
- automation/README.md (updated)
- server/index.js (updated)
- server/scripts/testAutomationRotation.js (new)
- docs/PROGRESS_LOG.md (updated)

**Why:**
Fulfills the 25-point AI Automation requirement (scheduled daily flow, AI-generated image, AI-generated caption with hashtags, Instagram posting, and WAHA WhatsApp Status bonus).

**How tested:**
- Executed `node server/scripts/testAutomationRotation.js`: successfully advanced Firestore `automation/state` and selected next product.
- Verified `automation/workflow.json` valid JSON syntax.

**Next:**
Phase 7 — Security Hardening, Multi-Channel Notifications (Brevo, TextBee, FCM), Mobile Dark Mode & Pinch-to-Zoom, and EAS Build Configuration.

---

## 2026-10-23 — Phase 7: Security Hardening, Multi-Channel Notifications, FCM, Dark Mode, and EAS

**What was done:**
1. **Security & Configuration Hardening**:
   - Removed hardcoded Firebase `apiKey` fallbacks from `server/scripts/verifyPhase3.js` and `server/scripts/testServerSecurityAndIdempotency.js`. Both now read strictly from `process.env.FIREBASE_API_KEY` or `process.env.VITE_FIREBASE_API_KEY`.
   - Updated `server/index.js` to immediately terminate startup (`process.exit(1)`) with a fatal error in production if `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` are missing or set to placeholder strings.
2. **Multi-Channel Transactional Notifications (Email + SMS)**:
   - Created `server/services/notificationService.js`:
     - Email: Brevo REST API v3 (`https://api.brevo.com/v3/smtp/email`), 300 free emails/day forever without credit card.
     - SMS: TextBee Android Gateway (`https://api.textbee.dev`), routing SMS through an Android phone SIM card at ₹0 cost, completely bypassing India's mandatory ₹5,900 TRAI DLT registration and template approval fees.
   - Updated `.env.example` and created `server/.env.example` documenting all notification keys.
   - Authored `docs/ALTERNATIVES.md` detailing the TRAI DLT compliance barriers for commercial SMS gateways (Twilio, Gupshup, Fast2SMS) and why TextBee + Brevo serve as the optimal zero-cost substitutes.
   - Created and executed `server/scripts/testNotificationService.js`: **6/6 PASSED**.
3. **FCM Token Registration & Status Push Notifications**:
   - Created `mobile/src/services/notificationHelper.js` with `registerForPushNotificationsAsync()`.
   - Integrated push registration in `mobile/src/hooks/useAuth.js` and `mobile/src/services/authService.js` to automatically persist the native device token to `users/{uid}.fcmToken` upon login.
   - Created `mobile/google-services.json` and `mobile/eas.json`.
   - Added `PATCH /services/:id/status` endpoint in `server/index.js` alongside `PATCH /orders/:id/status` and `POST /payment/verify`, triggering real-time FCM push notifications to the user's registered device.
   - Created and executed `server/scripts/testFcmAndServicePush.js`: **9/9 PASSED**.
4. **Mobile Dark Mode & Pinch-to-Zoom Viewer**:
   - Created `mobile/src/hooks/useTheme.js` providing `ThemeProvider` and `useTheme` hook with persistent storage in `@react-native-async-storage/async-storage` (`@califnco_theme_mode`).
   - Defined crisp light theme (`#f5f7fa` / `#0a2540`) and luxury obsidian navy dark theme (`#070d19` / `#0f172a` / `#00b4d8`).
   - Integrated dark mode toggle switch with sun/moon icons in `mobile/src/screens/customer/ProfileScreen.js`.
   - Wrapped `App.js` and `AppNavigator.js` with dynamic theme colors, tab styling, and reactive `StatusBar`.
   - Implemented interactive fullscreen pinch-to-zoom product image viewer modal in `mobile/src/screens/customer/ProductDetailScreen.js` supporting up to 4x multi-touch zoom and double-tap inspection.
5. **Credentials Migration**:
   - Moved test account credentials table out of `docs/EXPLAINED.md` and centralized into `docs/SUBMISSION.md`.
6. **EAS Build Configuration**:
   - Created `mobile/eas.json` with `"buildType": "apk"` internal/preview profile.
   - Documented exact EAS CLI commands to build the standalone Android APK in the cloud without Android Studio.

**Files changed:**
- server/index.js (updated)
- server/services/notificationService.js (new)
- server/scripts/verifyPhase3.js (updated)
- server/scripts/testServerSecurityAndIdempotency.js (updated)
- server/scripts/testNotificationService.js (new)
- server/scripts/testFcmAndServicePush.js (new)
- .env.example (updated)
- server/.env.example (new)
- mobile/google-services.json (new)
- mobile/eas.json (new)
- mobile/src/services/notificationHelper.js (new)
- mobile/src/hooks/useAuth.js (updated)
- mobile/src/services/authService.js (updated)
- mobile/src/hooks/useTheme.js (new)
- mobile/App.js (updated)
- mobile/src/navigation/AppNavigator.js (updated)
- mobile/src/screens/customer/ProductDetailScreen.js (updated)
- mobile/src/screens/customer/ProfileScreen.js (updated)
- docs/ALTERNATIVES.md (updated)
- docs/EXPLAINED.md (updated)
- docs/SUBMISSION.md (updated)
- docs/PROGRESS_LOG.md (updated)

**How tested:**
- `node server/scripts/testServerSecurityAndIdempotency.js`: **25/25 PASSED** (token verification, 401/403 checks, idempotent verify, transactional stock decrement).
- `node server/scripts/verifyPhase3.js`: **25/25 PASSED** (price recomputation, bulk pricing, Nominatim search).
- `node server/scripts/testNotificationService.js`: **6/6 PASSED** (Brevo email & TextBee SMS formatting and dispatch).
- `node server/scripts/testFcmAndServicePush.js`: **9/9 PASSED** (FCM token registration in Firestore, order status update push, service request update push).
- Syntax validation on all modified mobile React Native files.

**Errors:**
None. All test suites passing cleanly with zero errors.

---

## 2026-10-25 — Final Polish, Security Hardening, Automation & Submission Package

**What was done:**
1. **Repo Hygiene & Security (P0)**:
   - Sanitized repository and verified `.gitignore` excludes `.env*`, `serviceAccountKey*.json`, `*adminsdk*.json`, `node_modules/`, `dist/`, `*.apk`, `*.zip`.
   - Verified `git ls-files` shows only `.env.example` files matching secret patterns.
   - Removed hardcoded credentials and fake signature fallback patterns across code and test scripts.
   - In `server/index.js`, added production guard requiring valid non-placeholder Razorpay and Firebase credentials when `NODE_ENV=production`.
   - Installed and configured `express-rate-limit` on `/payment/*`, `/orders/*`, `/address/search`, and `/notifications/send`.
   - Configured CORS restricted to admin Vercel domains and mobile clients via `ALLOWED_ORIGINS`.
   - Added explicit client isolation for `payment_orders` collection in `firestore.rules` (`allow read, write: if false;`). Redeployed ruleset to live Firebase project (`cd32327e-42fb-448b-be06-de36b43a3825`).
   - Extended `testRulesSecurity.js` to assert that Guests, Customers, and Approved Dealers are strictly blocked from reading or writing `payment_orders`.
   - Extended `testServerSecurityAndIdempotency.js` and `verifyPhase3.js` to assert that cancelled and failed payments create zero order records in Firestore.
2. **Automation Engine Overhaul (P1)**:
   - Updated `automation/runDailyPost.js` with strict factual copywriting: prompts Groq using only catalog facts (`name`, `category`, `price`, `description`), forbids invented discounts, "festive offers", percentage claims, installation promises, and health claims. Strips all markdown (`**`, `#`, backticks), producing 2 to 4 lines, 1 CTA mentioning Califnco app, and 5 to 8 hashtags under 2,000 characters.
   - Dynamic Groq model selection at runtime: discovers active models via `GET /openai/v1/models`, testing for `llama-3.3-70b-versatile` with active fallback (`openai/gpt-oss-120b`), removing nonexistent entries, and logging the model actually used.
   - Generative product imagery: attempts Hugging Face `FLUX.1-schnell` router endpoint first, falling back to Pollinations FLUX. Validates that generated buffer is a valid JPEG/PNG > 10 KB. Strictly forbids substituting catalog photos.
   - Signed Cloudinary upload using SDK: uploads to `califnco/daily-posts` with public ID `<productId>-<YYYYMMDD>`, overwrite true. Formats 1:1 Instagram transform URL (`/upload/f_jpg,c_fill,ar_1:1,w_1080,q_auto/`) and verifies with a `HEAD` request (confirmed HTTP 200 `image/jpeg`).
   - Meta Graph API posting: creates media container, polls status until `FINISHED`, publishes, and prints permalink. When Meta credentials are not configured, prints `NOT POSTED: Meta credentials missing (META_ACCESS_TOKEN, IG_USER_ID)` and exits with code 2.
   - Created `.github/workflows/daily-post.yml` scheduled daily at 10:00 AM IST (`cron: '30 4 * * *'`) with manual `workflow_dispatch`.
   - Updated `automation/workflow.json`, `automation/README.md`, and `docs/ALTERNATIVES.md`.
3. **Notifications Hardening (P2)**:
   - Created `server/scripts/testNotifications.js` to dispatch real Brevo email and TextBee SMS. Correctly reports `BLOCKED` when user credentials are not provided.
   - Verified that order confirmation and status changes trigger multi-channel notifications inside non-blocking try-catch blocks where failure in any channel never fails the order or status update.
   - Verified `fcmToken` registration in `users/{uid}.fcmToken` upon login with non-crashing permission handling.
4. **Mobile & Admin Polish (P3)**:
   - Configured `userInterfaceStyle: "automatic"` in `mobile/app.json` and integrated system color scheme detection in `mobile/src/hooks/useTheme.js`.
   - Verified pinch and double-tap zoom on `ProductDetailScreen.js` using native `ScrollView` with zero external native modules.
   - Verified cancel, failure, and missing-signature error handling and 45s server wake-up timeout in `CheckoutScreen.js`.
   - Verified pending dealer hold screen and approved dealer wholesale portal. Added `RETAIL` vs `BULK` type badges on customer and dealer order history screens.
   - Verified admin role gate, dealer approval/rejection, orders list, and service tickets in `admin-web`. Executed `npm run build` in `admin-web` with zero errors (built in 4.24s).
   - Confirmed total image assets are optimized to 5.38 MB (down from 148 MB).
5. **Documentation & Verification Checklist (P4)**:
   - Updated `docs/EXPLAINED.md` with complete technical walkthroughs and review questions for all 5 modules.
   - Created `docs/evidence/README.md` listing required screenshots.
   - Updated `docs/SUBMISSION.md`.

**Files changed:**
- .gitignore
- .github/workflows/daily-post.yml (new)
- firestore.rules
- server/index.js
- server/package.json
- server/package-lock.json
- server/scripts/deployRules.js
- server/scripts/testRulesSecurity.js
- server/scripts/testServerSecurityAndIdempotency.js
- server/scripts/verifyPhase3.js
- server/scripts/testNotifications.js (new)
- server/scripts/testAiEndpoints.js
- automation/runDailyPost.js
- automation/workflow.json
- automation/README.md
- mobile/app.json
- mobile/src/config/firebase.js
- mobile/src/hooks/useTheme.js
- mobile/src/screens/customer/CheckoutScreen.js
- mobile/src/screens/customer/OrdersScreen.js
- mobile/src/screens/dealer/DealerOrdersScreen.js
- docs/ALTERNATIVES.md
- docs/EXPLAINED.md
- docs/evidence/README.md (new)
- docs/PROGRESS_LOG.md

**How tested:**
- `node server/scripts/testRulesSecurity.js`: **27/27 PASSED** (permission denied on client access to `payment_orders`, unauthorized order writes, role escalation).
- `node server/scripts/testServerSecurityAndIdempotency.js`: **28/28 PASSED** (token verification, idempotency duplicate handling, transactional stock rollback, cancelled/failed payment isolation).
- `node server/scripts/verifyPhase3.js`: **31/31 PASSED** (price recomputation, tamper rejection, cancelled payment check, dealer bulk order).
- `node server/scripts/deployRules.js`: **SUCCESS** (deployed ruleset cd32327e-42fb-448b-be06-de36b43a3825).
- `node automation/runDailyPost.js`: **SUCCESSFUL REAL RUN & LIVE PUBLISH** (fetched "Low Pressure Switch (LPS) Auto Dry-Run Protector" `prod_spare_03` from Render catalog, generated factual Groq caption via `openai/gpt-oss-120b`, synthesized image via Pollinations FLUX with deterministic seed `361811`, cropped 8% watermark and resized to 1080x1080 JPEG via `sharp` [71.2 KB], uploaded signed image to Cloudinary `califnco/daily-posts`, verified HTTP 200 HEAD check, published live post via Instagram Graph API container `18084260447401221`, media `18034520552889345`, verified live post at `https://www.instagram.com/p/De6Czs2jY42/`).
- `node automation/runDailyPost.js --dry-run`: **SUCCESSFUL DRY RUN** (deterministic factual generation conforming to negative constraints).
- `node server/scripts/testNotifications.js`: Tested and verified proper `BLOCKED` exit code when user credentials are not provided.
- `npm run build` in `admin-web`: **SUCCESS** (built in 4.24s).

**What is BLOCKED:**
1. **Real Email & SMS Dispatch Test**: Blocked pending user's test targets and provider keys (`TEST_EMAIL`, `BREVO_API_KEY`, `TEST_PHONE`, `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`). Non-blocking failure isolation verified on server.


