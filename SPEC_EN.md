# Mosque Rewards Marketplace — Project Spec (for Codex)

Build a full-stack web app called **Masjid Market**: a points-based rewards store for a mosque's students.
Stack: **React (Vite) + Express.js + MongoDB (Mongoose)**.

## Overview
Students earn points (tracked by an admin). Students log in to a "Market" site, browse items,
add them to a cart, and submit a request. Points are deducted on submission. Admin reviews
requests, sees aggregated demand per item, and marks students as "delivered" once their items
are handed out.

---

## 1. Admin Panel (Site #1)

A single dashboard with 4 tabs:

### Tab 1 — Manage Students
- Add a student: `name`, `password`, `points` (integer balance).
- List all students with edit/delete, and ability to adjust points.

### Tab 2 — Manage Market Items
- Add an item: `name`, `category` (e.g. Toy, Book, Stationery — extensible enum/string),
  `price` (in points), `image` (upload or URL).
- Edit/delete items.

### Tab 3 — Order Quantities (aggregated demand)
- Read-only view listing every item with total quantity requested across all pending orders.
  Example: "Book: Ma'alim fi al-Tariq — Requested: 25".

### Tab 4 — Per-Student Selections
- Grid/list of student names as cards/cells.
- Clicking a student name expands/opens a view of everything that student selected (item, qty, points spent).
- A "Delivered" button per student: marks their order as fulfilled and visually strikes through
  (line-through) the student's name/card once done.

---

## 2. Student Site (Site #2)

### Page 1 — Login
- Fields: `name`, `password`. Validates against the Students collection.

### Page 2 — Market
- Top bar: shows logged-in student's name and current point balance (live-updated after purchases).
- Product grid: `name`, `price`, quantity stepper, "Add to Cart" button.
- Category filter tabs (All / Toy / Book / Stationery / ...).

### Page 3 — My Cart / Selections
- Lists everything the student added: item, quantity, subtotal points.
- Remove-item capability.
- "Confirm & Submit" button: creates the order, deducts points, clears the cart, and (optionally)
  blocks re-submission of an already-pending order.

---

## 3. Backend / API requirements

### Data models
- **Student**: `name` (unique), `password` (hashed), `points` (Number).
- **Product**: `name`, `category`, `price` (Number), `imageUrl`.
- **Order**: `student` (ref), `items: [{ product: ref, name, price, quantity }]`,
  `totalPoints`, `status: 'pending' | 'delivered'`, `createdAt`.

### REST endpoints (suggested)
- `POST /api/auth/login` — student login (name + password) → returns student profile.
- `GET/POST/PUT/DELETE /api/students` — admin CRUD, incl. points adjustment.
- `GET/POST/PUT/DELETE /api/products` — admin CRUD, with image upload endpoint.
- `GET /api/orders/quantities` — aggregated quantity per product across pending orders.
- `GET /api/orders` — list all orders grouped by student (for admin Tab 4).
- `PATCH /api/orders/:id/deliver` — mark an order delivered.
- `POST /api/orders` — student submits cart → creates order, deducts points from student
  (reject if insufficient points).
- `GET /api/orders/student/:studentId` — a student's own order history / current cart status.

### Business rules
- Reject checkout if `totalPoints > student.points`.
- Points are deducted at submission time (Confirm & Submit), not at add-to-cart time.
- Passwords should be hashed (bcrypt) even though this is a simple internal tool.
- Simple session: return a token or student id on login; store in memory/localStorage on the
  student site; admin panel can be unauthenticated or protected by a single shared admin password
  (your choice — flag this as configurable).

### Non-functional
- Use environment variables for `MONGO_URI` and `PORT`.
- CORS enabled between frontend (Vite dev server) and backend.
- Basic input validation and error responses (400/404/409) on all routes.
