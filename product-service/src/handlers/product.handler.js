const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const ProductModel = require('../models/product.model');
const { ensureDirectoryExists, saveFileStream } = require('../utils/file.utils');
const { RABBITMQ, REDIS, UPLOAD_STATUS } = require('../config/constants');

async function uploadBulkProducts(request, reply) {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, message: 'No file uploaded' });
    }

    const tmpDir = path.join(__dirname, '../../tmp');
    ensureDirectoryExists(tmpDir);

    const filename = `${Date.now()}-${data.filename}`;
    const filePath = path.join(tmpDir, filename);
    
    await saveFileStream(data.file, filePath);

    const productModel = new ProductModel(request.server.db);
    const upload = await productModel.createBulkUploadRecord(filePath, UPLOAD_STATUS.PENDING);

    // Publish to RabbitMQ
    if (request.server.rabbitmq && request.server.rabbitmq.channel) {
      request.server.rabbitmq.channel.sendToQueue(
        RABBITMQ.PRODUCT_UPLOAD_QUEUE,
        Buffer.from(JSON.stringify({ uploadId: upload.id }))
      );
    } else {
      request.server.log.warn('RabbitMQ channel not available to publish message');
    }

    return reply.status(202).send({ 
      success: true, 
      message: 'Upload received and queued for processing successfully', 
      data: { uploadId: upload.id } 
    });
  } catch (error) {
    request.server.log.error(error);
    return reply.status(500).send({ success: false, message: 'Internal server error during bulk upload' });
  }
}

async function createProduct(request, reply) {
  try {
    const { sku, name, price, stock } = request.body;
    const productModel = new ProductModel(request.server.db);
    
    const product = await productModel.createProduct(sku, name, price, stock);
    
    // Clear redis cache
    if (request.server.redis) {
      await request.server.redis.del(REDIS.PRODUCT_LIST_KEY);
    }

    return reply.status(201).send({ 
      success: true, 
      message: 'Product created successfully', 
      data: product 
    });
  } catch (error) {
    request.server.log.error(error);
    if (error.code === '23505') { // Postgres unique violation (e.g. SKU already exists)
      return reply.status(400).send({ success: false, message: 'Product with this SKU already exists' });
    }
    return reply.status(500).send({ success: false, message: 'Internal server error during product creation' });
  }
}

async function getProducts(request, reply) {
  try {
    if (request.server.redis) {
      const cachedProducts = await request.server.redis.get(REDIS.PRODUCT_LIST_KEY);
      if (cachedProducts) {
        return reply.status(200).send({ 
          success: true, 
          message: 'Products retrieved successfully (from cache)', 
          data: JSON.parse(cachedProducts) 
        });
      }
    }

    const productModel = new ProductModel(request.server.db);
    const products = await productModel.getActiveProducts();
    
    if (request.server.redis) {
      await request.server.redis.setEx(REDIS.PRODUCT_LIST_KEY, REDIS.CACHE_EXPIRY, JSON.stringify(products));
    }

    return reply.status(200).send({ 
      success: true, 
      message: 'Products retrieved successfully', 
      data: products 
    });
  } catch (error) {
    request.server.log.error(error);
    return reply.status(500).send({ success: false, message: 'Internal server error while fetching products' });
  }
}

async function downloadTemplate(request, reply) {
  try {
    const productModel = new ProductModel(request.server.db);
    const templateLocalPath = await productModel.getTemplatePath('product_excel_template');
    
    if (!templateLocalPath) {
      return reply.status(404).send({ success: false, message: 'Template path not configured in database' });
    }

    const fullPath = path.join(__dirname, '../../', templateLocalPath);
    
    // Check if file exists, if not generate it
    if (!fs.existsSync(fullPath)) {
      ensureDirectoryExists(path.dirname(fullPath));
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Products');
      sheet.columns = [
        { header: 'sku', key: 'sku', width: 15 },
        { header: 'name', key: 'name', width: 30 },
        { header: 'price', key: 'price', width: 15 },
        { header: 'stock', key: 'stock', width: 10 },
        { header: 'isActive', key: 'isActive', width: 10 }
      ];
      
      // Style the header row
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' } // Orange color
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text looks better on orange
      });
      
      await workbook.xlsx.writeFile(fullPath);
    }

    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="product_template.xlsx"');
    
    return reply.send(fs.createReadStream(fullPath));
  } catch (error) {
    request.server.log.error(error);
    return reply.status(500).send({ success: false, message: 'Internal server error while generating template' });
  }
}

async function deactivateProduct(request, reply) {
  try {
    const { id } = request.params;
    const productModel = new ProductModel(request.server.db);
    
    const product = await productModel.deactivateProduct(id);
    
    if (!product) {
      return reply.status(404).send({ success: false, message: 'Product not found' });
    }

    // Clear redis cache since product list changed
    if (request.server.redis) {
      await request.server.redis.del(REDIS.PRODUCT_LIST_KEY);
    }

    return reply.status(200).send({ 
      success: true, 
      message: 'Product deactivated successfully', 
      data: product 
    });
  } catch (error) {
    request.server.log.error(error);
    return reply.status(500).send({ success: false, message: 'Internal server error while deactivating product' });
  }
}

module.exports = {
  uploadBulkProducts,
  createProduct,
  getProducts,
  downloadTemplate,
  deactivateProduct
};
