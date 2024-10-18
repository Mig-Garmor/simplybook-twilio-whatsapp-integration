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
async function sendJsonRpcRequest(method, params, headers = {}) {
  const simplybookApiUrl =
    process.env.SIMPLYBOOK_API_URL || "https://user-api.simplybook.it"; // Correct JSON-RPC API endpoint
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

// Function to get the token using JSON-RPC (Client Authorization)
async function getToken(companyLogin, publicKey) {
  // JSON-RPC call to get the token
  const params = {
    company_login: companyLogin,
    api_key: publicKey, // Use public key (API key)
  };

  return await sendJsonRpcRequest("getToken", params); // Get the token using the company's login and public API key
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

// Handler function for Vercel edge function
export default async function handler(req) {
  if (req.method === "POST") {
    try {
      const { bookingId, bookingHash } = await req.json(); // Get bookingId and bookingHash from the request body

      const publicKey = process.env.SIMPLYBOOK_PUBLIC_KEY; // Your SimplyBook public key (API key)
      const secretKey = process.env.SIMPLYBOOK_SECRET_KEY; // Your SimplyBook secret key
      const companyLogin =
        process.env.SIMPLYBOOK_COMPANY_LOGIN || "your_company_login"; // Your SimplyBook company login

      console.log("Authenticating to get token...");

      // Step 1: Authenticate and get the token via JSON-RPC
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
