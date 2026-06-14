const fastify = require('fastify')({ logger: true });
const config = require('./config');

// Plugins
fastify.register(require('./plugins/db.plugin'));

// Routes
fastify.register(require('./routes/order.routes'));

const start = async () => {
  try {
    await fastify.listen({ port: config.port });
    fastify.log.info(`Order service listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
