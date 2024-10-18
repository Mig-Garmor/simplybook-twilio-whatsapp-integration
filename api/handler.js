export default async function handler(req) {
  if (req.method === "POST") {
    try {
      const data = await req.json(); // Parse incoming POST data
      console.log("Received POST request:", data);

      // Process the POST data here (e.g., trigger Twilio API, update DB, etc.)

      return new Response(JSON.stringify({ message: "Success", data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Something went wrong" }), {
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
