<div align="center">

<br/>

# ✈️ Airline Booking Backend Platform

### A Production-Grade, Distributed Microservices Ecosystem for Large-Scale Flight Booking Operations

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

<br/>

> *Built to demonstrate mastery of Distributed Systems Design, Microservices Architecture, Asynchronous Event-Driven Patterns, and Production-Grade Backend Engineering at scale.*

</div>

---

## 📖 Executive Summary

This platform is a **fully distributed, cloud-ready Airline Booking Backend** composed of **four independently deployable microservices**, each solving a distinct slice of the business domain. It is engineered from the ground up to solve the hardest problems in large-scale distributed systems: **race conditions, distributed transaction consistency, asynchronous decoupling, centralized security, and automated resource recovery**.

Every architectural decision in this project maps directly to a **real-world engineering tradeoff** — the kind that separates hobby projects from systems that handle thousands of concurrent users.

---

## 🏗️ System Architecture Overview

```
                          ┌─────────────────────────────────────┐
                          │         CLIENT (Web / Mobile)        │
                          └──────────────────┬──────────────────┘
                                             │ Single Unified Port
                          ┌──────────────────▼──────────────────┐
                          │         🛡️  API GATEWAY              │
                          │   Rate Limiting → JWT Auth → RBAC   │
                          │      Reverse Proxy & Routing         │
                          └─────┬─────────────────────┬─────────┘
                                │                     │
               ┌────────────────▼───┐     ┌───────────▼────────────┐
               │  ✈️  FLIGHT SERVICE │     │ 🎫 BOOKING SERVICE     │
               │  Airplanes, Cities │     │ Tickets, Payments,     │
               │  Airports, Flights │     │ Seat Reservation       │
               │  Seat Inventory    │◄────│ Cron Job Cleanup       │
               └────────────────────┘     └────────────┬───────────┘
                                                        │ RabbitMQ
                                          ┌─────────────▼───────────┐
                                          │ 📧 NOTIFICATION SERVICE  │
                                          │ Email Dispatch, Tickets  │
                                          │ Async Queue Consumer     │
                                          └──────────────────────────┘
```

---

## 🧩 The Four Microservices

| Service | Port | Responsibility |
|---|---|---|
| **API Gateway** | `3000` | Single entry point: auth, rate limiting, reverse proxying |
| **Flight Service** | `4000` | Core domain: fleets, airports, cities, flight scheduling |
| **Booking Service** | `5000` | Ticketing, payments, seat reservation, cron-based cleanup |
| **Notification Service** | `3004` | Async email delivery via RabbitMQ queue consumption |

---

## 🚀 Engineering Problems Solved — The Full Breakdown

This is not a CRUD project. Every service was designed to tackle specific, hard engineering problems encountered at scale in real distributed systems.

---

### 1. 🔒 Distributed Race Condition — Preventing Flight Overbooking

**The Problem:** Two users simultaneously try to book the last available seat on a flight. A naive implementation would let both succeed, creating duplicate reservations and a furious customer at the gate.

**The Solution:** A multi-step, cross-service transaction protocol was engineered:

1. The Booking Service opens an **ACID-compliant database transaction** (via Sequelize) and creates the booking record in `INITIATED` state.
2. It makes a **synchronous HTTP call** (via Axios) to the Flight Service requesting a seat decrement.
3. The Flight Service performs the decrement only if seats are available, atomically.
4. If the Flight Service rejects the request (concurrent depletion detected), the Booking Service **immediately rolls back** its transaction.
5. Zero bookings are created for zero available seats — guaranteed.

**Why it matters:** This is the canonical distributed inventory problem. The solution demonstrates understanding of ACID semantics, cross-service coordination, and compensating transactions.

---

### 2. ⚡ Asynchronous Decoupling via Message Broker (Event-Driven Architecture)

**The Problem:** Sending booking confirmation emails inline with the payment API call couples two unrelated systems. SMTP latency directly increases API response time. If the email server is slow or down, your booking API is slow or down.

**The Solution:** Implemented **RabbitMQ** as an asynchronous message broker:

1. The Booking Service publishes a structured event payload to `noti-queue` immediately after confirming payment — no waiting.
2. The Notification Service runs as an **independent consumer** that subscribes to this queue.
3. It processes messages at its own pace, dispatching emails via **Nodemailer**.
4. Using **channel acknowledgment (`channel.ack`)**, a message is only dequeued once processing succeeds — guaranteeing no lost notifications.

**Why it matters:** This is the Publisher-Consumer pattern that powers every modern high-throughput backend — from Amazon order confirmations to Uber ride receipts.

---

### 3. 🔄 Automated State Recovery — Cron-Based Garbage Collection

**The Problem:** Users frequently initiate a booking and abandon it mid-payment. Those seats remain locked in `INITIATED` or `PENDING` state indefinitely. For an airline, empty locked seats equal direct revenue loss.

**The Solution:** A **background Cron Job** (via `node-cron`) was engineered to run automatically every 30 minutes:

1. It queries the database for all bookings stuck in `INITIATED` or `PENDING` for more than 5 minutes.
2. It marks them as `CANCELLED` in a batch update.
3. It fires a **compensating API call** back to the Flight Service to increment the released seats back into the available pool.

This implements the core concept of **eventual consistency** in distributed systems — the system self-heals without manual intervention.

**Why it matters:** Demonstrates understanding of resource lifecycle management, compensating transactions, and the Saga pattern.

---

### 4. 🔁 Saga-Like Distributed Transaction Management

**The Problem:** After a seat is reserved in the Flight Service, the internal payment step in the Booking Service can fail (wrong amount, expired 5-minute window). At this point, the seat is reserved but the booking failed — a split-brain state.

**The Solution:** Engineered a **compensating transaction workflow**:

- On payment failure, the service triggers an explicit seat-restoration call to the Flight Service.
- The Flight Service increments the seat count back, atomically undoing the reservation.
- The booking record is set to `CANCELLED`, ensuring data consistency across both services.

**Why it matters:** This mirrors the **Saga Pattern** used in enterprise microservices (event-driven or orchestration-based) to maintain distributed data consistency without distributed transactions.

---

### 5. 🛡️ Centralized Authentication & RBAC at the Edge (API Gateway Pattern)

**The Problem:** If every microservice implements its own authentication logic, you get massive code duplication, inconsistent security policies, and a nightmare to maintain.

**The Solution:** Authentication and Authorization are **extracted to the API Gateway layer**:

- **JWT (JSON Web Tokens)** — Stateless session management. No server-side session storage required.
- **Bcrypt** — Industry-standard password hashing with salt, making stored credentials computationally infeasible to reverse.
- **Role-Based Access Control (RBAC)** — Custom middleware validates that the authenticated identity carries the required role (`Admin`, `FlightCompany`) before the request is proxied downstream.
- **HTTP Method–Aware Protection** — `GET` (read) requests flow freely; `POST`, `PUT`, `DELETE` (write) requests are paused and routed through the auth pipeline.

Downstream microservices receive only pre-authenticated, pre-authorized requests. They stay lean.

**Why it matters:** This is the exact pattern used at companies like Netflix, Uber, and Airbnb — a dedicated edge service owns security so domain services own only business logic.

---

### 6. 🚦 DDoS Protection & Traffic Control (Rate Limiting)

**The Problem:** Without traffic controls, a single malicious client can brute-force the login endpoint, exhaust server resources, and take down the entire platform.

**The Solution:** Configured `express-rate-limit` at the gateway layer:

- Hard limit: **30 requests per 2 minutes per IP address**.
- Violations are terminated before they reach any downstream service.
- Shields all microservices from volumetric attacks without any changes to service code.

---

### 7. 🗄️ Schema Versioning & Deterministic Database Management

**The Problem:** As a system evolves, untracked database schema changes cause environment drift. A schema working in development silently breaks in production.

**The Solution:** Full adoption of **Sequelize Migrations and Seeders**:

- Migrations serve as a git history for the database schema — every structural change is version-controlled, reversible, and auditable.
- Seeders provide deterministic baseline data (e.g., roles like `Admin`, `FlightCompany`) for every environment.
- Schema can be reliably rolled forward or backward: `db:migrate` / `db:migrate:undo`.

**Why it matters:** This is how professional teams maintain schema consistency across Dev, Staging, and Production environments in CI/CD pipelines.

---

### 8. 🏛️ N-Tier Layered Architecture & SOLID/DRY Principles

**The Problem:** Monolithic, tightly-coupled code where routing logic, business rules, and raw SQL live in the same file becomes unmaintainable at scale.

**The Solution:** Every service strictly follows an **N-Tier Layered Architecture**:

```
Client Request
    ↓
Routes          → Maps HTTP endpoints to controller handlers
    ↓
Middlewares     → Validates input, enforces auth — early exit on errors
    ↓
Controllers     → Parses HTTP context, orchestrates service calls
    ↓
Services        → Pure business logic, domain invariants, cross-service calls
    ↓
Repositories    → Database abstraction layer, all ORM queries isolated here
    ↓
Models          → Sequelize schema definitions, associations, constraints
```

Additionally, a **Generic `CrudRepository` base class** was implemented. All entity-specific repositories (`FlightRepository`, `BookingRepository`, `TicketRepository`) extend it, inheriting `create`, `get`, `getAll`, `update`, and `destroy` for free. No repeated boilerplate — pure DRY.

---

### 9. 📧 Fault-Tolerant Notification Delivery

**The Problem:** What if the email server crashes after a message is consumed from the queue? The notification is lost forever, and a paying customer never receives their booking confirmation.

**The Solution:** A dual-layer fault tolerance mechanism:

1. **Database-Backed State Tracking** — Every notification is persisted as a `Ticket` record with a lifecycle (`PENDING` → `SUCCESS` / `FAILED`). Even if the process crashes, state is preserved.
2. **RabbitMQ Manual Acknowledgment** — `channel.ack()` is called only after successful email dispatch. An unacknowledged message stays in the queue and is redelivered on service restart.
3. **Cron-Based Retry** — A background job periodically polls for `PENDING` tickets and retries failed dispatches.

---

### 10. 📊 Structured Logging & Observability

**The Problem:** `console.log` debugging in production provides zero context — no timestamps, no log levels, no persistence.

**The Solution:** **Winston** was configured across all four services with:

- Log levels (`info`, `warn`, `error`) for filtering in production.
- Timestamped, structured output for log aggregation tools.
- Configurable transports for writing to files alongside stdout.

---

## 🗄️ Relational Database Design (ERD Highlights)

The Flight Service manages a normalized relational schema with proper cascading constraints:

| Relationship | Cardinality | Detail |
|---|---|---|
| City → Airport | `1 : N` | One city can have multiple airports (e.g., Delhi: IGI, Hindon) |
| Airplane → Seat | `1 : N` | Each airplane has a dynamically generated seat map by class |
| Airplane → Flight | `1 : N` | One airplane can be scheduled across multiple flights |
| Airport → Flight | `1 : N (×2)` | Flights hold two airport FK references: departure + arrival, aliased |
| User → Role | `M : N` | Junction table `user_roles` maps users to multiple roles |

Cascade rules (`ON DELETE CASCADE`) ensure referential integrity is never violated.

---

## 📦 Complete Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js | High-performance, event-driven JavaScript runtime |
| **Framework** | Express.js (v5) | RESTful API routing and middleware pipeline |
| **Database** | MySQL 2 | Relational data persistence |
| **ORM** | Sequelize | Schema modeling, associations, query building |
| **Migrations** | Sequelize CLI | Database schema version control |
| **Auth** | JWT + Bcrypt | Stateless sessions + password hashing |
| **Proxy** | http-proxy-middleware | API Gateway reverse proxying |
| **Rate Limiting** | express-rate-limit | DDoS protection and traffic throttling |
| **Message Broker** | RabbitMQ (amqplib) | Async event-driven service decoupling |
| **Email** | Nodemailer | SMTP-based transactional email delivery |
| **Background Jobs** | node-cron | Scheduled polling and automated cleanup |
| **Inter-service** | Axios | Synchronous HTTP calls between microservices |
| **Logging** | Winston | Structured, leveled, persistent logging |
| **Config** | dotenv | 12-factor app environment management |
| **HTTP Codes** | http-status-codes | Semantic, readable HTTP status management |

---

## 📁 Unified Folder Structure (All Services)

Each service follows the same layered structure for consistency and navigability:

```text
src/
 ├── config/          # Server, logger (Winston), DB, RabbitMQ, Nodemailer configs
 ├── routes/          # URI-to-controller mappings, versioned (v1)
 ├── middlewares/     # Input validation, JWT verification, RBAC guards
 ├── controllers/     # HTTP request/response orchestration
 ├── services/        # Core business logic, domain rules, cross-service calls
 ├── repositories/    # CrudRepository base + entity-specific DB access layer
 ├── models/          # Sequelize schemas, constraints, and associations
 ├── migrations/      # Versioned database schema timeline
 ├── seeders/         # Deterministic baseline data population
 └── utils/           # AppError, SuccessResponse, ErrorResponse, Enums, Cron Jobs
```

---

## ⚙️ Local Development Setup

### Prerequisites

Ensure the following are installed and running before proceeding:

- **Node.js** (v14+)
- **MySQL** server
- **RabbitMQ** server (`amqp://localhost` or via Docker)

### Step 1 — Clone All Services

```bash
git clone <api-gateway-repo-url>       && cd api-gateway       && npm install && cd ..
git clone <flight-service-repo-url>    && cd flight-service    && npm install && cd ..
git clone <booking-service-repo-url>   && cd booking-service   && npm install && cd ..
git clone <notification-service-repo-url> && cd notification-service && npm install && cd ..
```

### Step 2 — Configure Environment Variables

Create a `.env` file in each service root:

**API Gateway** (`port 3000`):
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=1d
FLIGHT_SERVICE=http://localhost:4000
BOOKING_SERVICE=http://localhost:5000
```

**Flight Service** (`port 4000`):
```env
PORT=4000
```

**Booking Service** (`port 5000`):
```env
PORT=5000
FLIGHT_SERVICE_PATH=http://localhost:4000
RABBITMQ_URL=amqp://localhost
```

**Notification Service** (`port 3004`):
```env
PORT=3004
MAIL_ID=your_email@gmail.com
MAIL_PASS=your_app_password
```

> For all services, update `src/config/config.json` with your MySQL credentials (`username`, `password`, `database`, `dialect: mysql`).

### Step 3 — Initialize All Databases

Run for each service that has a database (Flight, Booking, API Gateway, Notification):

```bash
npx sequelize db:create
npx sequelize db:migrate
npx sequelize db:seed:all   # where seeders exist
```

### Step 4 — Start All Services

Boot in separate terminal tabs, in this order:

```bash
# Terminal 1 — Flight Service
cd flight-service && npm run dev

# Terminal 2 — Booking Service
cd booking-service && npm run dev

# Terminal 3 — Notification Service
cd notification-service && npm run dev

# Terminal 4 — API Gateway (start last)
cd api-gateway && npm run dev
```

All client traffic goes through `http://localhost:3000`.

---

## 🌐 API Reference (via Gateway)

All routes are accessed through the API Gateway on port `3000`.

### ✈️ Fleet Management
| Method | Endpoint | Auth Required |
|---|---|---|
| `GET` | `/flightService/api/v1/airplanes` | No |
| `POST` | `/flightService/api/v1/airplanes` | Yes (Admin) |
| `PATCH` | `/flightService/api/v1/airplanes/:id` | Yes (Admin) |
| `DELETE` | `/flightService/api/v1/airplanes/:id` | Yes (Admin) |

### 🏙️ Cities & Airports
| Method | Endpoint | Auth Required |
|---|---|---|
| `GET` | `/flightService/api/v1/cities` | No |
| `POST` | `/flightService/api/v1/cities` | Yes (Admin) |
| `GET` | `/flightService/api/v1/airports` | No |
| `POST` | `/flightService/api/v1/airports` | Yes (Admin) |

### 🕒 Flight Scheduling
| Method | Endpoint | Auth Required |
|---|---|---|
| `GET` | `/flightService/api/v1/flights` | No |
| `POST` | `/flightService/api/v1/flights` | Yes (FlightCompany) |

### 🎫 Booking & Payments
| Method | Endpoint | Auth Required |
|---|---|---|
| `POST` | `/bookingService/api/v1/bookings` | Yes |
| `POST` | `/bookingService/api/v1/bookings/payments` | Yes |

### 👤 Auth (Gateway)
| Method | Endpoint | Auth Required |
|---|---|---|
| `POST` | `/api/v1/register` | No |
| `POST` | `/api/v1/login` | No |
| `POST` | `/api/v1/roles` | Yes (Admin) |

---

## 🔮 Future Enhancements

The architecture is designed for evolution. Identified next steps:

- **Redis Caching** — Distributed cache for seat availability to eliminate redundant cross-service network hops on read-heavy endpoints.
- **Circuit Breaker Pattern** — Wrapping cross-service Axios calls with a circuit breaker (e.g., `opossum`) to gracefully handle downstream service failures without cascading.
- **Kubernetes Orchestration** — Horizontal pod autoscaling for the RabbitMQ consumer workers to handle surge traffic during booking windows.
- **Distributed Tracing** — Implementing OpenTelemetry to trace requests as they flow across all four services.
- **API Versioning** — Extending route namespacing (`/v2`) to support non-breaking evolution of the public API contract.

---

## 🧠 Core Engineering Concepts Demonstrated

| Concept | Where Applied |
|---|---|
| Microservices Architecture | All 4 services independently deployable |
| API Gateway Pattern | API Gateway service |
| Event-Driven Architecture | RabbitMQ between Booking & Notification |
| Saga / Compensating Transactions | Booking ↔ Flight cross-service rollbacks |
| ACID Transactions | Sequelize transactions in Booking Service |
| Distributed Race Condition Prevention | Concurrent seat booking guard |
| RBAC & JWT Auth | API Gateway middlewares |
| Cron-Based Resource Cleanup | Booking Service & Notification Service |
| Repository Pattern + DRY OOP | Generic `CrudRepository` across all services |
| N-Tier Layered Architecture | Strict separation in all 4 services |
| Database Schema Versioning | Sequelize Migrations & Seeders |
| Structured Logging | Winston across all services |
| Rate Limiting / DDoS Protection | express-rate-limit at Gateway |
| Reverse Proxy | http-proxy-middleware at Gateway |
| Fault-Tolerant Messaging | RabbitMQ message acknowledgment |
| Standardized API Responses | `SuccessResponse` / `ErrorResponse` wrappers |
| 12-Factor App Config | dotenv across all services |

---

<div align="center">

*Engineered with a deep focus on distributed systems design, backend scalability, and production-grade software architecture.*

**Built for scale. Designed to last.**

</div>