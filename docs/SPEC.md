# Califnco — Round 1 Technical Assignment Specification

**Deadline:** 25 October 2026, 11:59 PM IST
**Candidate:** MERN Developer
**Evaluator:** Al Amin, Califnco

---

## Overview

Build an e-commerce Water Purifier app with three roles, a live admin panel, and a daily AI-automated Instagram post. The app must use only free-tier tools (Rs 0 cost). AI coding tools are allowed; the candidate must be able to explain and defend the code in a review.

---

## 1. Roles

| Role | Description |
|------|-------------|
| Customer | Default role on registration. Can browse products, checkout with Razorpay, book services, view order history, receive push notifications. |
| Dealer | Registers as Dealer. Starts in pending state. After admin approval, sees wholesale prices and can place bulk orders. |
| Admin | Pre-seeded. Manages orders, approves/rejects dealers, handles service desk. Lives in admin-web panel on Vercel. |

Role and dealer status are stored in Firestore on users/{uid}:
- role: "Customer" | "Dealer" | "Admin"
- dealerStatus: "pending" | "approved" | "rejected" (only relevant when role is Dealer)

---

## 2. Features by Role

### Customer
- Catalog: 50+ products (purifiers, dispensers, pumps, filters, spares)
- Search by name, filter by category
- Product detail page
- Cart and checkout (Razorpay test mode)
- Order history
- Service booking (submit request, view status)
- Profile page
- Push notifications (FCM) for order and service status changes

### Dealer
- Separate login using role: "Dealer"
- Same catalog but with wholesale prices (from wholesale/{productId} collection)
- Bulk order placement and order history
- Push notifications

### Admin (admin-web on Vercel)
- View all orders, update order status
- View all service bookings, update status
- Approve or reject pending dealers
- Simple stats: total orders, revenue, pending dealers, pending services

---

## 3. Tech Stack

| Layer | Tool | Reason |
|-------|------|--------|
| Mobile | Expo React Native (Android) | Cross-platform, free, familiar |
| Auth | Firebase Auth | Free Spark plan, handles email/password |
| Database | Firestore | Free Spark plan, real-time, offline support |
| Push notifications | Firebase FCM | Free, integrates with Firestore |
| Product images | Cloudinary or ImgBB | Firebase Storage is NOT free |
| Payments | Razorpay Test Mode (rzp_test_ keys) | Zero KYC, zero cost |
| Location / Address | OpenStreetMap via Geoapify or Nominatim | Google Maps requires credit card |
| Email | EmailJS or SMTP service | Free tier |
| SMS | TextBee | Free tier |
| Admin panel | React + Vite, deployed on Vercel | Free, fast |
| Backend server | Express.js | Creates Razorpay orders, verifies signatures, sends FCM, sends email/SMS |
| AI Automation | n8n (self-hosted) | Free, schedule trigger, workflow JSON exportable |
| Caption generation | Groq API or Gemini API | Free tiers |
| Image generation | Hugging Face Inference API | Free tier |
| Instagram posting | Meta Graph API | Requires a connected Business account |
| WhatsApp Status (bonus) | WAHA (open-source, Docker) | Free, local |

---

## 4. Scoring Table (100 pts + 15 bonus)

### Mobile App (75 pts)

| Criteria | Points |
|----------|--------|
| Core app functionality (Customer, Dealer, Admin working) | 30 |
| UI polish and realistic, relevant product imagery | 15 |
| Code structure, cleanliness and architecture | 10 |
| Firebase integration (Auth, Firestore, FCM alerts) | 8 |
| Razorpay checkout flow (test mode) | 5 |
| Maps / Address integration (free alternative) | 4 |
| Email and SMS notifications working | 3 |

### AI Automation (25 pts)

| Criteria | Points |
|----------|--------|
| Scheduled daily workflow (runs without manual input) | 10 |
| AI-generated product image in post | 8 |
| AI-generated caption with hashtags | 7 |

### Bonus (15 pts)

| Criteria | Points |
|----------|--------|
| WhatsApp Status automation via WAHA | +10 |
| In-app extras: animations, zoom, dark mode, referral | +5 |

---

## 5. Bonus Items (implement only after all core features work)

1. Dark mode — in-app toggle, persisted to AsyncStorage
2. Image zoom / lightbox — on product detail
3. Simple animations — screen transitions, cart add feedback
4. WhatsApp Status via WAHA — post daily product image as WhatsApp Status using a secondary number
5. Referral system — skip unless there is leftover time

---

## 6. Automation Workflow (Mandatory)

Daily automated flow (n8n with schedule trigger):
1. Schedule trigger fires once a day
2. Pick the next product from Firestore (rotate through catalog)
3. Send product name + description to Groq/Gemini API to get AI-generated caption with hashtags
4. Send product name to Hugging Face Inference API to get AI-generated image
5. Upload image to Cloudinary
6. Post image + caption to Instagram via Meta Graph API
7. (Bonus) Also post to WhatsApp Status via WAHA

Export: automation/workflow.json (n8n export), automation/README.md (setup steps)

---

## 7. Submission Rules

- Submit via the official Round 1 Submission Form (linked in invitation email)
- All Google Drive links must be set to "Anyone with the link can view" — locked links will be skipped
- Quality over quantity: a few polished, working flows beat many broken ones
- AI coding tools are allowed; the candidate must understand and be able to defend the code

---

## 8. Constraints

- No Firebase Cloud Functions (requires paid Blaze plan)
- No Google Maps (requires credit card)
- No Firebase Storage (requires paid plan)
- No real payment keys — test mode only
- No secrets committed to git — use .env files and .gitignore

---

## 9. Phases

| Phase | Scope |
|-------|-------|
| 0 | Monorepo structure, docs, git init, Firestore schema |
| 1 | Firebase setup, auth with roles, Firestore rules, seed catalog |
| 2 | Customer flows: browse, cart, checkout, orders, service booking, profile |
| 3 | Razorpay via server, FCM, address search |
| 4 | Dealer flow and approval |
| 5 | Admin web on Vercel |
| 6 | Email, SMS, n8n automation, Instagram posting |
| 7 | Bonus items, APK build, SUBMISSION.md |
