module.exports = (req, res) => {
  if (req.method === "POST") {
    const bookingData = req.body;

    // Log the received booking data to Vercel's logs
    console.log("Booking Data Received:", bookingData);

    // Send a response back to Simplybook.me
    res.status(200).json({ message: "Booking received successfully" });
  } else {
    // If it's not a POST request, return a 405 (Method Not Allowed)
    res.status(405).json({ message: "Method Not Allowed" });
  }
};
