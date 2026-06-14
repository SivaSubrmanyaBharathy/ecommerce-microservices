const fp = require('fastify-plugin');
const amqp = require('amqplib');
const config = require('../config');
const { RABBITMQ } = require('../config/constants');

async function rabbitmqPlugin(fastify, options) {
  try {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    
    await channel.assertQueue(RABBITMQ.PRODUCT_UPLOAD_QUEUE, { durable: true });

    fastify.decorate('rabbitmq', {
      connection,
      channel
    });

    fastify.addHook('onClose', async (instance) => {
      await instance.rabbitmq.channel.close();
      await instance.rabbitmq.connection.close();
    });
  } catch (err) {
    fastify.log.error('RabbitMQ connection failed', err);
    throw err;
  }
}

module.exports = fp(rabbitmqPlugin);
