import { sendJsonRpcRequest, getUserToken } from "../utils/functions.js";

// SimplyBook.me credentials
const companyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN;
const userLogin = process.env.SIMPLYBOOK_USER_LOGIN;
const userPassword = process.env.SIMPLYBOOK_USER_PASSWORD;

// Function to get bookings from the last month
async function getBookingsFromLastMonth(userToken, companyLogin) {
  const adminEndpointUrl = `${process.env.SIMPLYBOOK_API_URL}/admin`;

  // Set the date range for the last month (you can modify this logic as needed)
  const currentDate = new Date();
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(currentDate.getMonth() - 1); // Set to one month ago

  const params = {
    filter: {
      date_from: lastMonthDate.toISOString().split("T")[0], // Last month start date
      date_to: currentDate.toISOString().split("T")[0], // Today's date
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
        "Cron job triggered, fetching bookings for the last month..."
      );

      // Step 1: Authenticate and get the user token
      const userToken = await getUserToken(
        companyLogin,
        userLogin,
        userPassword
      );
      console.log("User Token received:", userToken);

      // Step 2: Fetch bookings from the last month
      const lastMonthBookings = await getBookingsFromLastMonth(
        userToken,
        companyLogin
      );
      console.log("Last Month's Bookings: ", lastMonthBookings);

      // Return the bookings or perform other actions
      return new Response(
        JSON.stringify({
          message: "Success",
          bookings: lastMonthBookings,
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
