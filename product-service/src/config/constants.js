module.exports = {
  RABBITMQ: {
    PRODUCT_UPLOAD_QUEUE: 'product-bulk-upload-queue'
  },
  REDIS: {
    PRODUCT_LIST_KEY: 'products:list',
    CACHE_EXPIRY: 60
  },
  UPLOAD_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  }
};
