const fp = require('fastify-plugin');
const { createClient } = require('redis');
const config = require('../config');

async function redisPlugin(fastify, options) {
  const redisClient = createClient({ url: config.redis.url });
  
  redisClient.on('error', (err) => fastify.log.error('Redis Client Error', err));

  await redisClient.connect();

  fastify.decorate('redis', redisClient);

  fastify.addHook('onClose', async (instance) => {
    await instance.redis.quit();
  });
}

module.exports = fp(redisPlugin);
