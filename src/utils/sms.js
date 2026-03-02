const twilio = require("twilio");

/**
 * Utility to send SMS using Twilio.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.
 */
const sendSMS = async ({ to, body }) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || accountSid.includes("your_twilio") || !authToken || authToken.includes("your_twilio")) {
       console.log(`[Mock SMS] Sent to ${to}: ${body}`);
       return null;
    }

    const client = new twilio(accountSid, authToken);

    // Twilio requires E.164 formatting (e.g. +91xxxxxxxxxx).
    // If the number is exactly 10 digits and lacks a plus, add a default +91 country code.
    let formattedTo = to;
    if (formattedTo && formattedTo.length === 10 && !formattedTo.startsWith("+")) {
       formattedTo = `+91${formattedTo}`;
    }

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });

    console.log("SMS sent: %s", message.sid);
    return message;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS");
  }
};

module.exports = {
  sendSMS,
};
