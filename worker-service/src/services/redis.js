const { createClient } = require('redis');
const config = require('../config');

const redisClient = createClient({ url: config.redis.url });
redisClient.on('error', (err) => console.log('Redis Client Error', err));

module.exports = redisClient;
