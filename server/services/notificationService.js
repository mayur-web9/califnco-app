// Notification Service: Handles Email (Brevo REST API / SMTP) and SMS (TextBee)
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "orders@califnco.com";
const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || "";
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || "";

/**
 * Send Transactional Email using Brevo REST API v3
 * Free tier: 300 emails/day without credit card
 */
async function sendEmail({ to, toName, subject, htmlContent }) {
  if (!to) {
    console.warn("[NOTIFICATION] Missing recipient email. Skipping email dispatch.");
    return { success: false, reason: "missing_recipient" };
  }

  if (BREVO_API_KEY && BREVO_API_KEY.startsWith("xkeysib-")) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "Califnco Water Systems", email: EMAIL_FROM },
          to: [{ email: to, name: toName || "Valued Customer" }],
          subject: subject,
          htmlContent: htmlContent
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo API error: ${response.status}`);
      }

      console.log(`[EMAIL DISPATCHED - Brevo] MessageId: ${data.messageId} to ${to}`);
      return { success: true, messageId: data.messageId, provider: "brevo" };
    } catch (err) {
      console.warn(`[EMAIL ERROR] Brevo API call failed: ${err.message}. Logging intent.`);
      return { success: false, error: err.message };
    }
  } else {
    // Simulated / Logged mode for development & evaluation
    console.log(`\n======================================================`);
    console.log(`[TRANSACTIONAL EMAIL LOGGED - Brevo Provider Ready]`);
    console.log(`From:    ${EMAIL_FROM}`);
    console.log(`To:      ${to} (${toName || "Customer"})`);
    console.log(`Subject: ${subject}`);
    console.log(`Status:  Queued (Configure BREVO_API_KEY in .env for live dispatch)`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true, provider: "brevo_simulated" };
  }
}

/**
 * Send SMS using TextBee Free Android Gateway
 * Free tier: 100% free via Android device carrier quota (bypasses TRAI DLT registration)
 */
async function sendSMS({ phone, message }) {
  if (!phone) {
    console.warn("[NOTIFICATION] Missing phone number. Skipping SMS dispatch.");
    return { success: false, reason: "missing_phone" };
  }

  // Normalize phone number (ensure +91 prefix for Indian mobile numbers)
  let cleanPhone = phone.replace(/[^0-9+]/g, "");
  if (!cleanPhone.startsWith("+")) {
    cleanPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
  }

  if (TEXTBEE_API_KEY && TEXTBEE_DEVICE_ID) {
    try {
      const response = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
        method: "POST",
        headers: {
          "x-api-key": TEXTBEE_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          recipients: [cleanPhone],
          message: message
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `TextBee API error: ${response.status}`);
      }

      console.log(`[SMS DISPATCHED - TextBee] SMS sent to ${cleanPhone}`);
      return { success: true, provider: "textbee" };
    } catch (err) {
      console.warn(`[SMS ERROR] TextBee API call failed: ${err.message}. Logging intent.`);
      return { success: false, error: err.message };
    }
  } else {
    // Simulated / Logged mode for development & evaluation
    console.log(`\n======================================================`);
    console.log(`[TRANSACTIONAL SMS LOGGED - TextBee Gateway Ready]`);
    console.log(`To:      ${cleanPhone}`);
    console.log(`Message: ${message}`);
    console.log(`Status:  Queued (Configure TEXTBEE_API_KEY & DEVICE_ID in .env for live dispatch)`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true, provider: "textbee_simulated" };
  }
}

/**
 * Order Confirmation Notification (Email + SMS)
 */
async function notifyOrderConfirmed({ email, customerName, phone, orderId, total, items = [] }) {
  const shortId = orderId ? orderId.slice(-6).toUpperCase() : "ORDER";
  const formattedTotal = Number(total || 0).toLocaleString("en-IN");

  const itemListHtml = items
    .map(i => `<li><strong>${i.name || i.productId}</strong> x ${i.qty} - Rs. ${(Number(i.price) * Number(i.qty)).toLocaleString("en-IN")}</li>`)
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0a2540;">💧 Califnco Water Systems</h2>
      <h3 style="color: #10b981;">Order Confirmed! (#${shortId})</h3>
      <p>Hello <strong>${customerName || "Customer"}</strong>,</p>
      <p>Thank you for choosing Califnco. Your order has been placed successfully and payment of <strong>Rs. ${formattedTotal}</strong> has been received.</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Order Summary:</h4>
        <ul>${itemListHtml}</ul>
        <p style="font-size: 16px; font-weight: bold; margin-bottom: 0;">Total Paid: Rs. ${formattedTotal}</p>
      </div>
      <p>A certified Califnco technician will contact you shortly to schedule installation.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 30px;">Califnco Water Systems Pvt Ltd • Customer Support: 1800-CALIFNCO</p>
    </div>
  `;

  const smsText = `Califnco Alert: Your order #${shortId} of Rs. ${formattedTotal} is confirmed! Our technician will call you shortly for installation. Track live on Califnco App.`;

  const results = await Promise.allSettled([
    sendEmail({
      to: email,
      toName: customerName,
      subject: `Order Confirmed: #${shortId} - Califnco Water Systems`,
      htmlContent: emailHtml
    }),
    sendSMS({
      phone: phone,
      message: smsText
    })
  ]);

  return {
    email: results[0].status === "fulfilled" ? results[0].value : { success: false },
    sms: results[1].status === "fulfilled" ? results[1].value : { success: false }
  };
}

/**
 * Order Status Change Notification (Email + SMS)
 */
async function notifyOrderStatusChanged({ email, customerName, phone, orderId, newStatus }) {
  const shortId = orderId ? orderId.slice(-6).toUpperCase() : "ORDER";
  const statusDisplay = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0a2540;">💧 Califnco Water Systems</h2>
      <h3 style="color: #00b4d8;">Order Status Update: ${statusDisplay}</h3>
      <p>Hello <strong>${customerName || "Customer"}</strong>,</p>
      <p>Your Califnco order <strong>#${shortId}</strong> status has been updated to: <span style="font-weight: bold; color: #0a2540; text-transform: uppercase;">${newStatus}</span>.</p>
      <p>You can track delivery and service schedules anytime directly within the Califnco Mobile App.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 30px;">Califnco Water Systems Pvt Ltd</p>
    </div>
  `;

  const smsText = `Califnco Update: Order #${shortId} status is now '${statusDisplay}'. View details in your Califnco App.`;

  const results = await Promise.allSettled([
    sendEmail({
      to: email,
      toName: customerName,
      subject: `Order #${shortId} Update: ${statusDisplay} - Califnco`,
      htmlContent: emailHtml
    }),
    sendSMS({
      phone: phone,
      message: smsText
    })
  ]);

  return {
    email: results[0].status === "fulfilled" ? results[0].value : { success: false },
    sms: results[1].status === "fulfilled" ? results[1].value : { success: false }
  };
}

module.exports = {
  sendEmail,
  sendSMS,
  notifyOrderConfirmed,
  notifyOrderStatusChanged
};
