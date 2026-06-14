class ProductModel {
  constructor(db) {
    this.db = db;
  }

  async createBulkUploadRecord(filePath, status) {
    const [upload] = await this.db('bulk_uploads').insert({
      file_path: filePath,
      status: status
    }).returning('*');
    return upload;
  }

  async createProduct(sku, name, price, stock) {
    const [product] = await this.db('products').insert({
      sku,
      name,
      price,
      stock
    }).returning('*');
    return product;
  }

  async getActiveProducts() {
    return this.db('products').where('is_active', true);
  }

  async deactivateProduct(id) {
    const [product] = await this.db('products')
      .where({ id })
      .update({ is_active: false })
      .returning('*');
    return product;
  }

  async getTemplatePath(name) {
    const template = await this.db('document_templates').where('name', name).first();
    return template ? template.file_path : null;
  }
}

module.exports = ProductModel;
