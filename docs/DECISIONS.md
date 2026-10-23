# Decisions

This file records architectural decisions: the Firestore schema, security rules, folder layout, and key design choices. It is the source of truth for the project structure.

---

## Firestore Schema

### Collection: users/{uid}

Stores every registered user regardless of role.

```
users/{uid}
  uid: string            // same as Firebase Auth UID
  email: string
  name: string
  phone: string
  role: "Customer" | "Dealer" | "Admin"
  dealerStatus: "pending" | "approved" | "rejected" | null
  address: {
    line1: string
    city: string
    state: string
    pincode: string
  }
  fcmToken: string       // updated on every app open
  createdAt: timestamp
```

dealerStatus is null for Customers and Admins. It is set on registration for Dealers and updated by Admin.

---

### Collection: products/{productId}

Retail catalog. Readable by everyone (even unauthenticated users can browse).

```
products/{productId}
  id: string
  name: string
  description: string
  category: "Purifier" | "Dispenser" | "Pump" | "Filter" | "Spare"
  price: number          // retail price in INR
  imageUrl: string       // hosted on Cloudinary
  stock: number
  rating: number
  reviewCount: number
  createdAt: timestamp
```

---

### Collection: wholesale/{productId}

Same productId as in products collection. Readable only by approved Dealers and Admins.
This is a separate collection so Firestore rules can restrict access cleanly.

```
wholesale/{productId}
  productId: string      // matches products/{productId}
  price: number          // wholesale price in INR (lower than retail)
  minQty: number         // minimum order quantity for wholesale
  updatedAt: timestamp
```

---

### Collection: orders/{orderId}

Both retail (Customer) and bulk (Dealer) orders live here. The type field distinguishes them.

```
orders/{orderId}
  id: string
  userId: string         // uid of the buyer
  type: "retail" | "bulk"
  items: [
    {
      productId: string
      name: string
      imageUrl: string
      price: number      // price at time of order (snapshot)
      qty: number
    }
  ]
  total: number
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  paymentId: string      // Razorpay payment_id after successful payment
  razorpayOrderId: string
  address: {
    line1: string
    city: string
    state: string
    pincode: string
  }
  createdAt: timestamp
  updatedAt: timestamp
```

---

### Collection: services/{serviceId}

Service booking requests submitted by customers.

```
services/{serviceId}
  id: string
  userId: string
  userName: string
  phone: string
  address: string
  issue: string          // free text describing the problem
  status: "pending" | "assigned" | "in-progress" | "resolved"
  notes: string          // admin notes
  createdAt: timestamp
  updatedAt: timestamp
```

---

### Collection: automation/{docId}

Used by the n8n workflow to track which product was posted last (so it rotates).

```
automation/state
  lastPostedProductId: string
  lastPostedAt: timestamp
```

---

## Firestore Security Rules

These rules are the authoritative enforcement layer. UI checks are secondary.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function getUser() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isSignedIn() && getUser().role == "Admin";
    }

    function isApprovedDealer() {
      return isSignedIn()
        && getUser().role == "Dealer"
        && getUser().dealerStatus == "approved";
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    // users collection
    match /users/{uid} {
      // Any signed-in user can read their own doc
      allow read: if isOwner(uid) || isAdmin();

      // A user can create their own doc on registration
      allow create: if isOwner(uid)
        && request.resource.data.role in ["Customer", "Dealer"]
        && (
          request.resource.data.role == "Customer"
          ? request.resource.data.dealerStatus == null
          : request.resource.data.dealerStatus == "pending"
        );

      // User can update their own non-role fields; Admin can update anything
      allow update: if isAdmin()
        || (isOwner(uid)
          && !("role" in request.resource.data.diff(resource.data).affectedKeys())
          && !("dealerStatus" in request.resource.data.diff(resource.data).affectedKeys()));

      allow delete: if false;
    }

    // products collection — public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // wholesale collection — only approved dealers and admins can read
    match /wholesale/{productId} {
      allow read: if isApprovedDealer() || isAdmin();
      allow write: if isAdmin();
    }

    // orders collection
    match /orders/{orderId} {
      // Owner can read their own orders; admin can read all
      allow read: if isOwner(resource.data.userId) || isAdmin();

      // Signed-in user can create an order for themselves
      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid;

      // Only admin can update order status
      allow update: if isAdmin();

      allow delete: if false;
    }

    // services collection
    match /services/{serviceId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if false;
    }

    // automation state — only the server (admin SDK) touches this
    match /automation/{docId} {
      allow read, write: if false; // server uses admin SDK, bypasses rules
    }
  }
}
```

---

## Folder Layout

### /mobile (Expo React Native)

```
mobile/
  app.json
  package.json
  .env.example
  src/
    config/
      firebase.js        // Firebase app init
    navigation/
      AppNavigator.js    // root navigator (auth state decides stack)
      CustomerStack.js
      DealerStack.js
    screens/
      auth/
        LoginScreen.js
        RegisterScreen.js
      customer/
        CatalogScreen.js
        ProductDetailScreen.js
        CartScreen.js
        CheckoutScreen.js
        OrdersScreen.js
        ServiceBookingScreen.js
        ProfileScreen.js
      dealer/
        DealerCatalogScreen.js
        DealerOrdersScreen.js
      shared/
        SplashScreen.js
        PendingApprovalScreen.js
    components/
      ProductCard.js
      CartItem.js
      OrderCard.js
      AddressSearch.js
    hooks/
      useAuth.js
      useCart.js
    services/
      authService.js
      orderService.js
      serviceService.js
      notificationService.js
    utils/
      formatPrice.js
      validateAddress.js
    constants/
      categories.js
      colors.js
```

### /admin-web (React + Vite)

```
admin-web/
  index.html
  package.json
  vite.config.js
  .env.example
  src/
    config/
      firebase.js
    pages/
      LoginPage.jsx
      DashboardPage.jsx
      OrdersPage.jsx
      DealersPage.jsx
      ServicesPage.jsx
    components/
      Sidebar.jsx
      OrderRow.jsx
      DealerRow.jsx
      ServiceRow.jsx
      StatCard.jsx
    hooks/
      useAdmin.js
    services/
      adminService.js
    utils/
      formatDate.js
```

### /server (Express)

```
server/
  package.json
  .env.example
  index.js
  routes/
    payment.js       // POST /payment/create-order, POST /payment/verify
    notify.js        // POST /notify/fcm, POST /notify/email, POST /notify/sms
  middleware/
    verifyFirebaseToken.js
  utils/
    razorpay.js
    fcm.js
    mailer.js
    sms.js
```

### /automation (n8n)

```
automation/
  workflow.json      // n8n workflow export
  README.md          // step-by-step setup instructions
```

### /docs

```
docs/
  SPEC.md
  DECISIONS.md
  PROGRESS_LOG.md
  EXPLAINED.md
  ALTERNATIVES.md
  SUBMISSION.md
```

---

## Key Design Decisions

### Why separate wholesale collection instead of a field on products?
Firestore security rules work at the document level. If wholesale price was a field inside products, there is no clean way to hide it from Customers while keeping the rest of the product doc public. A separate collection lets me write a single rule: only approved Dealers and Admins can read wholesale/*.

### Why Express server instead of Firebase Cloud Functions?
Firebase Cloud Functions require the Blaze (pay-as-you-go) plan. The brief explicitly flags this. Express runs free on any Node host (Render, Railway, or even localhost for demo) with no billing setup.

### Why store price snapshot in order items?
Product prices can change. The order must record what the customer actually paid. Storing a snapshot in the order document prevents price drift from affecting history.

### Why Geoapify/Nominatim instead of Google Maps?
Google Maps requires a credit card. Geoapify has a free tier of 3,000 requests/day. Nominatim is completely free but rate-limited to 1 request/second. Either works for an address search field in checkout.

### Why Cloudinary for images instead of ImgBB?
Cloudinary offers a free plan with transformations (resize, format conversion). This means I can store one high-res image and serve optimised thumbnails via URL parameters. ImgBB is simpler but lacks transformations.

### FCM token strategy
The FCM token is stored on the user doc in Firestore. Every time the app opens, the token is refreshed. The server reads this token when it needs to send a push notification. This avoids a separate tokens collection.
