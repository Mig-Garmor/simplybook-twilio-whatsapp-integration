// Import necessary modules
import fetch from "node-fetch";

// Define the SimplyBook.me API endpoint
const SIMPLYBOOK_API_URL = "https://user-api.simplybook.it/";

// Function to send a JSON-RPC request to SimplyBook.me
async function sendJsonRpcRequest(method, params) {
  const response = await fetch(SIMPLYBOOK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: 1, // Unique ID for the request
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `JSON-RPC Error: ${data.error.message} (Code: ${data.error.code})`
    );
  }

  return data.result; // Return the result from the response
}

// Function to authenticate and get the token
async function getToken(companyLogin, apiKey) {
  const params = {
    company_login: companyLogin,
    api_key: apiKey,
  };

  return await sendJsonRpcRequest("getToken", params);
}

// Example of how to use the token for a booking details call
async function getBookingDetails(companyLogin, token, bookingId, bookingHash) {
  const sign = require("crypto")
    .createHash("md5")
    .update(bookingId + bookingHash + process.env.SIMPLYBOOK_API_KEY)
    .digest("hex");

  const params = {
    id: bookingId,
    sign: sign,
  };

  const result = await sendJsonRpcRequest("getBookingDetails", params);
  return result;
}

(async () => {
  try {
    // Example usage
    const companyLogin = "your_company_login"; // Replace with your SimplyBook.me company login
    const apiKey = "your_api_key"; // Replace with your SimplyBook.me API key

    // Step 1: Get the token
    const token = await getToken(companyLogin, apiKey);
    console.log("Token:", token);

    // Step 2: Use the token for subsequent API requests (e.g., get booking details)
    const bookingDetails = await getBookingDetails(
      companyLogin,
      token,
      "bookingId",
      "bookingHash"
    );
    console.log("Booking Details:", bookingDetails);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
