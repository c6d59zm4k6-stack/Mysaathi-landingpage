// Server-to-server backstop for the confirmation email.
//
// The checkout flow (create-order.js -> Razorpay Checkout -> verify-payment.js)
// only completes if her browser tab stays open long enough to report back.
// If she pays and closes the tab immediately after, Razorpay still has her
// money but our site never hears about it — verify-payment.js simply never
// runs. Razorpay calls this endpoint directly from their servers the moment
// a payment captures, independent of what her browser does, so this is what
// actually guarantees she gets the confirmation email.
//
// Setup: Razorpay dashboard -> Settings -> Webhooks -> Add New Webhook
//   URL: https://<your-domain>/api/razorpay-webhook
//   Active events: payment.captured
//   Secret: generate one, put it in RAZORPAY_WEBHOOK_SECRET below.
// (This secret is separate from RAZORPAY_KEY_SECRET — don't reuse it.)

import crypto from "node:crypto";
import { fetchOrderNotes, sendConfirmationEmail } from "./_lib/confirmation.js";

// Razorpay signs the exact raw request bytes. Vercel's usual req.body is
// already-parsed JSON, which can reformat/reorder things just enough that
// re-serializing it wouldn't match that signature — so parsing has to be
// switched off here and the raw stream read by hand.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function verifyWebhookSignature(rawBody, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(String(signature || ""), "utf8");
  return (
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf)
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !keyId || !keySecret) {
    return res.status(503).json({ error: "Razorpay webhook is not configured yet." });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-razorpay-signature"];

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn("Webhook signature mismatch — rejecting.");
    return res.status(400).json({ error: "Invalid signature." });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid payload." });
  }

  // Acknowledge every other event with 2xx so Razorpay doesn't keep retrying
  // things we don't act on — only a captured payment sends the email. (No
  // dedup against verify-payment.js's own success path needed: that path
  // doesn't send email at all, precisely so this is the one place that does.)
  const payment = event?.payload?.payment?.entity;
  if (event.event !== "payment.captured" || !payment?.order_id) {
    return res.status(200).json({ received: true });
  }

  try {
    const notes = await fetchOrderNotes(payment.order_id, keyId, keySecret);
    await sendConfirmationEmail(notes);
  } catch (error) {
    // A non-2xx here makes Razorpay retry, which won't fix a broken Resend
    // key or a dead order lookup — log it and still acknowledge receipt.
    console.error("Webhook: confirmation follow-up failed for order", payment.order_id, error);
  }

  return res.status(200).json({ received: true });
}
