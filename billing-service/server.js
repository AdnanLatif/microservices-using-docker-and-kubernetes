const express = require('express');
const axios = require('axios');
const amqp = require('amqplib/callback_api'); // Include amqplib here

const app = express();
const port = 5004;

app.use(express.json());

// Connect to RabbitMQ and create channel once
let rabbitMQChannel;

function connectToRabbitMQ() {
  amqp.connect('amqp://rabbitmq', (error, connection) => {
    if (error) {
      console.error('[billing-service] Error connecting to RabbitMQ:', error);
      // Retry the connection after a certain interval
      setTimeout(connectToRabbitMQ, 5000);
      return;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        console.error(
          '[billing-service] Error creating RabbitMQ channel:',
          error,
        );
        connection.close();
        // Retry the connection after a certain interval
        setTimeout(connectToRabbitMQ, 5000);
        return;
      }

      rabbitMQChannel = channel;
      console.log('[billing-service] Connected to RabbitMQ successfully!');
    });
  });
}

// Start the initial connection attempt to RabbitMQ
connectToRabbitMQ();

// POST /billing endpoint
app.post('/billing', (req, res) => {
  const payload = req.body;
  console.log('[billing-service] Received payload:', payload);

  if (!rabbitMQChannel) {
    console.error('[billing-service] RabbitMQ channel not available.');
    res.sendStatus(500);
    return;
  }

  const queue = 'dataQueue';
  rabbitMQChannel.assertQueue(queue, { durable: true });
  rabbitMQChannel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  console.log('[billing-service] Payload sent to data-service via RabbitMQ.');
  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`billing-service listening at http://localhost:${port}`);
});
