# E-Commerce Microservices Architecture

This project is a robust, scalable e-commerce application built using a microservices architecture. It demonstrates modern backend practices including inter-service communication, asynchronous event processing, database migrations, and caching.

## Architecture Overview

The system is composed of four primary Node.js microservices:
1. **Product Service**: Manages the product catalog. Handles creation, listing, bulk uploads via Excel, and caching.
2. **Order Service**: Manages customer orders. Handles order creation and inventory deduction.
3. **Payment Service**: Processes payments for existing orders.
4. **Worker Service**: A background processor that listens to RabbitMQ queues to handle time-consuming tasks asynchronously.

### Infrastructure Components
- **PostgreSQL**: Centralized relational database.
- **RabbitMQ**: Message broker for asynchronous communication between services.
- **Redis**: In-memory data store used for high-performance caching (e.g., caching the product catalog).

---

## The Queue Mechanism (RabbitMQ)

To ensure the system remains highly responsive and can handle heavy traffic, we use **RabbitMQ** to offload long-running tasks to background workers. 

### How it Works: The Payment Flow Example
1. **Initiation**: A user submits a payment request to the `Payment Service` via the `POST /payments/initiate` endpoint.
2. **Publishing the Event**: Instead of processing the payment synchronously (which would block the HTTP response and make the user wait), the Payment Service immediately returns a "Payment Processing" response to the user. Simultaneously, it **publishes a message** containing the `orderId` to the RabbitMQ queue.
3. **Consuming the Event**: The `Worker Service`, which is constantly listening to the RabbitMQ queue, picks up this message.
4. **Processing**: The worker executes the heavy logic (simulated in this project with a 3-second delay to represent a payment gateway call).
5. **Completion**: Once the payment is verified, the worker updates the database, changing the order status from `PENDING_PAYMENT` to `PAID`. 

This asynchronous queue mechanism provides **fault tolerance** (if the worker crashes, the message stays in the queue until it restarts) and **scalability** (we can spin up multiple worker instances to process payments in parallel).

---

## Setup and Running Instructions

Follow these instructions to start the entire application locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) (v18+) installed.

### Step 1: Start the Infrastructure
We use Docker Compose to spin up the database, Redis cache, and RabbitMQ broker.
Open a terminal in the root `ecommerce-workspace` folder and run:
```bash
docker compose up -d
```
*(Wait a few seconds for the containers to fully initialize).*

### Step 2: Database Setup
Navigate to the `shared-db` folder to install database dependencies and run the schema migrations.
```bash
cd shared-db
npm install
npm run migrate
```

### Step 3: Start the Microservices
You will need to open **4 separate terminal windows**, one for each microservice. For each service, navigate to its folder, install the dependencies, and start the server:

**Terminal 1 (Product Service - Port 3001):**
```bash
cd product-service
npm install
npm start
```

**Terminal 2 (Order Service - Port 3002):**
```bash
cd order-service
npm install
npm start
```

**Terminal 3 (Payment Service - Port 3003):**
```bash
cd payment-service
npm install
npm start
```

**Terminal 4 (Worker Service - Background):**
```bash
cd worker-service
npm install
npm start
```

### Step 4: Testing the APIs
A Postman collection (`ecommerce_postman_collection.json`) is included in the root directory.
1. Open Postman.
2. Click **Import** and select the `ecommerce_postman_collection.json` file.
3. You can now test the complete flow (Create Product -> View Products -> Create Order -> Initiate Payment -> Verify Order).

---

## Assumptions & Limitations
- **Mock Payments**: The payment gateway is simulated with a time delay in the worker service. In a real system, this would interact with Stripe/PayPal webhooks.
- **Authentication**: To keep the focus on core mechanics, user authentication (JWT/Sessions) is omitted. Admin and User routes are separated by URL path rather than middleware.
- **Idempotency**: Basic idempotency is handled via state-checks (e.g., an order cannot be paid twice), but a production system would use dedicated idempotency keys for payment requests.
- **Bulk Uploads**: The Excel upload assumes a specific template format and does not include advanced row-by-row error reporting to the user interface.
