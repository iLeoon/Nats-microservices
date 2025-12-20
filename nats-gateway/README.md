# API Gateway (NATS Gateway)

## 📖 Overview

The **API Gateway** is the single entry point to the system.  
It exposes **HTTP APIs** to clients and translates incoming requests into **NATS-based RPC commands** for internal microservices.

This service acts as a **BFF (Backend for Frontend)** and is responsible for request validation, authentication, and routing.

---

## 🧠 Responsibilities

- Expose HTTP endpoints to external clients
- Validate and authorize requests using JWT
- Translate HTTP requests into NATS RPC commands
- Receive NATS replies and map them back to HTTP responses
- Act as the only public-facing service

---

## 🔄 Communication Model

### External Communication
- **Protocol:** HTTP
- **Clients:** Browsers, REST clients, frontend applications

### Internal Communication
- **Transport:** NATS
- **Pattern:** Request–Reply (RPC)

The gateway does **not** contain business logic.  
It delegates all domain operations to internal services via NATS.

---

## 🧩 Routing Model

Client
↓ HTTP
API Gateway (NestJS)
↓ NATS RPC
Internal Services


Examples:
- `GET /customers/findAll` → `customers.findCustomers`
- `POST /products/create` → `products.createProduct`
- `POST /auth/login` → `auth.loginUser`

---

## 🔐 Security Model

- JWTs are issued by the **Authentication Service**
- The gateway:
  - Validates JWTs on incoming HTTP requests
  - Rejects unauthenticated or unauthorized requests
- Downstream services trust requests forwarded by the gateway

Authentication and authorization are **centralized here**.

---

## 📡 Internal Dependencies

The gateway communicates with the following services via NATS:

- **Authentication Service**
- **Customers Service**
- **Products Service**



---

## ▶️ Running the Service

### Prerequisites

- Node.js
- NATS Server
- All dependent services running (Auth, Customers, Products)
- Set env variables

### Start the gateway

```bash
yarn install
yarn start:dev
```
