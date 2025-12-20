# Products Service

## 📖 Overview

The **Products Service** is responsible for managing product data and product-related business operations.

It owns all product persistence and logic and exposes its capabilities via **NATS-based RPC (request–reply)**.  
This service is **internal-only** and does not expose HTTP endpoints directly to clients.

---

## 🧠 Responsibilities

- Manage product data (CRUD operations)
- Enforce product-related business rules
- Act as the single source of truth for products

---

## 🔄 Communication Model

- **Transport:** NATS
- **Pattern:** Request–Reply (RPC)
- **Exposure:** Internal only (no HTTP)

This service listens for commands on predefined NATS subjects and replies synchronously with results or errors.



---

## 📡 Commands

| Subject | Description |
|-------|------------|
| `products.findAllProducts` | Retrieve all products |
| `products.findOneProduct` | Retrieve a product by ID |
| `products.createProduct'` | Create a new product |
| `products.updateProduct` | Update an existing product |

These subjects define the **public contract** of the Products service.

---

## 🗄️ Data Ownership

- **Database:** PostgreSQL (Northwind schema)
- **Ownership:** This service exclusively owns the `products` data

---



## ▶️ Running the Service

### Prerequisites
- Node.js
- NATS Server
- PostgreSQL
- Set env variables

### Start the service

```bash
yarn install
yarn run start:dev
```

