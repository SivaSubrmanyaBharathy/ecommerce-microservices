const fp = require('fastify-plugin');
const knex = require('knex');
const config = require('../config');

async function dbPlugin(fastify, options) {
  const db = knex({
    client: 'pg',
    connection: config.db
  });

  fastify.decorate('db', db);

  fastify.addHook('onClose', async (instance) => {
    await instance.db.destroy();
  });
}

module.exports = fp(dbPlugin);
