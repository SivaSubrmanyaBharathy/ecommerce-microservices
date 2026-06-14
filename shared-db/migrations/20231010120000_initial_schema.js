exports.up = function(knex) {
  return knex.schema
    .createTable('products', table => {
      table.increments('id').primary();
      table.string('sku').notNullable().unique();
      table.string('name').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('stock').notNullable().defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('orders', table => {
      table.increments('id').primary();
      table.decimal('total_amount', 10, 2).notNullable();
      table.enum('status', ['PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAID', 'PAYMENT_FAILED', 'CANCELLED']).notNullable().defaultTo('PENDING_PAYMENT');
      table.timestamps(true, true);
    })
    .createTable('order_items', table => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('RESTRICT');
      table.integer('quantity').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.timestamps(true, true);
    })
    .createTable('payments', table => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
      table.enum('status', ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED']).notNullable().defaultTo('PENDING');
      table.string('razorpay_order_id');
      table.string('razorpay_payment_id');
      table.integer('attempt_count').defaultTo(0);
      table.timestamps(true, true);
    })
    .createTable('bulk_uploads', table => {
      table.increments('id').primary();
      table.string('file_path').notNullable();
      table.enum('status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).notNullable().defaultTo('PENDING');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('bulk_uploads')
    .dropTableIfExists('payments')
    .dropTableIfExists('order_items')
    .dropTableIfExists('orders')
    .dropTableIfExists('products');
};
