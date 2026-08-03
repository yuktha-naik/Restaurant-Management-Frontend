# Frontend Integration Guide — Restaurant Management System

Everything the frontend needs to talk to this backend: base setup, auth/JWT,
roles, signup/login flow, every endpoint + JSON shape, enums, and error handling.

---

## 1. Base setup

- Backend base URL: `http://localhost:8080`
- Frontend must run on: `http://localhost:4200` (hardcoded in CORS config —
  change `SecurityConfig.corsConfigurationSource()` if you use another port)
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed headers: `*`
- `allowCredentials: true`

Every request (except the public ones listed in §4) must carry:
```
Authorization: Bearer <jwt>
Content-Type: application/json
```

---

## 2. JWT contract

Obtained from `POST /auth/login` (staff) or `POST /auth/customer` (customer). Structure (HS256):

| Claim | Meaning |
|---|---|
| `sub` | email (MANAGER/WAITER) or phone (CUSTOMER) |
| `role` | `MANAGER` \| `WAITER` \| `CUSTOMER` (no `ROLE_` prefix in the token). NOTE: this claim is cosmetic — the backend never trusts it for authorization; every request re-derives the role from the database via a fresh lookup (JwtFilter re-queries the DB by email/phone on every call — the JWT's role claim itself is written but never read back anywhere) |
| `iat` | issued-at |
| `exp` | issued-at + 24 hours (86400000 ms) — **token is not refreshed**, user must re-authenticate after expiry |

The frontend does **not need to decode the JWT** — the login/identify response already
gives you `role`, `userId`, `name`, `email`/`phone` in plain JSON (see §3). Decoding is
only useful if you want to check client-side whether the token has expired
before firing a request.

Store the token (e.g. `localStorage`) and attach it as `Authorization: Bearer <token>`
on every subsequent call. No refresh-token mechanism exists — on expiry, all
calls will 401 and the user must re-authenticate.

---

## 3. Auth endpoints

### `POST /auth/login` — public, no token required. **Staff only (MANAGER, WAITER)**
Request:
```json
{ "email": "johnsmith@gmail.com", "password": "123" }
```
Success `200 OK`:
```json
{
  "token": "<jwt>",
  "role": "MANAGER",
  "userId": 1,
  "name": "John Smith",
  "email": "johnsmith@gmail.com",
  "phone": null
}
```
Failure (no such email, OR wrong password — **indistinguishable**) → `401`:
```json
{ "status": 401, "error": "Unauthorized", "message": "Invalid email or password" }
```

### `POST /auth/customer` — public, no token required. **Customer identify-or-create, passwordless**
Customers never sign up or log in with a password. This single call both
identifies a returning customer and creates a new one on the fly — phone
number is the unique identifier.

Request:
```json
{ "phone": "9999999999", "name": "Priya verma", "city": "Mumbai" }
```
- `phone` — required, the unique identifier
- `name` — required
- `city` — optional

Behavior:
- If `phone` already belongs to a customer → that record is reused (its
  `name`/`city` are refreshed with whatever was submitted this time).
- If `phone` is new → a new customer is created immediately.
- Either way, a fresh CUSTOMER JWT is issued. No 401/409 case exists for this
  endpoint under normal input — it always succeeds (barring validation errors
  on blank `phone`/`name`, which return `400` with `fieldErrors`).

Success `200 OK` (same shape whether the customer is new or returning):
```json
{
  "token": "<jwt>",
  "role": "CUSTOMER",
  "userId": 6,
  "name": "Priya verma",
  "email": null,
  "phone": "9999999999"
}
```

**Recommended frontend flow:** one small form (Name, Phone, City) shown to
every walk-in customer. On submit, call this endpoint, store `token` +
`userId` + `phone` (e.g. `localStorage`), and proceed straight into the app —
no separate signup/login screens, no password field at all for customers.
Because the lookup is idempotent on `phone`, a refresh or back-navigation
that re-submits the same phone always resolves to the same `customerId`, so
existing reservations stay correctly linked.

### `POST /customers` — **MANAGER only**, manual customer creation
Not used by the customer-facing flow anymore (replaced by `/auth/customer`).
Kept for a manager/staff screen to manually register a customer (e.g. phone
order taken without the kiosk flow).
Request:
```json
{ "name": "Rahul", "phone": "9876543210", "city": "Pune", "email": "rahul@gmail.com" }
```
`email` and `city` are optional. Duplicate phone → `409 Conflict`.

---

## 4. Role model & who can authenticate

| Role | Can self-register? | How account is created |
|---|---|---|
| **CUSTOMER** | ✅ Yes, passwordless | `POST /auth/customer` (public) — identify-or-create by phone, no signup screen needed |
| **WAITER** | ❌ No | Created by a logged-in MANAGER via `POST /waiters` |
| **MANAGER** | ❌ No | **Hardcoded/seeded**, not created via API. Default account already in `data.sql`: `johnsmith@gmail.com` / password `123` |

No manager signup screen is needed in the frontend. No waiter signup screen for
the waiter themself — only a manager-facing "add waiter" form. No customer
signup/login screen either — just the single Name/Phone/City form from §3.

---

## 5. Customer flow (walk-in, passwordless)

Single form: **Name, Phone, City** (City optional). On submit:

```
POST /auth/customer  { name, phone, city }
  └─ 200 OK → store token + userId + phone, go straight to the app
              (message can say "Welcome, {name}" — no way to distinguish
              new vs returning customer from the response, and there's no
              need to: the UX is identical either way)
```

That's the entire flow — no fallback branches, no 401/409 handling needed
for this endpoint. Refresh/back-navigation is handled by re-hydrating from
`localStorage`; if that's lost, having the customer re-enter the same phone
number reproduces the same `customerId` since the lookup is idempotent.

This replaces the old email/password signup-or-login orchestration entirely
— no backend fallback logic required on the frontend for customers anymore.

---

## 6. All endpoints, access rules, and JSON shapes

Entities are returned/accepted **as-is**; relationships are nested objects
containing just the id (e.g. `"customer": { "customerId": 1 }`).

| Method & Path | Access | Notes |
|---|---|---|
| `POST /auth/login` | public | staff only (MANAGER, WAITER) — see §3 |
| `POST /auth/customer` | public | passwordless customer identify-or-create — see §3 |
| `POST /customers` | MANAGER | manual customer creation, not the customer-facing flow |
| `GET /customers` | MANAGER | list all |
| `GET /customers/{id}` | MANAGER | |
| `PUT /customers/{id}` | MANAGER | |
| `DELETE /customers/{id}` | MANAGER (you're adding self-delete via method-level security) | |
| `POST /managers` | MANAGER | |
| `GET /managers`, `GET /managers/{id}` | MANAGER | |
| `PUT /managers/{id}`, `DELETE /managers/{id}` | MANAGER | |
| `POST /waiters` | WAITER, MANAGER (tighten to MANAGER-only later) | manager creates waiter accounts |
| `GET /waiters`, `GET /waiters/{id}` | WAITER, MANAGER | |
| `PUT /waiters/{id}`, `DELETE /waiters/{id}` | WAITER, MANAGER | |
| `POST /menu-items`, `PUT /menu-items/{id}`, `DELETE /menu-items/{id}` | MANAGER | |
| `GET /menu-items`, `GET /menu-items/{id}` | CUSTOMER, WAITER, MANAGER | |
| `POST /tables`, `PUT /tables/{id}`, `PUT /tables/{id}/release`, `DELETE /tables/{id}` | WAITER, MANAGER | |
| `GET /tables`, `GET /tables/{id}` | WAITER, MANAGER | |
| `POST /reservations` | CUSTOMER, WAITER, MANAGER | see §8 — do not send `status`/`restaurantTable` |
| `GET /reservations`, `GET /reservations/{id}` | CUSTOMER, WAITER, MANAGER | **not filtered by user** — returns ALL reservations to any authenticated role today |
| `DELETE /reservations/{id}` | CUSTOMER, WAITER, MANAGER | cancels (soft), record retained |
| `POST /orders`, `PUT /orders/{id}`, `DELETE /orders/{id}` | WAITER, MANAGER | |
| `GET /orders`, `GET /orders/{id}` | WAITER, MANAGER | |
| `POST /order-items`, `PUT /order-items/{id}`, `DELETE /order-items/{id}` | WAITER, MANAGER | |
| `GET /order-items`, `GET /order-items/{id}` | CUSTOMER, WAITER, MANAGER | |
| `POST /payments`, `PUT /payments/{id}`, `DELETE /payments/{id}` | WAITER, MANAGER | |
| `PUT /payments/{id}/confirm` | WAITER, MANAGER | **NEW** — confirms a `PENDING` payment: sets it to `PAID` and, server-side, moves the linked reservation to `COMPLETED`. This is now the primary frontend action (see below), not a manual `PUT /payments/{id}`. |
| `GET /payments`, `GET /payments/{id}` | WAITER, MANAGER | |

### Sample bodies

**Reservation create** (`POST /reservations`):
```json
{
  "reservationDate": "2026-08-10T19:30:00",
  "partySize": 4,
  "customer": { "customerId": 1 }
}
```
`status` and `restaurantTable` are set by the backend's auto-allocation logic — don't send them.

**Waiter create** (`POST /waiters`, by manager):
```json
{ "name": "David", "email": "david@gmail.com", "phone": "7777777777", "password": "waiter123", "manager": { "managerId": 1 } }
```

**Menu item create** (`POST /menu-items`, by manager):
```json
{ "name": "Mutton Biryani", "category": "MAIN_COURSE", "price": 300.0, "available": true, "manager": { "managerId": 1 } }
```

**Table create** (`POST /tables`):
```json
{ "tableNumber": 5, "capacity": 4 }
```

**Order create** (`POST /orders`):
```json
{ "reservation": { "reservationId": 1 }, "waiter": { "waiterId": 1 } }
```
Backend sets `status = "IN_PROGRESS"`, `totalAmount = 0`, and **auto-creates a
linked `Payment`** (`status: "PENDING"`, `amount: 0`, `paymentMethod: null`) —
don't send any of that yourself. One order per reservation (409 if one already
exists for that reservation).

**Order item create** (`POST /order-items`):
```json
{ "quantity": 2, "restaurantOrder": { "orderId": 1 }, "menuItem": { "itemId": 1 } }
```
Each call adds a **new row** (no automatic merge/quantity-bump for repeat
items — use `PUT /order-items/{id}` to bump quantity on an existing row
instead). `subTotal` is computed server-side; `order.totalAmount` **and** the
linked payment's `amount` are both updated automatically after every
create/update/delete. Blocked (`400`) once the order is `COMPLETED`.

**Order status update** (`PUT /orders/{id}`, waiter marks the order done):
```json
{ "status": "COMPLETED" }
```
Only `status` is read from the body — no need to resend `reservation`/`waiter`.
Transition is **one-way**: `IN_PROGRESS → COMPLETED` only. Attempting to revert
a `COMPLETED` order back to `IN_PROGRESS` returns `400`.

**Payment confirm** (`PUT /payments/{id}/confirm`, no body — the primary
client-facing payment action in the normal flow):
```json
{}
```
Waiter/manager confirms a `PENDING` payment from the payment list UI. Moves
the payment to `PAID` and, server-side, the linked reservation to
`COMPLETED` — both stamped automatically. Only offered in the UI while
`status === 'PENDING'`. This has replaced manually finalizing via
`PUT /payments/{id}` as the day-to-day flow.

**Payment finalize** (`PUT /payments/{id}`, manual/legacy path — still works
but the frontend should prefer `PUT /payments/{id}/confirm` above):
```json
{ "paymentMethod": "CASH", "status": "PAID" }
```
Only allowed once the linked order is `COMPLETED` (`400` otherwise).
`paymentMethod` is required at this point. `amount` is never accepted from the
client — it always mirrors the order's `totalAmount`. `status` defaults to
`PAID` if omitted. `paymentTime` is stamped server-side.

`POST /payments` still exists but is effectively a defensive/legacy path now
— since every order gets its payment auto-created, this call will normally
409 (`"Payment already exists for order..."`). The frontend should not call
it in the normal flow; use `PUT /payments/{id}/confirm` after the order is
completed.

---

## 7. Enums (send/receive these exact string values)

| Enum | Values |
|---|---|
| `ReservationStatus` | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` (set server-side once the payment is confirmed via `PUT /payments/{id}/confirm`) |
| `TableStatus` | `AVAILABLE`, `RESERVED`, `OCCUPIED` |
| `OrderStatus` | `IN_PROGRESS`, `COMPLETED` (2 states only — one-way transition, enforced in `order-list.ts`'s status menu, which only offers `COMPLETED` while an order is `IN_PROGRESS` and offers nothing once it's `COMPLETED`) |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED` |
| `MenuCategory` | `STARTER`, `MAIN_COURSE`, `DESSERT`, `BEVERAGE` |

### Order → order-item → payment lifecycle (frontend call sequence)

1. `POST /orders` — waiter opens the order once the reservation is `CONFIRMED`
   with a table allocated. Order starts `IN_PROGRESS`; its `Payment` is
   auto-created as `PENDING`, amount `0`. Only one order per reservation (i.e.
   per table/customer) is allowed at a time — `order-form.ts` filters the
   reservation picker down to `CONFIRMED` reservations that don't already
   have an order, so a duplicate is never attempted from the UI (backend
   still 409s as a backstop).
2. `POST /order-items` — called once per dish/round (repeatable, any number of
   times) while the order is `IN_PROGRESS`. `order-form.ts` exposes a
   dedicated "add item" mini-form that stays usable after order creation so
   the waiter can add items multiple times in the same order screen. Each
   call bumps `order.totalAmount` and the linked payment's `amount` together
   automatically. Use `PUT`/`DELETE /order-items/{id}` to adjust quantity or
   remove a line.
3. `PUT /orders/{id}` with `{ "status": "COMPLETED" }` — waiter closes the
   order once everything's been served/no more items are coming. This is the
   point of no return: item edits are now blocked and the payment can finally
   be finalized.
4. `PUT /payments/{id}/confirm` (no body) — the single action that
   finalizes/collects the payment now. Sets payment `PAID` and, server-side,
   moves the reservation to `COMPLETED`. `amount`/`paymentMethod` are already
   correct — don't send anything. (Manual `PUT /payments/{id}` with
   `{ "paymentMethod": "...", "status": "PAID" }` still works as a legacy
   fallback but isn't the frontend's normal path anymore.)
5. Optional: `GET /payments/{id}` or `GET /orders/{id}` to confirm.

Minimal frontend function set: `createOrder`, `addOrderItem` (×N),
`updateOrderStatus('COMPLETED')`, `confirmPayment`.

---

## 8. Business rules the frontend must respect

- **Reservation validation** (enforced server-side, but validate client-side too
  for good UX): party size > 0, party size ≤ largest table capacity, reservation
  time not in the past, within operating hours (`10`–`22`, 24h clock, from
  `application.properties`), no duplicate reservation for same customer/date.
- **Reservation table assignment is automatic.** Customer only picks
  date/time/party size; backend assigns the table.
- Passwords are **write-only** — never returned in any GET/POST/PUT response
  for Customer, Waiter, or Manager.

---

## 9. Error response format (applies to ALL endpoints)

Standard error shape:
```json
{ "timestamp": "2026-08-03T14:00:00", "status": 404, "error": "Not Found", "message": "Customer not found with id: 99" }
```

`@Valid` validation failures use a different shape (field-level map):
```json
{
  "timestamp": "2026-08-03T14:00:00",
  "status": 400,
  "error": "Validation Failed",
  "fieldErrors": { "partySize": "Party size must be at least 1", "email": "Invalid email" }
}
```

| HTTP Status | When it happens |
|---|---|
| `400 Bad Request` | `@Valid` failures (`fieldErrors` map) OR business rule violations (`message` string) OR malformed/missing JSON body |
| `401 Unauthorized` | missing/invalid/expired JWT, OR login with wrong email/password |
| `403 Forbidden` | valid token but role not permitted for this endpoint (Spring Security default page unless customized — verify in testing) |
| `404 Not Found` | resource id doesn't exist, OR wrong URL entirely |
| `405 Method Not Allowed` | HTTP verb not supported on that path |
| `409 Conflict` | business rule collision (e.g. `ConflictException`) OR DB unique constraint hit (duplicate email/phone/table number) |
| `500 Internal Server Error` | unexpected server error — message includes exception text |

**Frontend should always try to read `message` (string) or `fieldErrors` (map)**
from the response body to show the user something meaningful, and branch on
HTTP status for flow control (401 → redirect to login, 409 on signup → "already
exists" message, etc.)

---

## 10. Known gaps / things not yet enforced server-side

- `GET /reservations` and `GET /orders` etc. return **all records**, not scoped
  to the logged-in customer/waiter. Method-level security / filtering by
  `userId` is planned but not yet implemented — frontend should not assume
  data is pre-filtered per user.
- No refresh token — expired JWT (24h) requires full re-login.
- `POST /waiters` is currently reachable by a WAITER token too, not just MANAGER.
