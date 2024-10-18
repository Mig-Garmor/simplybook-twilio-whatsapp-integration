export default async function handler(req) {
  if (req.method === "POST") {
    try {
      const { bookingId } = await req.json(); // Assume bookingId is sent in the POST request

      // Call Simplybook.me API to get booking details
      const simplybookApiUrl = `https://user-api-v2.simplybook.it/getBookingDetails`;
      const simplybookApiKey = process.env.SIMPLYBOOK_API_KEY; // Store API key in Vercel environment variables

      const response = await fetch(simplybookApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Login": "https://migar.simplybook.it", // Replace with your Simplybook.me company login
          "X-Token": simplybookApiKey,
        },
        body: JSON.stringify({
          id: bookingId, // Pass the booking ID from the request body
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
