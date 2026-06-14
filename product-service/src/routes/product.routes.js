const productHandler = require('../handlers/product.handler');

async function productRoutes(fastify, options) {
  fastify.post('/admin/products/bulk', productHandler.uploadBulkProducts);
  fastify.post('/admin/products', productHandler.createProduct);
  fastify.patch('/admin/products/:id/deactivate', productHandler.deactivateProduct);
  fastify.get('/products', productHandler.getProducts);
  fastify.get('/admin/products/template', productHandler.downloadTemplate);
}

module.exports = productRoutes;
