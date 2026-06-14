class PaymentModel {
  constructor(db) {
    this.db = db;
  }

  async getOrderById(orderId) {
    return this.db('orders').where({ id: orderId }).first();
  }

  async updateOrderStatus(orderId, status) {
    return this.db('orders').where({ id: orderId }).update({ status });
  }

  async createPaymentRecord(orderId, razorpayOrderId, status) {
    const [payment] = await this.db('payments').insert({
      order_id: orderId,
      status: status,
      razorpay_order_id: razorpayOrderId
    }).returning('*');
    return payment;
  }

  async getPaymentById(id) {
    return this.db('payments').where({ id }).first();
  }
}

module.exports = PaymentModel;
