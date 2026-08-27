// Confirms a payment actually came from Razorpay.
//
// The browser reports its own success, so that report can't be trusted on its
// own. Razorpay signs `order_id|payment_id` with the key secret; recomputing
// that HMAC here is the only thing that proves the payment is real.

import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(String(signature), "utf8");
  const valid =
    expectedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (!valid) {
    console.warn("Signature mismatch for order", orderId);
    return res.status(400).json({ verified: false, error: "Payment could not be verified." });
  }

  // Payment is genuine. Anything that should happen once per paid seat — mailing
  // the Zoom link, adding her to the WhatsApp group, appending to a sheet —
  // belongs here. Razorpay's dashboard holds the record until then.
  console.log("Verified payment", paymentId, "for order", orderId);

  return res.status(200).json({ verified: true });
}
