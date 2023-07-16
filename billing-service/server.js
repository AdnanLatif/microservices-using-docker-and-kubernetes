const express = require('express');
const axios = require('axios');

const app = express();
const port = 5004;

app.use(express.json());

// POST /billing endpoint
app.post('/billing', (req, res) => {
  // Log the received object
  console.log(req.body);

  // Send the received object to shipping-service
  axios
    .post('http://shipping-service:5001/shipping', req.body)
    .then(() => {
      res.sendStatus(200);
    })
    .catch((error) => {
      console.error('Error sending request to shipping-service:', error);
      res.sendStatus(500);
    });
});

// Start the server
app.listen(port, () => {
  console.log(`billing-service listening at http://localhost:${port}`);
});
