const OrderModel = require('../models/order.model');
const { ORDER_STATUS } = require('../config/constants');

async function createOrder(request, reply) {
  const { items } = request.body;
  const orderModel = new OrderModel(request.server.db);
  
  try {
    const result = await request.server.db.transaction(async (trx) => {
      let totalAmount = 0;
      const orderItemsToInsert = [];

      for (const item of items) {
        const product = await orderModel.getProductForUpdate(trx, item.productId);

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for Product ${item.productId}`);
        }

        await orderModel.reduceProductStock(trx, item.productId, item.quantity);
        
        totalAmount += product.price * item.quantity;
        
        orderItemsToInsert.push({
          product_id: item.productId,
          quantity: item.quantity,
          price: product.price
        });
      }

      const order = await orderModel.createOrder(trx, totalAmount, ORDER_STATUS.PENDING_PAYMENT);
      
      const itemsWithOrderId = orderItemsToInsert.map(oi => ({ ...oi, order_id: order.id }));
      await orderModel.createOrderItems(trx, itemsWithOrderId);

      return order;
    });

    return result;
  } catch (error) {
    request.server.log.error(error);
    return reply.status(400).send({ error: error.message });
  }
}

async function getOrder(request, reply) {
  const { id } = request.params;
  const orderModel = new OrderModel(request.server.db);
  
  const order = await orderModel.getOrderById(id);
  if (!order) return reply.status(404).send({ error: 'Order not found' });

  const items = await orderModel.getOrderItems(id);
  return { ...order, items };
}

module.exports = {
  createOrder,
  getOrder
};
