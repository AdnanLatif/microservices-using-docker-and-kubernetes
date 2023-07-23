// imports
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');

// init express app
const app = express();
const port = 5001;

// use morgan middleware
app.use(morgan('combined'));
app.use(express.json());

// POST /shipping endpoint
app.post('/shipping', (req, res) => {
  const payload = req.body;
  console.log('[shipping-service] Received payload:', payload);

  // Send payload to data-service via RabbitMQ
  // In a real-world scenario, you would use a RabbitMQ publisher here
  const amqp = require('amqplib/callback_api'); // Include amqplib here
  amqp.connect('amqp://rabbitmq', (error0, connection) => {
    if (error0) {
      console.error('[shipping-service] Error connecting to RabbitMQ:', error0);
      res.sendStatus(500);
      return;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        console.error(
          '[shipping-service] Error creating RabbitMQ channel:',
          error1,
        );
        res.sendStatus(500);
        return;
      }
      const queue = 'dataQueue';
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
      });
      console.log(
        '[shipping-service] Payload sent to data-service via RabbitMQ.',
      );
      res.sendStatus(200);
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`shipping-service listening at http://localhost:${port}`);
});
