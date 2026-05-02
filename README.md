# Eato — Online Food Delivery Platform

Full-stack food delivery system with **Customer**, **Restaurant**, and **Admin** roles.

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB

## Prerequisites

- Node.js 18+
- MongoDB running locally (e.g. `mongodb://localhost:27017`) or set `MONGODB_URI` in backend `.env`

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (MONGODB_URI, JWT_SECRET, PORT)
npm run seed
npm run dev
```

API runs at **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:3000** and proxies `/api` to the backend.

## Seed Data (after `npm run seed`)

- **Admin:** admin@eato.com / admin123  
- **Restaurant:** demo@restaurant.com / rest123 (approved, with sample menu)  
- **Customer:** customer@eato.com / cust123  

## Screens (8)

| # | Role      | Screen                    | Description                          |
|---|-----------|---------------------------|--------------------------------------|
| 1 | Customer  | Registration              | Create account, data saved in DB     |
| 2 | Customer  | Browse Restaurants        | List from DB                         |
| 3 | Customer  | View Menu                 | Restaurant menu & details            |
| 4 | Customer  | Place Order               | Cart, COD only, order saved in DB    |
| 5 | Restaurant| Profile Management        | Update restaurant info               |
| 6 | Restaurant| Menu Management           | Add / Update / Delete menu items     |
| 7 | Restaurant| Order Processing          | View orders, update status           |
| 8 | Admin     | Admin Dashboard           | View & manage customers & restaurants|

## Database Collections

- **customers** — name, email, password, phone, address, status  
- **restaurants** — name, email, password, restaurantName, description, address, phone, cuisine, status  
- **menuitems** — restaurantId, name, description, price, category, available  
- **orders** — customerId, restaurantId, items, totalAmount, paymentMethod, status, deliveryAddress  
- **admins** — name, email, password  

## API Overview

- `POST /api/auth/register/customer` — Customer signup  
- `POST /api/auth/register/restaurant` — Restaurant signup  
- `POST /api/auth/login` — Login (body: email, password, role)  
- `GET /api/auth/me` — Current user (Bearer token)  
- `GET /api/restaurants` — List approved restaurants  
- `GET /api/restaurants/:id` — One restaurant  
- `PUT /api/restaurants/profile` — Restaurant update profile (auth)  
- `GET /api/menu/restaurant/:id` — Menu for restaurant  
- `GET /api/menu/my` — Restaurant’s own menu (auth)  
- `POST /api/menu` — Add item (auth)  
- `PUT /api/menu/:id` — Update item (auth)  
- `DELETE /api/menu/:id` — Delete item (auth)  
- `POST /api/orders` — Place order (customer auth)  
- `GET /api/orders/my` — Customer orders (auth)  
- `GET /api/orders/restaurant` — Restaurant orders (auth)  
- `PATCH /api/orders/:id/status` — Update order status (auth)  
- `GET /api/admin/customers` — List customers (admin)  
- `GET /api/admin/restaurants` — List restaurants (admin)  
- `PATCH /api/admin/customers/:id` — Update customer status  
- `DELETE /api/admin/customers/:id` — Delete customer  
- `PATCH /api/admin/restaurants/:id` — Update restaurant status  
- `DELETE /api/admin/restaurants/:id` — Delete restaurant  
