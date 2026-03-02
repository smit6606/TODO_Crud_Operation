const nodemailer = require("nodemailer");

/**
 * Utility to send emails using Nodemailer.
 * Requires EMAIL_USER and EMAIL_PASS environment variables.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes("your_email")) {
    console.log(`[Mock Email] Sent to ${to} with subject: ${subject}`);
    return { messageId: "mock-email-id" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can configure this to use other services (e.g., SendGrid, Mailgun)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendEmail,
};
