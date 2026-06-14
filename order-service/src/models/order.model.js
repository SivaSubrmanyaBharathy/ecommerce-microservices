class OrderModel {
  constructor(db) {
    this.db = db;
  }

  async getOrderById(id) {
    return this.db('orders').where({ id }).first();
  }

  async getOrderItems(orderId) {
    return this.db('order_items').where({ order_id: orderId });
  }

  async getProductForUpdate(trx, productId) {
    return trx('products').where('id', productId).forUpdate().first();
  }

  async reduceProductStock(trx, productId, quantity) {
    return trx('products').where('id', productId).decrement('stock', quantity);
  }

  async createOrder(trx, totalAmount, status) {
    const [order] = await trx('orders').insert({
      total_amount: totalAmount,
      status: status
    }).returning('*');
    return order;
  }

  async createOrderItems(trx, items) {
    return trx('order_items').insert(items);
  }
}

module.exports = OrderModel;
