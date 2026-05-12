const resendApiUrl = "https://api.resend.com/emails";

const htmlEmail = (body) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);max-width:600px;width:100%"><tr><td style="background:#121212;padding:28px 32px;text-align:center"><img src="https://porchpobox.com/porchlogo.png" alt="Porch P.O. Box" style="height:56px;display:block;margin:0 auto" /></td></tr><tr><td style="padding:36px 32px;color:#222;font-size:15px;line-height:1.7">${body}</td></tr><tr><td style="background:#f8f8f8;border-top:1px solid #eee;padding:20px 32px;text-align:center"><img src="https://porchpobox.com/logo.png" alt="Porch P.O. Box" style="height:48px;display:block;margin:0 auto 12px" /><p style="margin:0 0 4px;font-size:13px;color:#888">Porch P.O. Box &mdash; Convenient Package Receiving</p><p style="margin:0;font-size:13px"><a href="mailto:contact@porchpobox.com" style="color:#d4af37;text-decoration:none">contact@porchpobox.com</a></p></td></tr></table></td></tr></table></body></html>`;

const sendEmail = async ({ to, replyTo, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;

  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing MAIL_FROM_EMAIL or SMTP_FROM_EMAIL");

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, reply_to: replyTo, subject, html })
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
      html: htmlEmail(`
        <h2 style="margin:0 0 16px;color:#121212">Welcome, ${name || "there"}!</h2>
        <p>Your Porch P.O. Box account has been created successfully.</p>
        <p>Your <strong>first package delivery is on us</strong> &mdash; no subscription needed to try the service.</p>
        <p>Ready to get unlimited access? View our plans and subscribe today:</p>
        <p style="text-align:center;margin:28px 0">
          <a href="https://porchpobox.com/plans" style="background:#d4af37;color:#121212;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:15px">View Plans</a>
        </p>
        <p style="color:#666;font-size:14px">Questions? Just reply to this email and we'll be happy to help.</p>
      `)
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Email delivery failed" });
  }
};
