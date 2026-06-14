module.exports = {
  RABBITMQ: {
    PRODUCT_UPLOAD_QUEUE: 'product-bulk-upload-queue',
    PAYMENT_PROCESSING_QUEUE: 'payment-processing-queue'
  },
  UPLOAD_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  },
  PAYMENT_STATUS: {
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED'
  },
  ORDER_STATUS: {
    PAID: 'PAID',
    PAYMENT_FAILED: 'PAYMENT_FAILED'
  },
  REDIS: {
    PRODUCT_LIST_KEY: 'products:list'
  }
};
