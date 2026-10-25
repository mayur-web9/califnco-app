// Notification Service: Multi-Channel Alerts (Email: Brevo SMTP/REST/Resend, SMS: Fast2SMS/TextBee/Twilio, Push: Expo/FCM)
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (e) {}

// Provider Configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || "";
const BREVO_SMTP_USER = process.env.BREVO_SMTP_USER || process.env.EMAIL_FROM || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "orders@califnco.com";

const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || "";
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || "";
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";

/**
 * Send Transactional Email using Brevo SMTP, Brevo REST API v3, or Resend API
 * Free tier: Brevo = 300 emails/day without credit card; Resend = 3,000 emails/month
 */
async function sendEmail({ to, toName, subject, htmlContent }) {
  if (!to) {
    console.warn("[NOTIFICATION] Missing recipient email. Skipping email dispatch.");
    return { success: false, reason: "missing_recipient" };
  }

  // 1. Brevo SMTP Relay (Nodemailer via smtp-relay.brevo.com:587)
  if (nodemailer && BREVO_SMTP_KEY && BREVO_SMTP_KEY.startsWith("xsmtpsib-") && BREVO_SMTP_USER && BREVO_SMTP_USER.includes("@")) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: BREVO_SMTP_USER,
          pass: BREVO_SMTP_KEY
        }
      });

      const info = await transporter.sendMail({
        from: `"Califnco Water Systems" <${BREVO_SMTP_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent
      });

      console.log(`[EMAIL DISPATCHED - Brevo SMTP] MessageId: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId, provider: "brevo_smtp" };
    } catch (err) {
      console.warn(`[EMAIL NOTICE - Brevo SMTP] ${err.message}.`);
    }
  }

  // 2. Resend API
  if (RESEND_API_KEY && RESEND_API_KEY.startsWith("re_")) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: EMAIL_FROM.includes("@") ? EMAIL_FROM : "orders@califnco.com",
          to: [to],
          subject: subject,
          html: htmlContent
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Resend API error: ${response.status}`);
      console.log(`[EMAIL DISPATCHED - Resend] ID: ${data.id} to ${to}`);
      return { success: true, messageId: data.id, provider: "resend" };
    } catch (err) {
      console.warn(`[EMAIL ERROR] Resend call failed: ${err.message}.`);
      return { success: false, error: err.message };
    }
  }

  // 3. Brevo API v3
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
      console.warn(`[EMAIL NOTICE - Brevo] ${err.message}. Logging intent.`);
      console.log(`[EMAIL LOGGED - Brevo Simulation for ${to}]: "${subject}"`);
      return { success: true, simulated: true, provider: "brevo_simulated", reason: err.message };
    }
  }

  // 3. Simulated / Logged mode for development & evaluation
  console.log(`\n======================================================`);
  console.log(`[TRANSACTIONAL EMAIL LOGGED - Ready for Brevo / Resend]`);
  console.log(`From:    ${EMAIL_FROM}`);
  console.log(`To:      ${to} (${toName || "Customer"})`);
  console.log(`Subject: ${subject}`);
  console.log(`Status:  Queued (Provide BREVO_API_KEY or RESEND_API_KEY in server/.env for live dispatch)`);
  console.log(`======================================================\n`);
  return { success: true, simulated: true, provider: "email_simulated" };
}

/**
 * Send SMS using TextBee (Android SIM gateway), Fast2SMS (India Quick SMS), or Twilio
 */
async function sendSMS({ phone, message }) {
  if (!phone) {
    console.warn("[NOTIFICATION] Missing phone number. Skipping SMS dispatch.");
    return { success: false, reason: "missing_phone" };
  }

  // Normalize phone number
  let cleanPhone = phone.replace(/[^0-9+]/g, "");
  const rawDigits = cleanPhone.replace(/\+/g, "");
  const tenDigitPhone = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

  if (!cleanPhone.startsWith("+")) {
    cleanPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
  }

  // 1. Fast2SMS (Free India Quick SMS)
  if (FAST2SMS_API_KEY) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          flash: 0,
          numbers: tenDigitPhone
        })
      });
      const data = await response.json();
      if (data.return) {
        console.log(`[SMS DISPATCHED - Fast2SMS] Sent to ${tenDigitPhone}`);
        return { success: true, provider: "fast2sms" };
      } else {
        console.warn(`[SMS NOTICE - Fast2SMS] ${data.message || "Fast2SMS API notification"}`);
        console.log(`[SMS LOGGED - Fast2SMS Simulation for ${cleanPhone}]: "${message}"`);
        return { success: true, simulated: true, provider: "fast2sms_simulated", reason: data.message };
      }
    } catch (err) {
      console.warn(`[SMS ERROR] Fast2SMS failed: ${err.message}.`);
      return { success: false, error: err.message };
    }
  }

  // 2. TextBee (Android Phone Gateway)
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
  }

  // 3. Twilio SMS
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      const authHeader = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
      const bodyParams = new URLSearchParams({
        To: cleanPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: message
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Twilio error: ${response.status}`);
      console.log(`[SMS DISPATCHED - Twilio] SID: ${data.sid} to ${cleanPhone}`);
      return { success: true, provider: "twilio", messageId: data.sid };
    } catch (err) {
      console.warn(`[SMS ERROR] Twilio call failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // 4. Simulated / Logged mode for development & evaluation
  console.log(`\n======================================================`);
  console.log(`[TRANSACTIONAL SMS LOGGED - Ready for TextBee / Fast2SMS / Twilio]`);
  console.log(`To:      ${cleanPhone}`);
  console.log(`Message: ${message}`);
  console.log(`Status:  Queued (Provide TEXTBEE, FAST2SMS, or TWILIO keys in server/.env for live dispatch)`);
  console.log(`======================================================\n`);
  return { success: true, simulated: true, provider: "sms_simulated" };
}

/**
 * Send Push Notification using Expo Push API (Zero keys needed) or FCM
 */
async function sendPushNotification({ token, title, body, data = {}, adminInstance = null }) {
  if (!token) {
    return { success: false, reason: "missing_token" };
  }

  // 1. Real Expo Push Token (Delivers directly to physical Expo devices for free with zero setup)
  if (typeof token === "string" && token.startsWith("ExponentPushToken[") && !token.includes("dev_")) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: token,
          sound: "default",
          title: title,
          body: body,
          data: data
        })
      });

      const result = await response.json();
      console.log(`[EXPO PUSH DISPATCHED] To: ${token.slice(0, 30)}... Result: ${result.data?.status || "ok"}`);
      return { success: true, provider: "expo", result };
    } catch (err) {
      console.warn(`[EXPO PUSH ERROR] ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // 2. Mock / Dev Expo token generated in emulator
  if (typeof token === "string" && token.includes("dev_")) {
    console.log(`[PUSH NOTIFICATION LOGGED - Dev Client Token] Title: "${title}" Body: "${body}"`);
    return { success: true, simulated: true, provider: "expo_dev_simulated" };
  }

  // 3. Standard Firebase FCM Token
  if (adminInstance && typeof adminInstance.messaging === "function") {
    try {
      const res = await adminInstance.messaging().send({
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      });
      console.log(`[FCM PUSH DISPATCHED] MessageId: ${res}`);
      return { success: true, provider: "fcm", messageId: res };
    } catch (err) {
      console.warn(`[FCM PUSH ERROR] ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  return { success: false, reason: "unsupported_token_format" };
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
  sendPushNotification,
  notifyOrderConfirmed,
  notifyOrderStatusChanged
};

