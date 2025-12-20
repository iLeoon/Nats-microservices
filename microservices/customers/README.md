# Customers Service

## 📖 Overview

The **Customers Service** is a core microservice responsible for managing customer data and related business operations.

It owns all customer-related persistence and logic and exposes its functionality via **NATS-based RPC (request–reply)**.  
This service does **not** expose HTTP endpoints and is not directly accessible by clients.

---

## 🧠 Responsibilities

- Manage customer data (CRUD operations)
- Enforce customer-related business rules
- Act as the single source of truth for customers

---

## 🔄 Communication Model

- **Transport:** NATS
- **Pattern:** Request–Reply (RPC)
- **Exposure:** Internal only (no HTTP)

This service listens for commands on specific NATS subjects and replies with results or errors.

---

## 📡 Commands

| Subject | Description |
|-------|------------|
| `customers.findCustomers` | Retrieve all customers |
| `customers.findCustomer` | Retrieve a customer by ID |
| `customers.createCustomer` | Create a new customer |
| `customers.updateCustomer` | Update an existing customer |

These subjects form the **public contract** of the Customers service.

---

## 🗄️ Data Ownership

- **Database:** PostgreSQL (Northwind schema)
- **Ownership:** This service exclusively owns the `customers` data

---



## ▶️ Running the Service

### Prerequisites
- Go
- NATS Server
- PostgreSQL
- Set the env variables

### Start the service

```bash
go run main.go
```


