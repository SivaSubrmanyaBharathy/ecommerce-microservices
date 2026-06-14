const ExcelJS = require('exceljs');
const db = require('../services/db');
const redisClient = require('../services/redis');
const { UPLOAD_STATUS, REDIS } = require('../config/constants');

async function processExcelUpload(uploadId, channel, msg) {
  try {
    const upload = await db('bulk_uploads').where({ id: uploadId }).first();
    if (!upload || upload.status !== UPLOAD_STATUS.PENDING) {
      console.log(`Upload ${uploadId} not found or already processed`);
      channel.ack(msg);
      return;
    }

    await db('bulk_uploads').where({ id: uploadId }).update({ status: UPLOAD_STATUS.PROCESSING });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(upload.file_path);
    const worksheet = workbook.getWorksheet(1);

    const rowsToInsert = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const [ , sku, name, price, stock, isActive ] = row.values;
      rowsToInsert.push({
        sku,
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        is_active: isActive === undefined ? true : Boolean(isActive)
      });
    });

    if (rowsToInsert.length > 0) {
      await db('products').insert(rowsToInsert).onConflict('sku').merge();
      if (redisClient.isReady) {
        await redisClient.del(REDIS.PRODUCT_LIST_KEY);
      }
    }

    await db('bulk_uploads').where({ id: uploadId }).update({ status: UPLOAD_STATUS.COMPLETED });
    console.log(`Upload ${uploadId} processed successfully. Inserted/Updated ${rowsToInsert.length} products.`);
    channel.ack(msg);
  } catch (error) {
    console.error(`Error processing upload ${uploadId}:`, error);
    await db('bulk_uploads').where({ id: uploadId }).update({ status: UPLOAD_STATUS.FAILED });
    channel.ack(msg);
  }
}

module.exports = {
  processExcelUpload
};
