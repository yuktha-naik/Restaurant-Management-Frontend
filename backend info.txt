# 🍽️ Restaurant Management System

A RESTful backend application built with **Spring Boot** to manage all core operations of a restaurant — staff, tables, menu, reservations, orders, and payments.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Seed Data](#seed-data)
- [API Endpoints](#api-endpoints)
  - [Managers](#managers)
  - [Waiters](#waiters)
  - [Customers](#customers)
  - [Tables](#tables)
  - [Menu Items](#menu-items)
  - [Reservations](#reservations)
  - [Orders](#orders)
  - [Order Items](#order-items)
  - [Payments](#payments)
- [Enums Reference](#enums-reference)

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Language     | Java 17                             |
| Framework    | Spring Boot 4.1.0                   |
| Persistence  | Spring Data JPA + Hibernate         |
| Database     | MySQL 8                             |
| Validation   | Spring Boot Validation (Jakarta)    |
| Boilerplate  | Lombok                              |
| Build Tool   | Maven (via Maven Wrapper)           |

---

## 📁 Project Structure

```
src/main/java/org/capstonegrp8/restaurant_management_system/
├── controller/       # REST controllers (request handling)
├── service/          # Business logic interfaces
│   └── impl/         # Service implementations
├── repository/       # Spring Data JPA repositories
├── entity/           # JPA entities (DB table mappings)
├── enums/            # Enum types for status fields
├── dto/              # Data Transfer Objects
├── config/           # App configuration
└── exception/        # Exception handling

src/main/resources/
├── application.properties   # App configuration
└── data.sql                 # Seed data (runs on every startup)
```

---

## 🗄️ Database Schema

### Entity Relationships

```
Manager ──< Waiter ──< RestaurantTable
   │
   └──< MenuItem

Customer ──< Reservation >── RestaurantTable
                │
                └──< RestaurantOrder >── Waiter
                            │
                            ├──< OrderItem >── MenuItem
                            │
                            └── Payment
```

### Tables

| Table                | Key Columns                                                       |
|----------------------|-------------------------------------------------------------------|
| `managers`           | `manager_id`, `name`, `phone`, `email`                           |
| `waiters`            | `waiter_id`, `name`, `phone`, `email`, `manager_id` (FK)         |
| `customers`          | `customer_id`, `name`, `phone`, `email`                          |
| `restaurant_tables`  | `table_id`, `table_number`, `capacity`, `status`, `waiter_id` (FK) |
| `menu_items`         | `item_id`, `name`, `category`, `price`, `available`, `manager_id` (FK) |
| `reservations`       | `reservation_id`, `reservation_date`, `party_size`, `status`, `customer_id` (FK), `table_id` (FK) |
| `restaurant_orders`  | `order_id`, `order_time`, `status`, `total_amount`, `reservation_id` (FK), `waiter_id` (FK) |
| `order_items`        | `order_item_id`, `quantity`, `sub_total`, `order_id` (FK), `menu_item_id` (FK) |
| `payments`           | `payment_id`, `amount`, `payment_method`, `payment_time`, `status`, `order_id` (FK) |

---

## 🚀 Getting Started

### Prerequisites

- Java 17+
- MySQL 8 running locally
- Maven (or use the included `mvnw` wrapper)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/abhin5821/Clarivate_Training_Capstone_Project.git
   cd Clarivate_Training_Capstone_Project
   ```

2. **Create the database**
   ```sql
   CREATE DATABASE restaurant_management;
   ```

3. **Configure credentials** — update `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/restaurant_management
   spring.datasource.username=root
   spring.datasource.password=your_password
   ```

4. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```
   The server starts at **http://localhost:8080**

---

## ⚙️ Configuration

`src/main/resources/application.properties`

```properties
spring.application.name=Restaurant_Management_System

spring.datasource.url=jdbc:mysql://localhost:3306/restaurant_management
spring.datasource.username=root
spring.datasource.password=1234

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Seed data runs on every startup; duplicates are silently discarded
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true

server.port=8080

# Restaurant operating hours (24-hour clock, inclusive open, exclusive close)
restaurant.opening-hour=10
restaurant.closing-hour=22
```

---

## 🌱 Seed Data

On every startup, `data.sql` is executed automatically. It uses **`INSERT IGNORE`** so duplicate entries are silently discarded — the DB is never double-seeded.

The following seed data is pre-loaded:

| Entity             | Details                                                        |
|--------------------|----------------------------------------------------------------|
| **Manager**        | John Smith · `johnsmith@gmail.com` · `9999999999`             |
| **Waiter**         | David Updated · `davidupdated@gmail.com` · `7777777777`       |
| **Customer**       | Shailesh G · `shaileshg@gmail.com` · `9999999999`             |
| **Table**          | Table #2 · capacity 6 · status `RESERVED`                     |
| **Menu Item**      | Mutton Dum Biryani · `MAIN_COURSE` · ₹300                     |
| **Reservation**    | 2026-07-31 20:00 · party of 5 · `CONFIRMED`                   |
| **Order 1**        | 2026-07-21 17:43 · `CONFIRMED` · ₹1500                        |
| **Order 2**        | 2026-07-22 20:50 · `PENDING` · ₹650                           |
| **Payment**        | ₹1500 · `CASH` · `PAID` (linked to Order 1)                   |

---

## 📡 API Endpoints

**Base URL:** `http://localhost:8080`

All request and response bodies are **JSON**.

---

### Managers

| Method   | Endpoint            | Description           | Request Body     | Response         |
|----------|---------------------|-----------------------|------------------|------------------|
| `POST`   | `/managers`         | Create a manager      | Manager JSON     | `201` Manager    |
| `GET`    | `/managers`         | Get all managers      | —                | `200` List       |
| `GET`    | `/managers/{id}`    | Get manager by ID     | —                | `200` Manager    |
| `PUT`    | `/managers/{id}`    | Update a manager      | Manager JSON     | `200` Manager    |
| `DELETE` | `/managers/{id}`    | Delete a manager      | —                | `200` message    |

**Manager JSON:**
```json
{
  "name": "John Smith",
  "phone": "9999999999",
  "email": "johnsmith@gmail.com"
}
```

---

### Waiters

| Method   | Endpoint          | Description         | Request Body   | Response       |
|----------|-------------------|---------------------|----------------|----------------|
| `POST`   | `/waiters`        | Create a waiter     | Waiter JSON    | `201` Waiter   |
| `GET`    | `/waiters`        | Get all waiters     | —              | `200` List     |
| `GET`    | `/waiters/{id}`   | Get waiter by ID    | —              | `200` Waiter   |
| `PUT`    | `/waiters/{id}`   | Update a waiter     | Waiter JSON    | `200` Waiter   |
| `DELETE` | `/waiters/{id}`   | Delete a waiter     | —              | `200` message  |

**Waiter JSON:**
```json
{
  "name": "David Updated",
  "phone": "7777777777",
  "email": "davidupdated@gmail.com",
  "manager": { "managerId": 1 }
}
```

---

### Customers

| Method   | Endpoint            | Description           | Request Body     | Response         |
|----------|---------------------|-----------------------|------------------|------------------|
| `POST`   | `/customers`        | Create a customer     | Customer JSON    | `201` Customer   |
| `GET`    | `/customers`        | Get all customers     | —                | `200` List       |
| `GET`    | `/customers/{id}`   | Get customer by ID    | —                | `200` Customer   |
| `PUT`    | `/customers/{id}`   | Update a customer     | Customer JSON    | `200` Customer   |
| `DELETE` | `/customers/{id}`   | Delete a customer     | —                | `200` message    |

**Customer JSON:**
```json
{
  "name": "Shailesh G",
  "phone": "9999999999",
  "email": "shaileshg@gmail.com"
}
```

---

### Tables

| Method   | Endpoint         | Description             | Request Body  | Response       |
|----------|------------------|-------------------------|---------------|----------------|
| `POST`   | `/tables`        | Add a table             | Table JSON    | `201` Table    |
| `GET`    | `/tables`        | Get all tables          | —             | `200` List     |
| `GET`    | `/tables/{id}`   | Get table by ID         | —             | `200` Table    |
| `PUT`    | `/tables/{id}`   | Update a table          | Table JSON    | `200` Table    |
| `DELETE` | `/tables/{id}`   | Delete a table          | —             | `200` message  |

**Table JSON:**
```json
{
  "tableNumber": 2,
  "capacity": 6,
  "status": "AVAILABLE",
  "waiter": { "waiterId": 1 }
}
```

---

### Menu Items

| Method   | Endpoint              | Description           | Request Body     | Response          |
|----------|-----------------------|-----------------------|------------------|-------------------|
| `POST`   | `/menu-items`         | Add a menu item       | MenuItem JSON    | `201` MenuItem    |
| `GET`    | `/menu-items`         | Get all menu items    | —                | `200` List        |
| `GET`    | `/menu-items/{id}`    | Get menu item by ID   | —                | `200` MenuItem    |
| `PUT`    | `/menu-items/{id}`    | Update a menu item    | MenuItem JSON    | `200` MenuItem    |
| `DELETE` | `/menu-items/{id}`    | Delete a menu item    | —                | `200` message     |

**MenuItem JSON:**
```json
{
  "name": "Mutton Dum Biryani",
  "category": "MAIN_COURSE",
  "price": 300.0,
  "available": true,
  "manager": { "managerId": 1 }
}
```

---

### Reservations

| Method   | Endpoint                | Description               | Request Body       | Response           |
|----------|-------------------------|---------------------------|--------------------|--------------------|
| `POST`   | `/reservations`         | Create a reservation      | Reservation JSON   | `201` Reservation  |
| `GET`    | `/reservations`         | Get all reservations      | —                  | `200` List         |
| `GET`    | `/reservations/{id}`    | Get reservation by ID     | —                  | `200` Reservation  |
| `PUT`    | `/reservations/{id}`    | Update a reservation      | Reservation JSON   | `200` Reservation  |
| `DELETE` | `/reservations/{id}`    | Cancel a reservation      | —                  | `200` message      |

**Reservation JSON:**
```json
{
  "reservationDate": "2026-07-31T20:00:00",
  "partySize": 5,
  "status": "CONFIRMED",
  "customer": { "customerId": 1 },
  "restaurantTable": { "tableId": 1 }
}
```

---

### Orders

| Method   | Endpoint          | Description         | Request Body  | Response       |
|----------|-------------------|---------------------|---------------|----------------|
| `POST`   | `/orders`         | Create an order     | Order JSON    | `201` Order    |
| `GET`    | `/orders`         | Get all orders      | —             | `200` List     |
| `GET`    | `/orders/{id}`    | Get order by ID     | —             | `200` Order    |
| `PUT`    | `/orders/{id}`    | Update an order     | Order JSON    | `200` Order    |
| `DELETE` | `/orders/{id}`    | Delete an order     | —             | `200` message  |

**Order JSON:**
```json
{
  "status": "PENDING",
  "totalAmount": 650.0,
  "reservation": { "reservationId": 1 },
  "waiter": { "waiterId": 1 }
}
```

---

### Order Items

| Method   | Endpoint              | Description             | Request Body      | Response          |
|----------|-----------------------|-------------------------|-------------------|-------------------|
| `POST`   | `/order-items`        | Add an order item       | OrderItem JSON    | `201` OrderItem   |
| `GET`    | `/order-items`        | Get all order items     | —                 | `200` List        |
| `GET`    | `/order-items/{id}`   | Get order item by ID    | —                 | `200` OrderItem   |
| `PUT`    | `/order-items/{id}`   | Update an order item    | OrderItem JSON    | `200` OrderItem   |
| `DELETE` | `/order-items/{id}`   | Delete an order item    | —                 | `200` message     |

**OrderItem JSON:**
```json
{
  "quantity": 2,
  "subTotal": 600.0,
  "restaurantOrder": { "orderId": 1 },
  "menuItem": { "itemId": 1 }
}
```

---

### Payments

| Method   | Endpoint             | Description           | Request Body    | Response        |
|----------|----------------------|-----------------------|-----------------|-----------------|
| `POST`   | `/payments`          | Create a payment      | Payment JSON    | `201` Payment   |
| `GET`    | `/payments`          | Get all payments      | —               | `200` List      |
| `GET`    | `/payments/{id}`     | Get payment by ID     | —               | `200` Payment   |
| `PUT`    | `/payments/{id}`     | Update a payment      | Payment JSON    | `200` Payment   |
| `DELETE` | `/payments/{id}`     | Delete a payment      | —               | `200` message   |

**Payment JSON:**
```json
{
  "amount": 1500.0,
  "paymentMethod": "CASH",
  "status": "PAID",
  "restaurantOrder": { "orderId": 1 }
}
```

---

## 📖 Enums Reference

### `MenuCategory`
| Value         | Description      |
|---------------|------------------|
| `STARTER`     | Starter dishes   |
| `MAIN_COURSE` | Main course      |
| `DESSERT`     | Desserts         |
| `BEVERAGE`    | Drinks           |

### `TableStatus`
| Value       | Description              |
|-------------|--------------------------|
| `AVAILABLE` | Table is free            |
| `RESERVED`  | Table has a reservation  |
| `OCCUPIED`  | Table is currently in use|

### `ReservationStatus`
| Value       | Description               |
|-------------|---------------------------|
| `PENDING`   | Awaiting confirmation     |
| `CONFIRMED` | Reservation confirmed     |
| `CANCELLED` | Reservation cancelled     |

### `OrderStatus`
| Value       | Description          |
|-------------|----------------------|
| `PENDING`   | Order placed         |
| `CONFIRMED` | Order confirmed      |
| `SHIPPED`   | Order being prepared |
| `DELIVERED` | Order delivered      |
| `CANCELLED` | Order cancelled      |

### `PaymentStatus`
| Value     | Description       |
|-----------|-------------------|
| `PENDING` | Payment pending   |
| `PAID`    | Payment completed |
| `FAILED`  | Payment failed    |

---

## 👥 Team

**Group 8 — Clarivate Training Capstone Project**
