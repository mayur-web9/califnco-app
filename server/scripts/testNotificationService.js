// Test script for Notification Service (Brevo Email & TextBee SMS)
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const {
  sendEmail,
  sendSMS,
  notifyOrderConfirmed,
  notifyOrderStatusChanged
} = require("../services/notificationService");

async function runNotificationTests() {
  console.log("==================================================");
  console.log("    NOTIFICATION SERVICE INTEGRATION TEST SUITE   ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Test Order Confirmation Notification Dispatch
  console.log("1. Testing notifyOrderConfirmed...");
  const orderConfirmResult = await notifyOrderConfirmed({
    email: "customer@test.com",
    customerName: "Mayur Test User",
    phone: "+919876543210",
    orderId: "ord_test_confirmed_9988",
    total: 29998,
    items: [
      { productId: "prod_purifier_01", name: "PureFlow UV/UF Water Purifier", qty: 2, price: 14999 }
    ]
  });

  assert(orderConfirmResult.email.success === true, "Order confirmed email dispatched/simulated successfully");
  assert(orderConfirmResult.sms.success === true, "Order confirmed SMS dispatched/simulated successfully");

  // 2. Test Order Status Changed Notification Dispatch
  console.log("\n2. Testing notifyOrderStatusChanged...");
  const statusChangeResult = await notifyOrderStatusChanged({
    email: "customer@test.com",
    customerName: "Mayur Test User",
    phone: "+919876543210",
    orderId: "ord_test_confirmed_9988",
    newStatus: "shipped"
  });

  assert(statusChangeResult.email.success === true, "Order status change email dispatched/simulated successfully");
  assert(statusChangeResult.sms.success === true, "Order status change SMS dispatched/simulated successfully");

  // 3. Test Graceful Validation with Missing Fields
  console.log("\n3. Testing Graceful Validation with missing contact details...");
  const missingEmail = await sendEmail({ to: "", subject: "Test", htmlContent: "<p>Test</p>" });
  assert(missingEmail.success === false && missingEmail.reason === "missing_recipient", "Missing email handled gracefully without throwing");

  const missingPhone = await sendSMS({ phone: "", message: "Test" });
  assert(missingPhone.success === false && missingPhone.reason === "missing_phone", "Missing phone handled gracefully without throwing");

  console.log("\n==================================================");
  console.log(`   NOTIFICATION TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runNotificationTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
