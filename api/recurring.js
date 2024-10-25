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

// Function to fetch bookings from exactly one month ago
async function getBookingsFromExactMonthAgo(userToken, companyLogin) {
  const adminEndpointUrl = `${process.env.SIMPLYBOOK_API_URL}/admin`;

  const currentDate = new Date();
  const exactMonthAgoDate = new Date(currentDate);
  exactMonthAgoDate.setMonth(currentDate.getMonth() - 1);

  // Format the date to get only the day from exactly one month ago
  const dateStr = exactMonthAgoDate.toISOString().split("T")[0];

  const params = {
    filter: {
      date_from: dateStr, // Start date set to exactly one month ago
      date_to: dateStr, // End date set to the same day
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

  const messageBody = `${clientName}, it's been one month since your last haircut. 
  
Book here and get a fresh haircut!

https://planbbarber.simplybook.it/
`;

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
  if (req.method === "POST" || req.method === "GET") {
    try {
      console.log("Fetching user token...");
      const userToken = await getUserToken(
        companyLogin,
        userLogin,
        userPassword
      );
      console.log("User Token received:", userToken);

      // Step 1: Fetch bookings from exactly one month ago
      console.log("Fetching bookings from exactly one month ago...");
      const bookings = await getBookingsFromExactMonthAgo(
        userToken,
        companyLogin
      );
      console.log("Bookings from exactly one hour ago: ", bookings);

      // Step 2.1: Filter out unconfirmed bookings (is_confirm === '0')
      const confirmedBookings = bookings.filter(
        (booking) => booking.is_confirm === "1"
      );
      console.log("Confirmed bookings: ", confirmedBookings);

      // Step 2.2: Filter unique clients by phone number
      const uniqueClients = {};
      confirmedBookings.forEach((booking) => {
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
