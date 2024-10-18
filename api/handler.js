import SparkMD5 from "spark-md5"; // Import spark-md5 for MD5 hashing

// Function to generate a simple unique ID (UUID v4)
function generateUniqueId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Function to send a JSON-RPC request to SimplyBook.me
async function sendJsonRpcRequest(method, params) {
  const simplybookApiUrl = process.SIMPLYBOOK_API_URL; // Correct JSON-RPC API endpoint
  const uniqueId = generateUniqueId(); // Generate unique ID for the request

  console.log(
    `Sending JSON-RPC request to ${simplybookApiUrl} with method: ${method} and params:`,
    params
  );

  const response = await fetch(simplybookApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

// Function to get the token using JSON-RPC (Client Authorization)
async function getToken(companyLogin, apiKey) {
  // JSON-RPC call to get the token
  const params = {
    company_login: companyLogin,
    api_key: apiKey,
  };

  return await sendJsonRpcRequest("getToken", params); // Get the token using the company's login and API key
}

// Function to get booking details using the token and JSON-RPC
async function getBookingDetails(
  companyLogin,
  token,
  bookingId,
  bookingHash,
  apiKey
) {
  // Create MD5 hash for signing (according to SimplyBook.me authentication process)
  const sign = SparkMD5.hash(bookingId + bookingHash + apiKey);

  // JSON-RPC call to get booking details
  const params = {
    id: bookingId,
    sign: sign,
  };

  return await sendJsonRpcRequest("getBookingDetails", params);
}

// Handler function for Vercel edge function
export default async function handler(req) {
  if (req.method === "POST") {
    try {
      const { bookingId, bookingHash } = await req.json(); // Get bookingId and bookingHash from the request body

      const simplybookApiKey = process.env.SIMPLYBOOK_API_KEY; // Your SimplyBook API key
      const companyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN || "migar"; // Your SimplyBook company login

      console.log("Authenticating to get token...");

      // Step 1: Authenticate and get the token via JSON-RPC
      const token = await getToken(companyLogin, simplybookApiKey);

      console.log("Token received:", token);

      // Step 2: Fetch booking details using JSON-RPC
      const bookingDetails = await getBookingDetails(
        companyLogin,
        token,
        bookingId,
        bookingHash,
        simplybookApiKey
      );

      // Step 3: Return the booking details to the client
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
