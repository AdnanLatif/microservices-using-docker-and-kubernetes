// imports
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const amqp = require('amqplib/callback_api');

// init express app
const app = express();
const port = 5006;

// use morgan middleware
app.use(morgan('combined'));
app.use(express.json());

// Connect to RabbitMQ and create channel once
let rabbitMQChannel;

function connectToRabbitMQ() {
  const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
  amqp.connect(rabbitMQUrl, (error, connection) => {
    if (error) {
      console.error('[users-service] Error connecting to RabbitMQ:', error);
      // Retry the connection after a certain interval
      setTimeout(connectToRabbitMQ, 5000);
      return;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        console.error(
          '[users-service] Error creating RabbitMQ channel:',
          error,
        );
        connection.close();
        // Retry the connection after a certain interval
        setTimeout(connectToRabbitMQ, 5000);
        return;
      }

      rabbitMQChannel = channel;
      console.log('[users-service] Connected to RabbitMQ successfully!');
    });
  });
}

// Start the initial connection attempt to RabbitMQ
connectToRabbitMQ();

// Helper function to send data to data-service via RabbitMQ
function sendDataToDataService(payload) {
  if (!rabbitMQChannel) {
    console.error('[users-service] RabbitMQ channel not available.');
    return;
  }

  const queue = 'dataQueue';
  rabbitMQChannel.assertQueue(queue, { durable: true });
  rabbitMQChannel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  console.log('[users-service] Payload sent to data-service via RabbitMQ.');
}

// POST /users endpoint
app.post('/users', (req, res) => {
  const payload = req.body;
  console.log('[users-service] Received payload:', payload);

  sendDataToDataService(payload);

  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`users-service listening at http://localhost:${port}`);
});
