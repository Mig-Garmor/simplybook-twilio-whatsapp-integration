const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

require("dotenv").config(); // Load environment variables from .env file

const app = express();
const cors = require("cors");

app.use(bodyParser.json());
app.use(cors());

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

//Whatsapp number
const whatsappNumber = process.env.WHATSAPP_NUMBER;

// Endpoint to receive webhook from Simplybook.me
app.post("/webhook", (req, res) => {
  try {
    console.log("Webhook received:", req.body);
    const { clientPhone, eventType, bookingDetails } = req.body;

    if (eventType === "new_booking") {
      sendWhatsAppMessage(clientPhone, bookingDetails);
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Server error");
  }
});

// Function to send WhatsApp message
function sendWhatsAppMessage(to, bookingDetails) {
  client.messages
    .create({
      from: `whatsapp:${whatsappNumber}`, // Twilio WhatsApp sandbox number
      to: `whatsapp:${to}`,
      body: `Hi, your booking for ${bookingDetails.service} is confirmed! Details: ${bookingDetails.time}`,
    })
    .then((message) => console.log(`Message sent: ${message.sid}`))
    .catch((error) => console.error("Error sending WhatsApp message:", error));
}
