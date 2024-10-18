const express = require("express");
const app = express();

app.use(express.json()); // Middleware to parse JSON

// Define a POST endpoint
app.post("/api/post-data", (req, res) => {
  const data = req.body;
  console.log("Received data:", data);
  res.status(200).send({ message: "Data received", receivedData: data });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
