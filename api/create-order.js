// Creates a Razorpay order. The browser never sees the key secret, and never
// gets to choose the amount — that lives here so a tampered client can't pay ₹1
// for a ₹149 seat.

const DEFAULT_AMOUNT_PAISE = 14900; // ₹149

const TRACK_LABELS = {
  cycle: "Cycle & Hormone Balance",
  skin: "Skin & Hair Wellness",
  metabolic: "Metabolic & Insulin Health",
  mood: "Mood & Energy Restoration"
};

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    // 503 rather than 500: the frontend treats this as "checkout isn't wired up
    // yet" and falls back to the hosted payment link instead of showing an error.
    return res.status(503).json({ error: "Razorpay is not configured yet." });
  }

  const body = req.body || {};
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 20).replace(/[^\d+]/g, "");
  const track = clean(body.track, 40);
  const language = clean(body.language, 5) === "hi" ? "hi" : "en";

  if (!name) return res.status(400).json({ error: "Please enter your name." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return res.status(400).json({ error: "Please enter a valid phone number." });
  }

  const amount = Number(process.env.WORKSHOP_AMOUNT_PAISE) || DEFAULT_AMOUNT_PAISE;

  try {
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        // Razorpay caps receipt at 40 chars.
        receipt: `gs_${Date.now()}`.slice(0, 40),
        notes: {
          name,
          email,
          phone,
          // What she told us on the landing page quiz — so you know what each
          // buyer actually came in for when you look at the Razorpay dashboard.
          focus_track: TRACK_LABELS[track] || "Not selected",
          focus_track_key: track || "",
          language
        }
      })
    });

    const data = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      console.error("Razorpay order error:", data);
      return res.status(502).json({ error: "Could not start the payment. Please try again." });
    }

    // key_id is publishable — Razorpay's checkout script needs it in the browser.
    return res.status(200).json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch (error) {
    console.error("Server error creating order:", error);
    return res.status(500).json({ error: "Could not reach the payment service." });
  }
}
