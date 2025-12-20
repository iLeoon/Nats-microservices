# 📦 Microservices Architecture with NestJS, Go, and NATS

## 📖 Overview

This project implements a **microservices architecture** with a **central HTTP gateway** and **NATS-based internal service communication**.

- **NestJS** is used as an **API Gateway / BFF**, exposing HTTP endpoints and translating requests into internal commands.
- **Go services** handle core business domains such as **authentication** and **customers**, each owning its own data and logic.
- **NATS** is used as an **internal messaging transport**, primarily for **synchronous request–reply (RPC)** communication between services.

The system is designed with clear service boundaries, independent deployments, and the flexibility to evolve toward asynchronous, event-driven patterns in the future.

---

## 🧠 Architecture Summary

- **External communication:** HTTP  
- **Internal communication:** NATS (request–reply / RPC)  
- **Service ownership:** Each service owns its own data and business logic  
- **Authentication:** Handled at the gateway level using JWT  

> ⚠️ Note  
> This project currently uses **RPC-style communication over NATS**, not a full event-driven architecture.

---

## 🛠️ Tech Stack

- **NestJS** — API Gateway & Products service  
- **Golang** — Authentication & Customers services  
- **NATS Server** — Internal RPC transport (command bus)  
- **PostgreSQL (Northwind)** — Relational data storage  
- **MongoDB** — Authentication-related data  
- **JWT** — Authentication & authorization  

---

## 🧩 Services Overview

| Service            | Language | Responsibility |
|--------------------|----------|----------------|
| **Gateway**        | NestJS   | HTTP entry point, JWT validation, request routing, and translation to NATS RPC |
| **Authentication** | Go       | User authentication and identity management |
| **Customers**      | Go       | Customer data and operations |
| **Products**       | NestJS   | Product management and operations |

---

## 🔄 Communication Model

### External (Client → System)
- Clients communicate with the system via **HTTP**
- The gateway handles:
  - Authentication (JWT)
  - Routing
  - Request validation

### Internal (Service → Service)
- Services communicate via **NATS request–reply (RPC)**
- Each request:
  - Is handled by exactly one service
  - Returns a response or error
- No direct HTTP calls between services

This approach keeps services decoupled from transport details while maintaining synchronous control flow where needed.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**
- **Go**
- **NATS Server**
- **PostgreSQL**
- **MongoDB**

---

### Installation

1. Clone the repository  
2. Configure environment variables for each service and the gateway using `.env` files  
3. Start required infrastructure (databases, NATS)  
4. Run services individually  

---

## 📌 Notes on Architecture

- No shared databases between services  
- NATS is used as a **command bus**, not as a public gateway  
- Services are independently deployable and scalable  




