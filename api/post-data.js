module.exports = (req, res) => {
  const data = req.body;
  console.log("Received data:", data);
  res.status(200).send({ message: "Data received", receivedData: data });
};
