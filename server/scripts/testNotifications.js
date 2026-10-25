const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function testNotifications() {
  console.log("=================================================");
  console.log("   CALIFNCO REAL NOTIFICATION DISPATCH TEST");
  console.log("=================================================\n");

  const testEmail = process.env.TEST_EMAIL;
  const testPhone = process.env.TEST_PHONE;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "orders@califnco.com";
  const textbeeApiKey = process.env.TEXTBEE_API_KEY;
  const textbeeDeviceId = process.env.TEXTBEE_DEVICE_ID;

  const missingVars = [];

  if (!testEmail) missingVars.push("TEST_EMAIL");
  if (!brevoApiKey) missingVars.push("BREVO_API_KEY");
  if (!testPhone) missingVars.push("TEST_PHONE");
  if (!textbeeApiKey) missingVars.push("TEXTBEE_API_KEY");
  if (!textbeeDeviceId) missingVars.push("TEXTBEE_DEVICE_ID");

  if (missingVars.length > 0) {
    console.error("BLOCKED: Missing required notification environment variables:");
    missingVars.forEach(v => console.error(`  - ${v}`));
    console.error("\nTo test real notifications, provide the missing variables in server/.env.");
    process.exit(1);
  }

  let emailSuccess = false;
  let smsSuccess = false;

  // 1. Real Brevo Email Dispatch
  console.log(`1. Dispatching real test email to ${testEmail} via Brevo API...`);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Califnco Water Systems", email: emailFrom },
        to: [{ email: testEmail, name: "Califnco Tester" }],
        subject: "Califnco Notification Verification",
        htmlContent: "<p>This is a live transactional email test from Califnco Water Systems.</p>"
      })
    });

    console.log(`Brevo HTTP Response Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok && data.messageId) {
      console.log(`Email dispatched successfully. Message ID: ${data.messageId}`);
      emailSuccess = true;
    } else {
      console.error(`Brevo dispatch rejected: ${data.message || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error(`Brevo connection error: ${err.message}`);
  }

  // 2. Real TextBee SMS Dispatch
  console.log(`\n2. Dispatching real test SMS to ${testPhone} via TextBee Gateway...`);
  try {
    let cleanPhone = testPhone.replace(/[^0-9+]/g, "");
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
    }

    const res = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${textbeeDeviceId}/send-sms`, {
      method: "POST",
      headers: {
        "x-api-key": textbeeApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        recipients: [cleanPhone],
        message: "Califnco Notification Verification: Real SMS dispatch test."
      })
    });

    console.log(`TextBee HTTP Response Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok) {
      console.log(`SMS dispatched successfully via TextBee gateway.`);
      smsSuccess = true;
    } else {
      console.error(`TextBee dispatch rejected: ${data.message || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error(`TextBee connection error: ${err.message}`);
  }

  console.log("\n=================================================");
  if (emailSuccess && smsSuccess) {
    console.log("NOTIFICATIONS VERIFICATION: ALL REAL DISPATCHES SUCCEEDED");
    process.exit(0);
  } else {
    console.error("NOTIFICATIONS VERIFICATION: ONE OR MORE DISPATCHES FAILED");
    process.exit(1);
  }
}

testNotifications().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
