# Explained — How It Works (Plain English)

I wrote this so I can explain every part of this project in a review without stumbling. Each section covers what the feature does, how data flows, which files matter, why I made this design choice, and the questions I expect to be asked.

---

## Module: Mobile App

### What it does
The mobile application is built with Expo React Native (SDK 51). It provides a full-featured customer shopping experience and a dedicated wholesale portal for verified dealers:
1. **Catalog & Search**: Customers can browse water purifiers, dispensers, pumps, filters, and spare parts. Filter by category pill or search via real-time keyword query.
2. **Product Details**: Shows high-resolution product imagery, star ratings, review counts, stock availability indicators, quantity controls, and one-touch "Add to Cart" or "Buy Now".
3. **Cart & Checkout**: Global reactive shopping cart with quantity increment/decrement, line-item totals, and complete delivery address validation (with 6-digit Indian PIN code check).
4. **Order Tracking**: Real-time listing of customer orders with formatted currency (INR), date timestamps, item summaries, and status color badges (`pending`, `confirmed`, `dispatched`, `delivered`, `cancelled`).
5. **Service Booking**: Dual-tab interface allowing customers to request technician home visits (contact phone, address, and issue description) and track the status of past service requests.
6. **Profile Management**: Displays user details, role badge, and allows editing saved delivery address information.
7. **Role-Based Experience**: Dynamically transitions UI depending on whether the user is a Customer, a Pending Dealer (shows approval hold screen), or an Approved Dealer (shows wholesale catalog with minimum order quantities).

### How data flows
1. **Authentication Flow**:
   - `AuthProvider` wraps the root application and listens to Firebase `onAuthStateChanged`.
   - Once Firebase Auth resolves, `getUserProfile(uid)` fetches the user's document from Firestore (`users/{uid}`) to determine their role and `dealerStatus`.
   - `AppNavigator` uses this state to switch between `AuthStack`, `CustomerTabs`, `DealerTabs`, or `PendingApprovalScreen`.
2. **Catalog Flow**:
   - `CatalogScreen` calls `getProducts()` which queries `products` ordered by name.
   - Category filtering and search queries run reactively via `useMemo` for instant client-side responsiveness.
3. **Checkout & Order Flow**:
   - When the user taps checkout, `CheckoutScreen` validates the address and requests a payment order from the backend server (`POST /payment/create-order`).
   - Upon payment confirmation (simulated in test mode or via Razorpay SDK), `createOrder()` writes an order document to Firestore `orders` with `type: "retail"`, `userId: profile.uid`, line items, and timestamp.
   - The cart is emptied, and the user is redirected to the `OrdersScreen`.

### Files that matter
- `mobile/App.js`: Root entry wrapping providers (`SafeAreaProvider`, `AuthProvider`, `CartProvider`, `StatusBar`, `AppNavigator`).
- `mobile/src/navigation/AppNavigator.js`: Role-based tab and stack navigation structure.
- `mobile/src/hooks/useCart.js`: Lightweight React Context for cart management.
- `mobile/src/hooks/useAuth.js`: Context providing current user and Firestore profile state.
- `mobile/src/screens/customer/`: Customer-facing screens (`CatalogScreen`, `ProductDetailScreen`, `CartScreen`, `CheckoutScreen`, `OrdersScreen`, `ServiceBookingScreen`, `ProfileScreen`).
- `mobile/src/screens/dealer/`: B2B wholesale dealer screens (`DealerCatalogScreen`, `DealerOrdersScreen`).
- `mobile/src/screens/shared/PendingApprovalScreen.js`: Screen informing pending dealers of review status.
- `mobile/src/services/`: Direct Firestore client services (`productService`, `orderService`, `serviceBookingService`, `authService`).

### Review Questions & Answers
**Q1: Why did you choose React Context over Redux or Zustand for the cart?**  
*Answer:* The cart state only requires storing a simple array of selected items, quantities, and calculating the sum total. React Context (`useCart`) provides this with zero additional dependencies, clean readable code, and no boilerplate actions or reducers.

**Q2: How does the app prevent unapproved dealers from seeing wholesale prices?**  
*Answer:* There is a two-layer defense:
1. **UI Layer**: `AppNavigator` checks `profile.role === "Dealer" && profile.dealerStatus === "approved"`. If `dealerStatus` is `"pending"`, the user is locked to `PendingApprovalScreen`.
2. **Database Layer (Firestore Rules)**: Even if someone modified the app code, Firestore security rules strictly reject any `wholesale` collection read unless `request.auth` has an approved dealer or admin role in Firestore.

**Q3: How is currency formatting and date formatting handled?**  
*Answer:* Centralized in `mobile/src/utils/formatPrice.js` using `toLocaleString('en-IN')` to display standard Indian Rupee notation (`Rs. 14,999`) and readable date strings (`23 Oct 2026, 01:15 pm`).

---

## Module: Admin Web

_To be written after Phase 5._

---

## Module: Server

_To be written after Phase 3._

---

## Module: Automation (n8n)

_To be written after Phase 6._

---

## Firestore Rules

### What it does
Firestore security rules run directly on Google Cloud servers before any database read or write is permitted. Even if someone intercepts my app or uses the Firebase SDK directly with my API key, they cannot read or write data they do not own.

### How data flows
1. When a client requests `products/{id}`, Firestore checks the `allow read: if true;` rule and immediately returns the public product.
2. When a client requests `wholesale/{id}`, Firestore executes the helper functions `isSignedIn()` and `getUser()`. It looks up `users/$(request.auth.uid)` to verify that `role == "Dealer"` AND `dealerStatus == "approved"` (or `role == "Admin"`). If a regular Customer tries to fetch it, Firestore rejects the request with `PERMISSION_DENIED`.
3. When a user creates an order in `orders/{orderId}`, the rule requires `request.resource.data.userId == request.auth.uid`. A customer cannot spoof an order for someone else.
4. Only an Admin can update order or service statuses.

### Files that matter
- `firestore.rules`: Contains the entire rule definitions and helper functions.
- `docs/DECISIONS.md`: The documented rationale behind each rule choice.

### Why this design was chosen
- **Wholesale in a separate collection (`wholesale/{productId}`) rather than a field in `products/{productId}`**: Firestore rules are document-level, not field-level for reads. You cannot hide a single field of a document from certain users while returning the rest of the document. Having a separate `wholesale` collection allows clean, atomic read access control.
- **Server bypass**: The backend Express service uses the Firebase Admin SDK (`serviceAccountKey.json`), which bypasses Firestore security rules entirely. This means our seed scripts and payment verification webhooks can write data without needing user session tokens.

### Review Questions & Answers
**Q1: Why didn't you just keep wholesalePrice inside the product document?**  
*Answer:* In Firestore, read security rules operate on the entire document. If `wholesalePrice` were inside `products/{id}`, every public user fetching the product catalog would receive the wholesale price in the JSON response unless I used backend proxy endpoints. Splitting wholesale into `wholesale/{productId}` lets public users read `products` while strictly guarding `wholesale` with Firestore rules.

**Q2: What prevents a user from making themselves an Admin or approving their own Dealer status?**  
*Answer:* The rule on `users/{uid}` explicitly forbids modifying `role` or `dealerStatus` during user updates:  
`!("role" in request.resource.data.diff(resource.data).affectedKeys())`. Only a user with `getUser().role == "Admin"` is granted write access to those keys.

**Q3: Does the seed script fail if Firestore rules are in Production mode?**  
*Answer:* No. The seed script uses `firebase-admin` with a service account key, which operates as an administrative superuser on Google Cloud and bypasses client security rules.

---

## Auth and Roles

### What it does
Manages authentication for three distinct roles: `Customer`, `Dealer`, and `Admin`. Each user's identity is authenticated by Firebase Auth (email & password or OAuth), and their application profile and authorization level are tracked in Firestore at `users/{uid}`.

### How data flows
1. On user registration, Firebase Auth issues a unique `uid`.
2. A corresponding document `users/{uid}` is created containing `{ role, dealerStatus, name, phone, address }`.
3. If the user registers as a `Customer`, `dealerStatus` is `null`.
4. If the user registers as a `Dealer`, `dealerStatus` defaults to `"pending"`.
5. When the user logs in, the app reads `users/{uid}`. If `role === "Dealer"` and `dealerStatus === "pending"`, the app routes them to the `PendingApprovalScreen`. Once approved by an Admin, their status becomes `"approved"` and they can access the wholesale pricing screens.

### Files that matter
- `server/scripts/seed.js`: Contains seed accounts and automated user provisioning.
- `mobile/src/config/firebase.js`: Client-side Firebase instance for the mobile app.
- `admin-web/src/config/firebase.js`: Client-side Firebase instance for the admin panel.

### Review Questions & Answers
**Q1: Where are the user roles stored?**  
*Answer:* Primarily in Firestore at `users/{uid}` for simple real-time querying by both the client and admin panel, and mirrored in Firebase Auth Custom Claims during admin actions to provide instant rule evaluation without extra document reads.

**Q2: Where are the credentials for the test accounts located?**  
*Answer:*
All test credentials (Admin, Approved Dealer, Pending Dealer, Customer) along with test payment details are centralized in [docs/SUBMISSION.md](file:///c:/Users/MAYUR/OneDrive/Desktop/Assignment/docs/SUBMISSION.md) to keep architectural explanations clean and secure.

---

## Dealer Approval Flow & Wholesale Pricing

### What it does
Provides a dual-tier pricing and onboarding flow:
1. Public customers see standard retail MSRP prices.
2. Dealers apply for an account with business credentials. Their application enters a `"pending"` state.
3. While pending, dealers cannot access wholesale pricing. They see an informative `PendingApprovalScreen`.
4. Once an administrator clicks "Approve" in the Admin Web Portal, the user's `dealerStatus` in Firestore `users/{uid}` becomes `"approved"`.
5. The dealer immediately gains access to the B2B Wholesale Catalog with wholesale discount pricing and minimum order quantities (`minQty`).

### How data flows
1. Public catalog is read from `products/{productId}` (open read to all users).
2. Wholesale pricing is stored in a separate collection `wholesale/{productId}` with rule:
   ```
   allow read: if isApprovedDealer() || isAdmin();
   ```
3. When placing bulk orders, the dealer submits their order via `POST /orders/bulk` on the backend server.
4. The server:
   - Verifies the user is an approved dealer in `users/{userId}`.
   - For each item, verifies that requested quantity is greater than or equal to `minQty`.
   - Recomputes the total cost strictly using the prices in `wholesale/{productId}`.
   - Creates the order with `type: "bulk"` in `orders` collection via Admin SDK.

### Review Questions & Answers
**Q1: How do you prevent a regular customer from seeing wholesale prices?**  
*Answer:* Wholesale prices are stored in a dedicated `wholesale` collection in Firestore. Security rules enforce `isApprovedDealer() || isAdmin()`, which checks that `request.auth` has a corresponding `users/{uid}` record with `role == "Dealer"` and `dealerStatus == "approved"`. A customer's query to `wholesale` is rejected by Firestore Cloud at the rule level.

**Q2: Can a pending dealer place a bulk order?**  
*Answer:* No. The client UI restricts pending dealers to `PendingApprovalScreen`. Even if an attacker bypasses the mobile UI, the backend endpoint `POST /orders/bulk` independently queries Firestore for the dealer's profile and returns HTTP 403 if `dealerStatus !== "approved"`.

---

## Payments (Razorpay Integration & Security)

### What it does
Implements a secure, end-to-end Razorpay test payment flow for retail orders:
1. Client sends cart items to `POST /payment/create-order`.
2. Server recomputes total from `products/` (never trusting client totals) and creates an official Razorpay order.
3. Mobile app renders the Razorpay Standard Checkout in a dedicated `react-native-webview`.
4. Upon successful payment, Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
5. Client sends these parameters to `POST /payment/verify`.
6. Server calculates `crypto.createHmac("sha256", secret).update(order_id + "|" + payment_id).digest("hex")` and compares it using `crypto.timingSafeEqual`.
7. Once verified, the server creates the order in Firestore with `status: "confirmed"`, `type: "retail"`, and decrements inventory.

### Review Questions & Answers
**Q1: Why can't the client write directly to the `orders` collection in Firestore?**  
*Answer:* In earlier iterations, client direct creates were allowed, which meant a compromised client could write unpaid orders or tamper with totals. Under Phase 3 rules, `match /orders/{orderId} { allow create: if false; }`. All orders must be created by the backend Express server using the Firebase Admin SDK after cryptographic payment signature verification.

**Q2: What is the timing attack protection in payment verification?**  
*Answer:* Instead of using standard string equality (`computedSignature === receivedSignature`), we use `crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(received))`. This prevents side-channel timing attacks that could deduce valid signatures character-by-character.

---

## Executive Admin Web Portal (React + Vite + Vercel)

### What it does
Provides executive administrators with an overview and management tools for the business:
- **Command Center Dashboard**: Live revenue analytics, order counts, pending dealer counts, and recent transactions.
- **Order Operations**: Filter by Retail vs Bulk wholesale, search by order ID or customer, and update fulfillment statuses (`confirmed` -> `dispatched` -> `delivered`).
- **Dealer Pipeline**: One-click review, approval, or rejection of B2B dealer registrations.
- **Service Desk**: View customer maintenance requests, assign technicians, and record resolution notes.
- **Warehouse Inventory**: Real-time stock levels with one-click adjustments (`+1`, `-1`, `+10`), low-stock indicators, and an "Add New Product" modal.

### Architecture & Deployment
- Built with **React 18** and **Vite 5**.
- Uses real-time Firestore `onSnapshot` listeners so multiple administrators see instant updates without manual page refreshes.
- Configured with `vercel.json` rewrite rules (`{ "source": "/(.*)", "destination": "/index.html" }`) to support client-side single page app (SPA) routing on Vercel without 404 errors.

---

## Automated Social Media Marketing (n8n + AI + Instagram)

### What it does
Runs an automated scheduled workflow every morning at 10:00 AM IST to post the daily featured product to Instagram and WhatsApp:
1. **Catalog Rotation**: Calls `GET /automation/next-product`, which reads `automation/state` in Firestore, advances to the next catalog item, and returns clean product metadata.
2. **AI Caption**: Generates marketing copy with TDS benefits, festive pricing, and hashtags via Groq LLaMA 3.1.
3. **AI Image**: Generates luxury studio photography via Hugging Face FLUX.1-schnell (with graceful fallback to high-res catalog photos).
4. **CDN Hosting**: Uploads the media to Cloudinary to provide a public HTTPS URL required by Meta's crawler.
5. **Meta Graph API**: Publishes the post directly to Instagram Business account via container creation and media publish.
6. **WhatsApp Status**: Broadcasts the product update to `status@broadcast` via headless WAHA Docker container.

### Review Questions & Answers
**Q1: Why is an n8n workflow export provided instead of just a script?**  
*Answer:* The assignment explicitly specifies an n8n workflow (`automation/workflow.json`). n8n provides visual execution monitoring, individual node state inspection, automatic retry logic, and zero-code credential management.

**Q2: What happens if Hugging Face or Groq has an API rate limit or outage?**  
*Answer:* The workflow includes a fallback node (`Format Caption & Fallbacks`). If the generative image API fails, it automatically falls back to the high-resolution product photography seeded in Firestore. If the LLM caption fails, it falls back to a curated high-converting promotional template.

---

## Address Lookup & Nominatim Integration

### What it does
Provides fast locality and pincode autofill for Indian delivery addresses without incurring Google Maps API fees.
- Utilizes OpenStreetMap's Nominatim search API.
- Implements a proxy endpoint on the backend: `GET /address/search?q=...`
- Sends a compliant `User-Agent` header (`Califnco-WaterPurifier-App/1.0`).
- Triggered strictly on explicit user button tap ("Lookup Location") rather than continuous autocomplete keystrokes, adhering strictly to OSM Nominatim Acceptable Use Policy.

---

## Multi-Channel Notifications (Email, SMS, FCM)

### What it does
Provides unified multi-channel transactional notifications across Email, SMS, and Native Push:
1. **Order Confirmation**: Dispatched automatically when `/payment/verify` completes payment verification and records the order.
2. **Order Status Updates**: Dispatched via `PATCH /orders/:id/status` (e.g. `shipped`, `out_for_delivery`, `delivered`).
3. **Service Request Updates**: Dispatched via `PATCH /services/:id/status` when technicians are assigned or tickets updated.

### Delivery Channels & Zero-Cost Architecture
- **Transactional Email**: Uses **Brevo REST API v3** (`https://api.brevo.com/v3/smtp/email`), providing 300 free emails per day without credit card requirements or mandatory custom domain DNS lock-in.
- **Transactional SMS**: Integrated with **TextBee Free Android Gateway** (`https://textbee.dev`), routing through an Android phone's carrier SIM card. This bypasses India's mandatory ₹5,900 TRAI DLT registration and template approval fees while delivering real SMS to customer phones.
- **Native Device Push (FCM)**: Native push tokens are automatically registered upon user login via `expo-notifications` and saved to `users/{uid}.fcmToken`. The backend dispatches notifications directly via Firebase Admin Messaging SDK (`admin.messaging().send`).

---

## Mobile Dark Mode & Pinch-to-Zoom

### What it does
1. **Persistent Dark Mode**:
   - Implemented via `useTheme` hook (`mobile/src/hooks/useTheme.js`) with React Context and `AsyncStorage` (`@califnco_theme_mode`).
   - Seamlessly switches between a crisp daylight theme (`#f5f7fa` / `#0a2540`) and a luxury obsidian navy dark theme (`#070d19` / `#0f172a` / `#00b4d8`).
   - Dynamic `StatusBar` style adaptation (`light` vs `dark`).
   - Interactive toggle switch integrated in `ProfileScreen.js` with instant reactive re-rendering across tab bars, headers, and cards.
2. **Pinch-to-Zoom Product Image Viewer**:
   - Embedded in `ProductDetailScreen.js` with an interactive "Tap to Zoom" indicator badge.
   - Opens a fullscreen modal with dark blurred backdrop.
   - Built with native `ScrollView` utilizing `maximumZoomScale={4}`, `minimumZoomScale={1}`, `centerContent={true}`, and smooth pinch gesture handling.

---

## EAS Development APK Build (Without Android Studio)

### How it works
Expo Application Services (EAS) builds the standalone Android `.apk` package entirely in the cloud, eliminating the need to install Android Studio, Java JDK, or the Android SDK/NDK on your local computer.

1. **Prerequisites**:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. **Configure project**:
   Ensure `mobile/app.json` contains `"package": "com.califnco.app"` and `mobile/google-services.json` is present.
3. **Run Cloud Build**:
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
   *Note: Using `--profile preview` produces a direct installable `.apk` file (rather than an `.aab` Google Play store bundle) that can be installed on any physical Android phone or emulator.*


