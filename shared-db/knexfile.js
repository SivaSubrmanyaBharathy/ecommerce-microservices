module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'password',
      database: 'ecommercedb'
    },
    migrations: {
      directory: './migrations'
    }
  }
};
