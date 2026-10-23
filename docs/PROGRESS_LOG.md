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
