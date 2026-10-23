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

**Q2: What are the credentials for the test accounts?**  
*Answer:*
- Admin: `admin@test.com` / `Admin@123456`
- Approved Dealer: `dealer@test.com` / `Dealer@123456`
- Pending Dealer: `dealer.pending@test.com` / `Dealer@123456`
- Customer: `customer@test.com` / `Customer@123456`

---

## Dealer Approval Flow

_To be written after Phase 4._

---

## Payments (Razorpay)

_To be written after Phase 3._

---

## Notifications (FCM, Email, SMS)

_To be written after Phase 6._
