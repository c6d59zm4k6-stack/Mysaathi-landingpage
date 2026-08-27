// Confirms a payment actually came from Razorpay, then emails her the
// confirmation.
//
// The browser reports its own success, so that report can't be trusted on its
// own. Razorpay signs `order_id|payment_id` with the key secret; recomputing
// that HMAC here is the only thing that proves the payment is real.

import crypto from "node:crypto";

const TRACK_FACTS = {
  en: {
    cycle: "A long, irregular cycle can still become a healthy one.",
    skin: "PCOS acne often shows on the jaw and chin — it's hormonal, not hygiene.",
    metabolic: "You can have insulin issues at any weight.",
    mood: "Mood swings come from hormones, not a character flaw."
  },
  hi: {
    cycle: "लंबा, अनियमित साइकल भी सेहतमंद बन सकता है।",
    skin: "PCOS का एक्ने अक्सर जॉ और ठुड्डी पर होता है — यह हार्मोनल है, सफ़ाई की कमी नहीं।",
    metabolic: "किसी भी वज़न पर इंसुलिन की दिक़्क़त हो सकती है।",
    mood: "मूड स्विंग्स हार्मोन से आते हैं, स्वभाव की कमी से नहीं।"
  }
};

function verifySignature(orderId, paymentId, signature, keySecret) {
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(String(signature || ""), "utf8");
  return (
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf)
  );
}

// The order's notes (set server-side in create-order.js) are the trusted
// record of who's paying and what she picked in the quiz — safer to read
// back from Razorpay than to trust whatever the client resends here.
async function fetchOrderNotes(orderId, keyId, keySecret) {
  const r = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    }
  });
  if (!r.ok) throw new Error(`Razorpay order lookup failed: ${r.status}`);
  const order = await r.json();
  return order.notes || {};
}

function buildConfirmationEmail(notes) {
  const hi = notes.language === "hi";
  const name = notes.name || (hi ? "साथी" : "there");
  const zoomLink = process.env.WORKSHOP_ZOOM_LINK || "";
  const dateLabel =
    process.env.WORKSHOP_DATE_LABEL || (hi ? "जल्द बताई जाएगी" : "to be announced — watch WhatsApp");
  const fact = TRACK_FACTS[hi ? "hi" : "en"][notes.focus_track_key] || "";

  const zoomLine = zoomLink
    ? hi
      ? `<p><b>Zoom लिंक:</b> <a href="${zoomLink}">${zoomLink}</a></p>`
      : `<p><b>Zoom link:</b> <a href="${zoomLink}">${zoomLink}</a></p>`
    : hi
      ? `<p>Zoom लिंक सेशन से पहले WhatsApp पर भेजा जाएगा।</p>`
      : `<p>The Zoom link will be sent on WhatsApp before the session.</p>`;

  const subject = hi ? "आपकी सीट पक्की है — गर्भ साथी" : "You're in! Your Garbha Saathi seat is confirmed";

  const html = hi
    ? `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#2E2138">
        <h2 style="color:#5B3E6B">नमस्ते ${name}, आपकी सीट बुक हो गई है 🎉</h2>
        <p>लाइव 2-घंटे का PCOS वर्कशॉप — <b>${dateLabel}</b></p>
        ${zoomLine}
        ${fact ? `<p style="background:#FBEEDB;padding:10px 14px;border-radius:10px"><b>आपके लिए एक बात:</b> ${fact}</p>` : ""}
        <p>कोई सवाल हो तो हमें WhatsApp पर लिखें।</p>
        <p style="color:#5B4A66;font-size:12px;margin-top:24px">यह वर्कशॉप शैक्षिक है और किसी भी स्थिति का निदान या इलाज नहीं करता। PCOS की पुष्टि डॉक्टर करते हैं।</p>
      </div>`
    : `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#2E2138">
        <h2 style="color:#5B3E6B">Hi ${name}, your seat is booked 🎉</h2>
        <p>Live 2-hour PCOS workshop — <b>${dateLabel}</b></p>
        ${zoomLine}
        ${fact ? `<p style="background:#FBEEDB;padding:10px 14px;border-radius:10px"><b>One thing for you:</b> ${fact}</p>` : ""}
        <p>Questions before then? Message us on WhatsApp.</p>
        <p style="color:#5B4A66;font-size:12px;margin-top:24px">This workshop is educational and does not diagnose or treat any condition. PCOS is confirmed by a doctor.</p>
      </div>`;

  const text = hi
    ? `नमस्ते ${name}, आपकी सीट बुक हो गई है।\nलाइव 2-घंटे का PCOS वर्कशॉप — ${dateLabel}\n${zoomLink || "Zoom लिंक सेशन से पहले WhatsApp पर भेजा जाएगा।"}\n${fact}`
    : `Hi ${name}, your seat is booked.\nLive 2-hour PCOS workshop — ${dateLabel}\n${zoomLink || "The Zoom link will be sent on WhatsApp before the session."}\n${fact}`;

  return { subject, html, text };
}

// Best-effort: the payment is already verified by the time this runs, so an
// email failure (bad API key, Resend outage) must never turn into "payment
// not confirmed" for someone who was actually charged. Log and move on.
async function sendConfirmationEmail(notes) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set — skipping confirmation email.");
    return;
  }
  if (!notes.email) {
    console.warn("No email on order notes — skipping confirmation email.");
    return;
  }
  const from = process.env.EMAIL_FROM || "Garbha Saathi <onboarding@resend.dev>";
  const { subject, html, text } = buildConfirmationEmail(notes);

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from, to: notes.email, subject, html, text })
    });
    if (!r.ok) {
      console.error("Resend API error:", r.status, await r.text());
    }
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(503).json({ error: "Razorpay is not configured yet." });
  }

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature
  } = req.body || {};

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: "Missing payment details." });
  }

  if (!verifySignature(orderId, paymentId, signature, keySecret)) {
    console.warn("Signature mismatch for order", orderId);
    return res.status(400).json({ verified: false, error: "Payment could not be verified." });
  }

  console.log("Verified payment", paymentId, "for order", orderId);

  // Everything below is "nice to have, already paid" — never let it block or
  // flip the response. If you add WhatsApp sending (needs a Business API
  // provider like Meta Cloud API, Twilio, or Gupshup — none configured yet),
  // it goes here too, same best-effort treatment as the email.
  try {
    const notes = await fetchOrderNotes(orderId, keyId, keySecret);
    await sendConfirmationEmail(notes);
  } catch (error) {
    console.error("Post-payment follow-up failed (payment itself is still valid):", error);
  }

  return res.status(200).json({ verified: true });
}
