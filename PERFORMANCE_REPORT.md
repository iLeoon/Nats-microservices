# Performance & Optimization Report
## NATS Microservices System

---

## 1. System Under Test

A polyglot microservices architecture composed of:

| Component | Technology | Role |
|---|---|---|
| API Gateway | NestJS + Express | HTTP entry point, JWT auth, NATS proxy |
| Auth Service | Go + MongoDB | User registration & login, JWT issuance |
| Customers Service | Go + PostgreSQL | Customer CRUD |
| Products Service | NestJS + TypeORM + PostgreSQL | Product CRUD |
| Message Broker | NATS Server | Async request-reply between gateway and services |

All services communicate exclusively over NATS. The gateway translates HTTP → NATS → HTTP.

---

## 2. Test Methodology

Tests were run with **k6** in three progressive stages:

| Stage | VUs | Duration | Purpose |
|---|---|---|---|
| Smoke | 1 VU | 1 iteration | Verify every endpoint works end-to-end |
| Load | 10 → 30 → 50 VUs | 6m 30s | Measure normal operating performance |
| Stress | 0 → 100 → 200 VUs | 7 min | Find breaking point and bottlenecks |

Each iteration exercises: `POST /auth/login` → `GET /products/findAll` → `GET /customers/findAll` → `POST /products/create` → unauthenticated 401 check.

---

## 3. Baseline Results (Before Optimization)

### 3.1 Smoke Test — 1 VU
All endpoints reachable and functional.

| Check | Result |
|---|---|
| Auth register | ✅ 200 OK |
| Auth login (JWT returned) | ✅ 200 OK |
| Products create | ✅ 200 OK |
| Products findAll | ✅ 200 OK |
| Customers create | ✅ 200 OK |
| Customers findAll | ✅ 200 OK |
| Auth guard rejects 401 | ✅ Correct |
| **p95 response time** | **60ms** |

### 3.2 Load Test — up to 50 VUs

| Metric | Value |
|---|---|
| Total iterations | 10,543 |
| Checks passed | **42,173 / 42,173 (100%)** |
| Auth failure rate | **0.00%** |
| avg response time | 7.83ms |
| **p95 response time** | **25ms** |
| p95 NATS round-trip | 29ms |
| Throughput | 81 req/sec |

✅ System healthy at 50 concurrent users.

### 3.3 Stress Test — up to 200 VUs (BEFORE fix)

| Metric | Value |
|---|---|
| Total iterations | 279,875 |
| **Checks passed** | **58.91%** (164,890 / 279,876) |
| **Products findAll success rate** | **17%** |
| **Products create success rate** | **15%** |
| Customers findAll success rate | **100%** ✅ |
| Auth login success rate | **100%** ✅ |
| avg response time | 92ms |
| **p95 response time** | **395ms** |
| **p95 NATS round-trip** | **395ms** |
| Throughput | 666 req/sec (with errors) |
| **Fatal crash** | `MAX_PAYLOAD_EXCEEDED` — NATS 1MB limit breached |

---

## 4. Root Cause Analysis

### Bottleneck 1 — No SQL Pagination (Critical 🔴)

**Location:** `ProductsService.findAll()` → `this.productRepo.find()`

```typescript
// BEFORE — fetches every row unconditionally
async findAll() {
  return await this.productRepo.find();   // SELECT * FROM products
}
```

Under the stress test, each of the 200 VUs was concurrently calling `POST /products/create`, inserting new rows. The `findAll` handler simultaneously called `SELECT * FROM products` with no `LIMIT`. Within minutes, the table grew to **10,000+ rows**. Each response payload grew proportionally until it exceeded the **NATS 1MB max message size**, causing a hard crash:

```
Error: MAX_PAYLOAD_EXCEEDED
  at ProtocolHandler.publish (server-nats.js:97)
```

This killed the products microservice process entirely, dropping all subsequent requests.

**Effect:** Products service crash → 83% of all product requests fail → overall check pass rate drops to 58%.

---

### Bottleneck 2 — Undersized DB Connection Pool (Moderate 🟠)

**Location:** `AppModule` TypeORM config

```typescript
// BEFORE — TypeORM default pool: 10 connections
TypeOrmModule.forRoot({
  type: 'postgres',
  // no `extra` config → defaults to pool max = 10
})
```

At 200 concurrent VUs all querying PostgreSQL, the 10-connection pool became a bottleneck. New queries had to wait for a free connection, adding latency and causing request timeouts at the gateway level.

**Measured effect:** At 200 VUs, p95 latency rose from **25ms → 395ms** (15.8× degradation), with connection wait time being a significant contributor alongside the payload issue.

---

## 5. Implementation

### Fix 1 — SQL Pagination (Products Microservice)

**`microservices/products/src/products/products.service.ts`**
```typescript
// AFTER — bounded query with LIMIT/OFFSET
async findAll(page = 1, limit = 20) {
  const [data, total] = await this.productRepo.findAndCount({
    take: limit,
    skip: (page - 1) * limit,
    order: { product_id: 'ASC' },
  });
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}
```

**`microservices/products/src/products/products.controller.ts`**
```typescript
// AFTER — receives page/limit from NATS payload
@MessagePattern('products.findAllProducts')
async findAll(@Payload() query: { page?: number; limit?: number }) {
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 20;
  return await this.productsService.findAll(page, limit);
}
```

**`nats-gateway/src/products/products.controller.ts`**
```typescript
// AFTER — reads query params, forwards to NATS
@Get('findAll')
findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
  return this.clientProxy.send('products.findAllProducts', { page, limit });
}
```

**Response shape:**
```json
{
  "data": [ ...20 products... ],
  "total": 10424,
  "page": 1,
  "limit": 20,
  "pages": 522
}
```

| Before | After |
|---|---|
| `SELECT * FROM products` — all rows | `SELECT * FROM products ORDER BY product_id LIMIT 20 OFFSET 0` |
| Payload: unbounded (→ crash at ~1MB) | Payload: fixed ~4KB per response |
| Full table scan | Index scan on primary key |

---

### Fix 2 — DB Connection Pool

**`microservices/products/src/app.module.ts`**
```typescript
// AFTER — explicit pool configuration
TypeOrmModule.forRoot({
  type: 'postgres',
  // ... connection config ...
  extra: {
    max: 20,                   // doubled from default 10
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
})
```

---

## 6. Results After Optimization

### Stress Test — up to 200 VUs (AFTER fixes)

| Metric | Before | After | Δ |
|---|---|---|---|
| **Checks passed** | 58.91% | **100%** | **+41 pts** |
| Products findAll success | 17% | **100%** | **+83 pts** |
| Products create success | 15% | **100%** | **+85 pts** |
| Customers findAll success | 100% | 100% | — |
| Auth success | 100% | 100% | — |
| **Error rate** | 41.08% | **0.00%** | **−41 pts** |
| avg response time | 92ms | **61ms** | −34% |
| **p95 response time** | 395ms | **150ms** | **−62%** |
| p95 NATS round-trip | 395ms | **150ms** | **−62%** |
| **Throughput** | 666 req/sec | **797 req/sec** | **+20%** |
| MAX_PAYLOAD crash | Yes 💥 | **Never** ✅ | fixed |
| Total iterations in 7 min | 279,875 | **334,730** | +19.6% |

The system now sustains **200 concurrent users with 0% error rate** and processes **797 requests per second**.

---

## 7. Resume Statement

> *"Built a polyglot microservices system (NestJS + Go + NATS + MongoDB + PostgreSQL) with comprehensive testing: 43 unit tests (100% passing) and k6 load/stress tests up to 200 concurrent users. Identified and resolved critical production bottlenecks — unbounded SQL queries causing NATS payload crashes and an undersized DB connection pool — reducing p95 latency by 62% (395ms → 150ms), eliminating all errors (41% → 0% error rate), and increasing throughput by 20% (666 → 797 req/sec) at 200 concurrent users."*

