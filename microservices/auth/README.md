# Authentication Service

## 📖 Overview

The **Authentication Service** is responsible for user authentication, identity management, and token issuance.

It owns all authentication-related data and logic and exposes its functionality via **NATS-based RPC (request–reply)**.  
This service is **internal-only** and does not expose HTTP endpoints directly to clients.

---

## 🧠 Responsibilities

- User registration and login
- Credential validation
- JWT generation and verification logic
- Managing authentication-related user data

---

## 🔄 Communication Model

- **Transport:** NATS
- **Pattern:** Request–Reply (RPC)
- **Exposure:** Internal only (no HTTP)

The service listens for authentication-related commands on predefined NATS subjects and replies synchronously with authentication results.


---

## 📡 Commands

| Subject | Description |
|-------|------------|
| `auth.registerUser` | Register a new user |
| `auth.loginUser` | Authenticate a user and issue a JWT |

These subjects define the **public contract** of the Authentication service.

---

## 🗄️ Data Ownership

- **Database:** MongoDB
- **Ownership:** This service exclusively owns authentication and identity data

MongoDB is used to store:
- User credentials
- Authentication metadata
- Identity-related information

---

## 🔐 Security Model

- Credentials are validated exclusively within this service
- JWTs are issued by this service
- The **API Gateway** validates JWTs on incoming HTTP requests
- Downstream services trust authenticated requests forwarded by the gateway

---

## ▶️ Running the Service

### Prerequisites

- Go
- NATS Server
- MongoDB
- Set env variables

### Start the service

```bash
go run main.go
```
