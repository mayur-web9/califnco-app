# Explained — How It Works (Plain English)

I wrote this so I can explain every part of this project in a review without stumbling. Each section covers what the feature does, how data flows, which files matter, why I made this design choice, and the questions I expect to be asked.

---

## Module: Mobile App

_To be written after Phase 2._

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
