import SparkMD5 from "spark-md5"; // Import spark-md5 for MD5 hashing

export default async function handler(req) {
  if (req.method === "POST") {
    try {
      console.log("req.body", req.body);
      const { bookingId, bookingHash } = await req.json(); // Assume bookingId and bookingHash are sent in the POST request

      // 1. Authenticate to get the access token
      const simplybookLoginUrl = `https://user-api.simplybook.me/v2/login`;
      const simplybookApiKey = process.env.SIMPLYBOOK_API_KEY; // Your SimplyBook API key
      const companyLogin = "migar"; // Your SimplyBook company login

      // Send login request to get access token
      const authResponse = await fetch(simplybookLoginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_login: companyLogin,
          api_key: simplybookApiKey,
        }),
      });

      if (!authResponse.ok) {
        throw new Error("Authentication failed");
      }

      const { token } = await authResponse.json(); // Extract the token from the response

      // 2. Create the MD5 hash (sign parameter) for the booking details request
      const sign = SparkMD5.hash(bookingId + bookingHash + simplybookApiKey);

      // 3. Use the token to call the SimplyBook.me API to get booking details
      const simplybookApiUrl = `https://user-api-v2.simplybook.it/getBookingDetails`;

      const response = await fetch(simplybookApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Login": companyLogin, // Replace with your SimplyBook.me company login
          "X-Token": token, // Use the access token obtained from the login request
        },
        body: JSON.stringify({
          id: bookingId, // Pass the booking ID
          sign: sign, // Pass the generated sign
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch booking details from Simplybook.me");
      }

      const bookingDetails = await response.json();

      // Console log the booking details
      console.log("Booking Details:", bookingDetails);

      return new Response(
        JSON.stringify({ message: "Success", bookingDetails }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      // Log the error for debugging
      console.error("Error fetching booking details:", error);

      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export const config = {
  runtime: "edge", // Use edge runtime for low latency
};
