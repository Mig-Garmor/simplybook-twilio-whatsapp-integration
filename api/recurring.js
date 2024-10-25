import { sendJsonRpcRequest, getUserToken } from "../utils/functions.js";

// SimplyBook.me credentials
const companyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN;
const userLogin = process.env.SIMPLYBOOK_USER_LOGIN;
const userPassword = process.env.SIMPLYBOOK_USER_PASSWORD;

// Function to get bookings from exactly one month ago
async function getBookingsFromExactMonthAgo(userToken, companyLogin) {
  const adminEndpointUrl = `${process.env.SIMPLYBOOK_API_URL}/admin`;

  // Get the current date and adjust it to one month ago
  const currentDate = new Date();
  const exactMonthAgoDate = new Date(currentDate);
  exactMonthAgoDate.setMonth(currentDate.getMonth() - 1);

  // Format the date to YYYY-MM-DD for both from and to fields
  const dateStr = exactMonthAgoDate.toISOString().split("T")[0];

  const params = {
    filter: {
      date_from: dateStr, // Start and end date set to exactly one month ago
      date_to: dateStr, // The same day
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

//DELETE - Function to get bookings from exactly one hour ago
async function getBookingsFromExactHourAgo(userToken, companyLogin) {
  const adminEndpointUrl = `${process.env.SIMPLYBOOK_API_URL}/admin`;

  // Get the current date and adjust it to one hour ago
  const currentDate = new Date();
  const exactHourAgoDate = new Date(currentDate);
  exactHourAgoDate.setHours(currentDate.getHours() - 1);

  // Format date and time to YYYY-MM-DDTHH:MM:SS (ISO format without milliseconds)
  const dateFromStr = exactHourAgoDate.toISOString().split(".")[0];
  const dateToStr = dateFromStr; // Same start and end timestamp for exactly one hour ago

  const params = {
    filter: {
      date_from: dateFromStr, // Start date and time exactly one hour ago
      date_to: dateToStr, // End date and time the same hour
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

// Handler function for Vercel cron job
export default async function handler(req) {
  if (req.method === "GET") {
    try {
      console.log(
        "Cron job triggered, fetching bookings from exactly one month ago..."
      );

      // Step 1: Authenticate and get the user token
      const userToken = await getUserToken(
        companyLogin,
        userLogin,
        userPassword
      );
      console.log("User Token received:", userToken);

      // Step 2: Fetch bookings from exactly one month ago
      //   const exactMonthAgoBookings = await getBookingsFromExactMonthAgo(
      //     userToken,
      //     companyLogin
      //   );
      //   console.log(
      //     "Bookings from exactly one month ago: ",
      //     exactMonthAgoBookings
      //   );

      const exactMonthAgoBookings = await getBookingsFromExactHourAgo(
        userToken,
        companyLogin
      );
      console.log(
        "Bookings from exactly one hour ago: ",
        exactMonthAgoBookings
      );

      // Return the bookings or perform other actions
      return new Response(
        JSON.stringify({
          message: "Success",
          bookings: exactMonthAgoBookings,
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
