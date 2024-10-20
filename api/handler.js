import SparkMD5 from "spark-md5"; // Import spark-md5 for MD5 hashing

//SimplyBook.me credentials
const publicKey = process.env.SIMPLYBOOK_PUBLIC_KEY; // Your SimplyBook public key (API key)
const secretKey = process.env.SIMPLYBOOK_SECRET_KEY; // Your SimplyBook secret key
const companyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN; // Your SimplyBook company login

// Twilio configuration
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// Function to generate a simple unique ID (UUID v4)
function generateUniqueId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to send a JSON-RPC request to SimplyBook.me
async function sendJsonRpcRequest(method, params, headers = {}, endpoint = "") {
  const simplybookApiUrl =
    endpoint ||
    process.env.SIMPLYBOOK_API_URL ||
    "https://user-api.simplybook.it"; // Correct JSON-RPC API endpoint
  const uniqueId = generateUniqueId(); // Generate unique ID for the request

  console.log(
    `Sending JSON-RPC request to ${simplybookApiUrl} with method: ${method} and params:`,
    params
  );

  const response = await fetch(`${simplybookApiUrl}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers, // Include any additional headers (like token authorization)
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: uniqueId, // Set unique ID for the request
    }),
  });

  const data = await response.json();

  console.log("JSON-RPC Response:", data);

  if (data.error) {
    throw new Error(
      `JSON-RPC Error: ${data.error.message} (Code: ${data.error.code})`
    );
  }

  // Check if the ID in the response matches the request's ID
  if (data.id !== uniqueId) {
    throw new Error("ID mismatch between request and response");
  }

  return data.result; // Return the result from the response
}

// Function to get the token using the login endpoint (Client Authorization)
async function getToken(companyLogin, publicKey) {
  // Use the login endpoint explicitly for token retrieval
  const loginUrl = `${process.env.SIMPLYBOOK_API_URL}/login`;

  const params = {
    companyLogin,
    publicKey,
  };

  return await sendJsonRpcRequest("getToken", params, {}, loginUrl); // Send request to the /login endpoint to get the token
}

// Function to get booking details using the token and JSON-RPC
async function getBookingDetails(
  bookingId,
  bookingHash,
  secretKey,
  token,
  companyLogin
) {
  // Create MD5 hash for signing (according to SimplyBook.me authentication process)
  const sign = SparkMD5.hash(bookingId + bookingHash + secretKey); // Sign using bookingId, bookingHash, and secret key

  // JSON-RPC call to get booking details
  const params = {
    id: bookingId,
    sign: sign,
  };

  // Pass the token and company login as headers
  const headers = {
    "X-Company-Login": companyLogin,
    "X-Token": token,
  };

  return await sendJsonRpcRequest("getBookingDetails", params, headers);
}

// Function to send WhatsApp message using Twilio API directly with fetch
async function sendWhatsAppMessage(clientPhone, clientName, bookingStatus) {
  const encodedAuth = Buffer.from(
    `${twilioAccountSid}:${twilioAuthToken}`
  ).toString("base64");

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  let messageBody;

  const params = new URLSearchParams({
    Body: messageBody,
    From: `whatsapp:${twilioWhatsAppNumber}`,
    To: `whatsapp:${clientPhone}`,
  });

  switch (bookingStatus) {
    case "confirmed":
      messageBody = `Hello ${clientName}, your booking has been confirmed.`;
      break;
    case "canceled":
      messageBody = `Hello ${clientName}, your booking has been canceled.`;
      break;
    default:
      messageBody = `Hello ${clientName}, your booking has been confirmed.`;
  }

  messageBody = `Hello ${clientName}, your booking has been confirmed.`;

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

// Handler function for Vercel edge function
export default async function handler(req) {
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Received POST request: ", body);

      const bookingId = body.booking_id;
      const bookingHash = body.booking_hash;

      console.log("Authenticating to get token...");

      // Step 1: Authenticate and get the token via JSON-RPC from the login endpoint
      const token = await getToken(companyLogin, publicKey);

      console.log("Token received:", token);

      // Step 2: Fetch booking details using JSON-RPC
      const bookingDetails = await getBookingDetails(
        bookingId,
        bookingHash,
        secretKey,
        token,
        companyLogin
      );

      // Step 3: Send WhatsApp message using Twilio API directly
      const clientPhone = bookingDetails.client_phone;
      const clientName = bookingDetails.client_name;
      const bookingStatus = bookingDetails.status;

      if (clientPhone) {
        await sendWhatsAppMessage(clientPhone, clientName, bookingStatus);
      }

      // Step 4: Return the booking details to the client
      return new Response(
        JSON.stringify({
          message: "Success",
          bookingDetails,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      // Handle errors and return appropriate response
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
  runtime: "edge", // Use edge runtime for low latency
};
