const fastify = require('fastify')({ logger: true });
const config = require('./config');

// Plugins
fastify.register(require('./plugins/db.plugin'));
fastify.register(require('./plugins/rabbitmq.plugin'));

// Routes
fastify.register(require('./routes/payment.routes'));

const start = async () => {
  try {
    await fastify.listen({ port: config.port });
    fastify.log.info(`Payment service listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
