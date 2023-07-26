// imports
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const amqp = require('amqplib/callback_api');

// init express app
const app = express();
const port = 5001;

// use morgan middleware
app.use(morgan('combined'));
app.use(express.json());

// Connect to RabbitMQ and create channel once
let rabbitMQChannel;

function connectToRabbitMQ() {
  const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
  amqp.connect(rabbitMQUrl, (error, connection) => {
    if (error) {
      console.error('[shipping-service] Error connecting to RabbitMQ:', error);
      // Retry the connection after a certain interval
      setTimeout(connectToRabbitMQ, 5000);
      return;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        console.error(
          '[shipping-service] Error creating RabbitMQ channel:',
          error,
        );
        connection.close();
        // Retry the connection after a certain interval
        setTimeout(connectToRabbitMQ, 5000);
        return;
      }

      rabbitMQChannel = channel;
      console.log('[shipping-service] Connected to RabbitMQ successfully!');
    });
  });
}

// Start the initial connection attempt to RabbitMQ
connectToRabbitMQ();

// Helper function to send data to data-service via RabbitMQ
function sendDataToDataService(payload) {
  if (!rabbitMQChannel) {
    console.error('[shipping-service] RabbitMQ channel not available.');
    return;
  }

  const queue = 'dataQueue';
  rabbitMQChannel.assertQueue(queue, { durable: true });
  rabbitMQChannel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  console.log('[shipping-service] Payload sent to data-service via RabbitMQ.');
}

// POST /shipping endpoint
app.post('/shipping', (req, res) => {
  const payload = req.body;
  console.log('[shipping-service] Received payload:', payload);

  sendDataToDataService(payload);

  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`shipping-service listening at http://localhost:${port}`);
});
