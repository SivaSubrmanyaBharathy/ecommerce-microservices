const amqp = require('amqplib');
const config = require('./config');
const { RABBITMQ } = require('./config/constants');
const redisClient = require('./services/redis');
const { processExcelUpload } = require('./handlers/product.worker');
const { processPayment } = require('./handlers/payment.worker');

const start = async () => {
  try {
    await redisClient.connect();
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    
    await channel.assertQueue(RABBITMQ.PRODUCT_UPLOAD_QUEUE, { durable: true });
    await channel.assertQueue(RABBITMQ.PAYMENT_PROCESSING_QUEUE, { durable: true });

    console.log('Worker service started. Waiting for messages...');

    channel.consume(RABBITMQ.PRODUCT_UPLOAD_QUEUE, (msg) => {
      if (msg !== null) {
        const { uploadId } = JSON.parse(msg.content.toString());
        processExcelUpload(uploadId, channel, msg);
      }
    });

    channel.consume(RABBITMQ.PAYMENT_PROCESSING_QUEUE, (msg) => {
      if (msg !== null) {
        const { orderId, paymentId } = JSON.parse(msg.content.toString());
        processPayment(paymentId, orderId, channel, msg);
      }
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
