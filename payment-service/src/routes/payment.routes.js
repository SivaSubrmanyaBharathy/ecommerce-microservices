const paymentHandler = require('../handlers/payment.handler');

async function paymentRoutes(fastify, options) {
  fastify.post('/payments/initiate', paymentHandler.initiatePayment);
  fastify.get('/payments/:id', paymentHandler.getPaymentStatus);
}

module.exports = paymentRoutes;
