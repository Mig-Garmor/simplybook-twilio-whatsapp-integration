import { sendJsonRpcRequest, getUserToken } from "../utils/functions.js";

// SimplyBook.me credentials
const companyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN;
const userLogin = process.env.SIMPLYBOOK_USER_LOGIN;
const userPassword = process.env.SIMPLYBOOK_USER_PASSWORD;

// Twilio configuration
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// Twilio WhatsApp image URL
const mediaUrl =
  "https://planbbarber.simplybook.it/uploads/planbbarber/image_files/preview/45082ff229ebc86fefe79123d22a410e.jpeg";

// Function to fetch bookings from exactly one hour ago
async function getBookingsFromExactHourAgo(userToken, companyLogin) {
  const adminEndpointUrl = `${process.env.SIMPLYBOOK_API_URL}/admin`;

  const currentDate = new Date();
  const exactHourAgoDate = new Date(currentDate);
  exactHourAgoDate.setHours(currentDate.getHours() - 1);

  const dateFromStr = exactHourAgoDate.toISOString().split(".")[0];
  const dateToStr = dateFromStr; // Set both `date_from` and `date_to` to the same hour

  const params = {
    filter: {
      date_from: dateFromStr,
      date_to: dateToStr,
    },
  };

  const headers = {
    "X-Company-Login": companyLogin,
    "X-User-Token": userToken,
  };

  return await sendJsonRpcRequest(
    "getBookings",
    params,
    headers,
    adminEndpointUrl
  );
}

// Function to send WhatsApp message using Twilio
async function sendWhatsAppMessage(clientPhone, clientName) {
  const encodedAuth = Buffer.from(
    `${twilioAccountSid}:${twilioAuthToken}`
  ).toString("base64");

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

  const messageBody = `${clientName}, it's been one month since your last haircut. Book with us now and get a fresh haircut!`;

  const params = new URLSearchParams({
    Body: messageBody,
    From: `whatsapp:${twilioWhatsAppNumber}`,
    To: `whatsapp:${clientPhone}`,
    MediaUrl: mediaUrl,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    console.log("WhatsApp message sent successfully: ", data.sid);
  } catch (error) {
    console.error("Error sending WhatsApp message: ", error);
  }
}

// Main handler function for Vercel Edge Function
export default async function handler(req) {
  if (req.method === "POST") {
    try {
      console.log("Fetching user token...");
      const userToken = await getUserToken(
        companyLogin,
        userLogin,
        userPassword
      );
      console.log("User Token received:", userToken);

      // Step 1: Fetch bookings from exactly one hour ago
      console.log("Fetching bookings from exactly one hour ago...");
      const bookings = await getBookingsFromExactHourAgo(
        userToken,
        companyLogin
      );
      console.log("Bookings from exactly one hour ago: ", bookings);

      // Step 2: Filter unique clients by phone number
      const uniqueClients = {};
      bookings.forEach((booking) => {
        if (!uniqueClients[booking.client_phone]) {
          uniqueClients[booking.client_phone] = booking.client;
        }
      });

      // Step 3: Send WhatsApp message to each unique client
      for (const [phone, name] of Object.entries(uniqueClients)) {
        await sendWhatsAppMessage(phone, name);
      }

      return new Response(
        JSON.stringify({
          message: "Messages sent to unique clients",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } else {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export const config = {
  runtime: "edge",
};
