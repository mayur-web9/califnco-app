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
