const orderHandler = require('../handlers/order.handler');

async function orderRoutes(fastify, options) {
  fastify.post('/orders', orderHandler.createOrder);
  fastify.get('/orders/:id', orderHandler.getOrder);
}

module.exports = orderRoutes;
