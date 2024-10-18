import SparkMD5 from "spark-md5"; // Import spark-md5 for MD5 hashing

// Function to get the authentication token
async function getToken(companyLogin, apiKey) {
  const simplybookLoginUrl = `https://user-api-v2.simplybook.it/login`;

  const response = await fetch(simplybookLoginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      company_login: companyLogin,
      api_key: apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with SimplyBook.me");
  }

  const { token } = await response.json();
  return token;
}

// Function to get booking details using the token
async function getBookingDetails(
  companyLogin,
  token,
  bookingId,
  bookingHash,
  apiKey
) {
  const sign = SparkMD5.hash(bookingId + bookingHash + apiKey); // Create MD5 sign

  const simplybookApiUrl = `https://user-api-v2.simplybook.it/getBookingDetails`;

  const response = await fetch(simplybookApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": companyLogin,
      "X-Token": token,
    },
    body: JSON.stringify({
      id: bookingId,
      sign: sign,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch booking details from SimplyBook.me");
  }

  return response.json(); // Return the booking details JSON response
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { bookingId, bookingHash } = req.body; // Get bookingId and bookingHash from the request body

      const simplybookApiKey = process.env.SIMPLYBOOK_API_KEY; // Your SimplyBook API key
      const companyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN || "migar"; // Your SimplyBook company login

      // Step 1: Authenticate and get the token
      const token = await getToken(companyLogin, simplybookApiKey);

      // Step 2: Use the token to fetch booking details
      const bookingDetails = await getBookingDetails(
        companyLogin,
        token,
        bookingId,
        bookingHash,
        simplybookApiKey
      );

      // Step 3: Return the booking details to the client
      return res.status(200).json({
        message: "Success",
        bookingDetails,
      });
    } catch (error) {
      // Handle errors and return appropriate response
      console.error("Error:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }
}

export const config = {
  runtime: "edge", // Use edge runtime for low latency
};
