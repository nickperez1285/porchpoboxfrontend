const resendApiUrl = "https://api.resend.com/emails";

const sendEmail = async ({ to, replyTo, subject, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!from) {
    throw new Error("Missing MAIL_FROM_EMAIL or SMTP_FROM_EMAIL");
  }

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo,
      subject,
      text
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.message ||
        errorBody?.error?.message ||
        `Resend API request failed with status ${response.status}`
    );
  }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: "Missing email" });
  }

  try {
    await sendEmail({
      to: email,
      replyTo: "contact@porchpobox.com",
      subject: "Welcome to Porch P.O. Box",
      text: [
        `Hello ${name || "there"},`,
        "",
        "Welcome to Porch P.O. Box.",
        "",
        "Your account has been created successfully. We invite you to try the service for the first time for free.",
        "",
        "Sign in anytime to get started.",
        "",
        "Porch P.O. Box"
      ].join("\n")
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Email delivery failed" });
  }
};
