const amqp = require('amqplib');
const axios = require('axios');

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const webhookServiceUrl =
  process.env.WEBHOOK_SERVICE_URL || 'http://webhook-service:5005/webhook';

async function startReceiver() {
  let connection;
  try {
    connection = await retryConnectToRabbitMQ();
    const channel = await connection.createChannel();
    const queue = 'dataQueue';

    await channel.assertQueue(queue, { durable: true });

    channel.consume(queue, (message) => {
      if (message !== null) {
        // Simulate processing the received data
        console.log(
          '[data-service] Received message:',
          message.content.toString(),
        );
        channel.ack(message);

        // Forward the received data to the webhook-service via RabbitMQ
        axios
          .post(webhookServiceUrl, JSON.parse(message.content.toString()))
          .then(() => {
            console.log('[data-service] Payload forwarded to webhook-service.');
          })
          .catch((error) => {
            console.error(
              '[data-service] Error sending payload to webhook-service:',
              error,
            );
          });
      }
    });
  } catch (error) {
    console.error('Error in data-service:', error);
    // Handle the error or retry logic here, or exit the process if required.
    // For simplicity, we are not adding a full retry logic in this example.
  }
}

async function retryConnectToRabbitMQ(maxAttempts = 5, intervalMs = 5000) {
  let connection;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[data-service] Attempting to connect to RabbitMQ (Attempt ${attempt})...`,
      );
      connection = await amqp.connect(rabbitMQUrl);
      console.log('[data-service] Connected to RabbitMQ successfully!');
      return connection;
    } catch (error) {
      console.error('[data-service] Error connecting to RabbitMQ:', error);
      if (attempt < maxAttempts) {
        console.log(`[data-service] Retrying in ${intervalMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } else {
        throw new Error(
          '[data-service] Unable to connect to RabbitMQ after max attempts.',
        );
      }
    }
  }
}

startReceiver();
