const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json()); // Parse incoming requests as JSON

const port = 5005;

app.post('/webhook', (req, res) => {
  const payload = req.body;
  console.log('[webhook-service] Received payload:', payload);

  // In a real-world scenario, you would handle the webhook data here
  // ...

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`[webhook-service] Server is running on port ${port}`);
});
