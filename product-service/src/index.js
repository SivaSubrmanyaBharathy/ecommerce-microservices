const fastify = require('fastify')({ logger: true });
const multipart = require('@fastify/multipart');
const config = require('./config');

// Plugins
fastify.register(multipart);
fastify.register(require('./plugins/db.plugin'));
fastify.register(require('./plugins/redis.plugin'));
fastify.register(require('./plugins/rabbitmq.plugin'));

// Routes
fastify.register(require('./routes/product.routes'));

const start = async () => {
  try {
    await fastify.listen({ port: config.port });
    fastify.log.info(`Product service listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
