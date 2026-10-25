# Verification Evidence & Screenshot Checklist

This directory contains visual and test execution proof for the Califnco multi-platform application.

Please save the following screenshots in this folder to accompany the submission:

| Evidence Item | Filename to Save | Description / What Must Be Visible | Status |
| :--- | :--- | :--- | :--- |
| **Razorpay Test Transaction** | `razorpay_test_transaction.png` | Screenshot of the Razorpay Test Mode modal in the mobile app and the resulting verified Order Confirmation screen with order reference and itemized receipt. | Ready to capture via Expo Go / APK |
| **Firestore Rules Client Test Output** | `rules_test_output.png` | Screenshot of terminal running `node server/scripts/testRulesSecurity.js` showing 27 PASSED, 0 FAILED (permission-denied on unauthorized operations and payment_orders isolation). | Captured in terminal logs |
| **Server Security & Idempotency Output** | `server_test_output.png` | Screenshot of terminal running `node server/scripts/testServerSecurityAndIdempotency.js` showing 28 PASSED, 0 FAILED (idempotency, stock decrement rollback, cancelled payment test). | Captured in terminal logs |
| **GitHub Actions Run** | `github_actions_run.png` | Screenshot of the GitHub Actions web interface under `.github/workflows/daily-post.yml` showing a successful or dispatched run of the daily post automation. | Ready to capture in GitHub Actions |
| **Cloudinary Media Upload** | `cloudinary_upload.png` | Screenshot of the Cloudinary Media Library under `califnco/daily-posts` showing the generated product image and the 1:1 Instagram transformation URL. | Available in Cloudinary dashboard |
| **Instagram Post** | `instagram_post.png` | Screenshot of the live published Instagram post on the connected professional account (`https://www.instagram.com/p/De5_i2yDSfK/`). | LIVE (`https://www.instagram.com/p/De5_i2yDSfK/`) |
| **Live Admin Panel** | `live_admin_panel.png` | Screenshot of the Vercel-deployed executive admin web portal showing orders list with retail/bulk filters, dealer approvals, and service desk tickets. | Accessible on Vercel deployment |

---

## Running Test Verification Scripts

To generate live command line output for screenshots:

```bash
# 1. Firestore Security Rules Test Suite (Client SDK permission verification)
node server/scripts/testRulesSecurity.js

# 2. Server Security, Auth, Idempotency & Transaction Test Suite
node server/scripts/testServerSecurityAndIdempotency.js

# 3. Phase 3 Integration Test Suite
node server/scripts/verifyPhase3.js

# 4. Standalone Daily Automation Pipeline
node automation/runDailyPost.js
```
