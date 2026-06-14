exports.up = function(knex) {
  return knex.schema.createTable('document_templates', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('file_path').notNullable();
    table.timestamps(true, true);
  }).then(() => {
    return knex('document_templates').insert({
      name: 'product_excel_template',
      file_path: 'tmp/product_template.xlsx'
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('document_templates');
};
