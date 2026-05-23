# ✈️ Airplane Notification & Email Service

A robust, highly scalable, and fully decoupled microservice dedicated to handling notifications, email alerts, and background job processing for an Airline Booking System. This service ensures that critical real-time alerts (like booking confirmations and cancellations) are delivered efficiently without bringing down the performance of the main application.

---

## 🚀 Tech Stack

- **Backend Framework**: Node.js, Express.js
- **Message Broker / Queue**: RabbitMQ (AMQP)
- **Database**: MySQL
- **ORM**: Sequelize (with Migrations & Seeders)
- **Task Scheduling**: Node-Cron
- **Email Client**: Nodemailer
- **Logging**: Winston
- **Architecture**: N-Tier Architecture (Controller - Service - Repository Pattern)

---

## 🧠 Engineering Problems Solved

This project wasn't just built to send emails; it was engineered to solve real-world system design and scalability challenges commonly encountered in large-scale distributed systems:

### 1. Asynchronous Decoupling via Message Queues (RabbitMQ)
* **The Problem:** Sending out booking confirmation emails synchronously during the flight booking API call tightly couples the services. Network latency with SMTP servers causes the main API thread to block, drastically increasing response times for the end client.
* **The Solution:** Implemented **RabbitMQ** to fully decouple email dispatching from the main server. The core booking service simply publishes a payload to the `noti-queue`. This microservice independently consumes the queue and processes the email in the background. **Result:** API latency is massively reduced, and both services can scale horizontally independent of one another.

### 2. Fault Tolerance & State Recovery
* **The Problem:** What happens if the email server is temporarily down, or the notification service crashes in the middle of processing? Losing a payment confirmation notification is unacceptable.
* **The Solution:** 
  - Maintained a `Ticket` table in the MySQL database to track the exact lifecycle of every notification (`PENDING`, `SUCCESS`, `FAILED`).
  - Utilized **Message Acknowledgment (`channel.ack`)** in RabbitMQ. A message is only dequeued once it is successfully parsed and dispatched.
  - If a failure occurs, the ticket remains in the `PENDING` state, serving as a reliable fallback for our background workers.

### 3. Automated Background Processing (Cron Jobs)
* **The Problem:** The system needs a way to periodically sweep for anomalies—like retrying pending failed emails or cleaning up expired, unconfirmed bookings automatically, without manual intervention.
* **The Solution:** Integrated `node-cron` to execute recurring background processes. This guarantees that background operations (like polling the `TicketRepository` for pending states every N minutes) run reliably, maintaining the system's eventual consistency.

### 4. Enterprise-Grade Separation of Concerns
* **The Problem:** Monolithic codebases where raw SQL queries, business logic, and HTTP request handling coexist in the same file become impossible to maintain or test.
* **The Solution:** Adopted a strict **Repository Pattern** and **Layered Architecture**:
  - **Routes & Middlewares:** Handle intercepting and validating requests.
  - **Controllers:** Manage formatting of request/response lifecycles.
  - **Services:** Isolate pure business rules (e.g., `EmailService`).
  - **Repositories:** Centralize all Data Access and ORM interaction logic (`TicketRepository`, `CrudRepository`).

### 5. Standardized Error Handling & Unified Logging
* **The Problem:** Inconsistent API responses and console.log debugging make production issues a nightmare to trace.
* **The Solution:** 
  - Built generic wrapper classes (`SuccessResponse`, `ErrorResponse`, `AppError`) to guarantee uniform API responses across the board.
  - Replaced native console logs with **Winston**, allowing for granular log levels, timestamping, and persisting logs to external files when necessary.

---

## 📁 Project Structure

```text
src/
 ├── config/          # Configurations for Server, Logger, Database, and Nodemailer
 ├── controllers/     # Request/Response formatting & Route handlers
 ├── middlewares/     # Request interceptors & validators 
 ├── migrations/      # DB Schema version control
 ├── models/          # Sequelize JS Models (Ticket)
 ├── repositories/    # Database interaction logic (CrudRepository, TicketRepository)
 ├── routes/          # API Route definitions mapping to controllers
 ├── services/        # Core business logic (EmailService)
 └── utils/           # Helper classes, Error handling, Cron Jobs definitions
```

---

## 🛠️ Local Setup & Installation

Follow these steps to get the microservice running on your local machine:

### 1. Prerequisites 
- **Node.js** (v14 or higher)
- **MySQL** Server installed and running
- **RabbitMQ** Server installed and running locally (`amqp://localhost`)

### 2. Clone the Repository
```bash
git clone <repository-url>
cd airplanenoticeservice
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```env
PORT=3004
# Add your database configurations and email credentials here
# MAIL_ID=your_email@gmail.com
# MAIL_PASS=your_app_password
```

### 5. Database Configuration & Setup
Update the `src/config/config.json` file with your MySQL `username`, `password`, and `database` name. Then run:

```bash
# Initialize the database structures
npx sequelize db:create
npx sequelize db:migrate
```

### 6. Run the Service
```bash
# Runs the server using nodemon for hot-reloading
npm run dev
```

If everything is configured correctly, your terminal should display:
```
Successfully started the server on PORT: 3004
queue connected successfully
```

---

## 🎯 Final Thoughts

This microservice acts as the backbone communication layer of the airline ecosystem. It demonstrates a clear understanding of **Event-Driven Architecture**, **Asynchronous Workflows**, **Database Design**, and writing clean, scalable Node.js code intended for high-availability environments. 

*Designed and engineered with passion.*
