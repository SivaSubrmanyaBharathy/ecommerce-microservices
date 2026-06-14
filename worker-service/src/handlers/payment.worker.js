const db = require('../services/db');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');

async function processPayment(paymentId, orderId, channel, msg) {
  try {
    const payment = await db('payments').where({ id: paymentId }).first();
    if (!payment) {
      console.log(`Payment ${paymentId} not found`);
      channel.ack(msg);
      return;
    }

    console.log(`Processing payment for Order ${orderId}...`);
    
    // Simulate Razorpay delay and callback
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;
    
    const paymentStatus = isSuccess ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED;
    const orderStatus = isSuccess ? ORDER_STATUS.PAID : ORDER_STATUS.PAYMENT_FAILED;
    const razorpayPaymentId = isSuccess ? `rzp_pay_${Date.now()}` : null;

    await db.transaction(async (trx) => {
      await trx('payments').where({ id: paymentId }).update({
        status: paymentStatus,
        razorpay_payment_id: razorpayPaymentId
      });

      await trx('orders').where({ id: orderId }).update({
        status: orderStatus
      });
    });

    console.log(`Payment ${paymentId} processed: ${paymentStatus}`);
    channel.ack(msg);
  } catch (error) {
    console.error(`Error processing payment ${paymentId}:`, error);
    channel.ack(msg);
  }
}

module.exports = {
  processPayment
};
