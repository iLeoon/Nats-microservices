# Description
A Microservices project utilizing nats server, nestjs, and golang.



## 📖 Overview


* **NestJs** acts as the gateway and handls the _products_ services.
* **Go** handling _authentication_ and _customers_ services
* **NATS Server** acts as the message broker and asynchronous communication between services.




## 🛠️ Tools
* **Nestjs**
* **Golang**
* **NATS Server**
* **PostgreSQL(northwind)**
* **MongDB and JWT(authentication)**



## 🧩 Service Overview

| Service          | Language | Description                                         |
|-------------------|----------|-----------------------------------------------------|
| **Gateway**       | NestJS   | API Gateway and client proxy for routing requests. |
| **Authentication**| Go       | Handles user authentication.    |
| **Customers**     | Go       | Manages customer data and operations.              |
| **Products**      | NestJS   | Manages products Operations.          |

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
Ensure you have the following installed:
- **Node.js**
- **Go**
- **NATS Server**
- **PostgreSQL**

### Installation
1. Clone the repository
2. Configure environment variables for each service and gateway in the `.env `  files.
3. Code your heart out.

