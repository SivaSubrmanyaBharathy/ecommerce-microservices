const PaymentModel = require('../models/payment.model');
const { RABBITMQ, PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');

async function initiatePayment(request, reply) {
  const { orderId } = request.body;
  const paymentModel = new PaymentModel(request.server.db);

  try {
    const order = await paymentModel.getOrderById(orderId);
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      return reply.status(400).send({ error: `Order cannot be paid. Current status: ${order.status}` });
    }

    const razorpayOrderId = `rzp_order_${Date.now()}`;

    const payment = await paymentModel.createPaymentRecord(
      orderId, 
      razorpayOrderId, 
      PAYMENT_STATUS.PENDING
    );

    await paymentModel.updateOrderStatus(orderId, ORDER_STATUS.PAYMENT_PROCESSING);

    // Publish to RabbitMQ
    if (request.server.rabbitmq && request.server.rabbitmq.channel) {
      request.server.rabbitmq.channel.sendToQueue(
        RABBITMQ.PAYMENT_PROCESSING_QUEUE,
        Buffer.from(JSON.stringify({ orderId, paymentId: payment.id }))
      );
    } else {
      request.server.log.warn('RabbitMQ channel not available');
    }

    return {
      message: 'Payment initiated',
      paymentId: payment.id,
      razorpayOrderId
    };
  } catch (error) {
    request.server.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}

async function getPaymentStatus(request, reply) {
  const { id } = request.params;
  const paymentModel = new PaymentModel(request.server.db);
  
  const payment = await paymentModel.getPaymentById(id);
  if (!payment) return reply.status(404).send({ error: 'Payment not found' });
  
  return payment;
}

module.exports = {
  initiatePayment,
  getPaymentStatus
};
