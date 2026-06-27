# 🏨 Hotel Digital Menu & QR Ordering System
### Prototype Presentation

---

## ❌ Part 1 — Problems in the Original Design

### Problem 1 — No Table Identity

The original design says "Scan QR code on the table" but does not say
each table has its own QR code.

> If all tables share the same QR code, the system cannot tell
> which table placed the order. The waiter does not know where to deliver the food.

---

### Problem 2 — No Floor Awareness

The design has no mention of floors or zones.

> A hotel with multiple floors needs the system to know which floor
> an order came from. Without this, the waiter has to guess or ask.

---

### Problem 3 — Language Barrier

The original design has no language option.

> Customers who do not read English cannot use the menu properly.
> Hotels in Ethiopia serve guests who speak Amharic and Arabic too.

---

### Problem 4 — Duplicate Orders

A customer can accidentally press "Place Order" twice.

> The kitchen receives the same order two times.
> This wastes food and causes confusion.

---

### Problem 5 — No Customer Feedback

After placing the order, the customer sees nothing.

> The customer does not know if the order was received.
> They may order again thinking it failed.

---

### Problem 6 — No Waiter Notification

The manager gets a Telegram message but the waiter has no screen.

> The kitchen finishes the food but the waiter does not know it is ready.
> The kitchen has to call the waiter manually.

---

### Problem 7 — Internet Dependency

Socket.IO and Telegram both need a stable connection.

> If the internet drops, orders stop reaching the kitchen.
> The customer sees no error but the kitchen misses the order.

---

### Problem 8 — Menu Hard to Update Across Tables

If each table had its own menu page, one price change means editing many pages.

> Sold-out items or price changes must be updated in one place,
> not per table.

---
---

## ✅ Part 2 — Solution for Each Problem

---

### ✅ Solution 1 — Unique QR Per Table

Every table gets its own QR code with the table number inside the link.

```
Table 1   →   menu.hotel.com/order?table=1
Table 15  →   menu.hotel.com/order?table=15
```

> The system reads the table number automatically.
> The customer never types anything. Every order is tagged correctly.

---

### ✅ Solution 2 — Table Number Includes Floor

Use a numbering system where the first digit is the floor.

```
101  →  Floor 1, Table 1
205  →  Floor 2, Table 5
603  →  Floor 6, Table 3
```

The kitchen and waiter screens show:

```
Order #452 — Table 603 — Floor 6
```

> No extra hardware needed per floor.
> One dashboard handles all floors automatically.

---

### ✅ Solution 3 — Language Button

The customer sees a language button as soon as the menu opens.

```
[ 🇬🇧 English ]   [ 🇪🇹 አማርኛ ]   [ 🇸🇦 العربية ]
```

> One tap — the whole menu switches language instantly.
> Food names, categories, and descriptions all change.
> The phone remembers the language next time.

---

### ✅ Solution 4 — Disable Button After Order

After the customer presses "Place Order":

```
Button changes to:   Order Placed ✓
Button becomes:      disabled — cannot click again
```

> Duplicate orders are blocked.

---

### ✅ Solution 5 — Live Order Status for Customer

After placing an order, the customer sees a live status page.

```
Your Order — Table 603

🟡 Received
🟡 Preparing
⬜ Ready
```

> Updates automatically. Customer knows the order was received.

---

### ✅ Solution 6 — Waiter Ready Screen

A simple screen shows the waiter which orders are ready and where to deliver.

```
READY TO DELIVER

Order #448 — Table 103 — Floor 1
Order #452 — Table 603 — Floor 6
```

> Waiter sees exactly where to go. No shouting from the kitchen.

---

### ✅ Solution 7 — Local Wi-Fi Network

The system runs on the hotel's own local Wi-Fi, not the internet.

```
Server IP:   192.168.1.100
QR opens:    192.168.1.100/order?table=15
```

> Works even if the hotel has no external internet connection.

---

### ✅ Solution 8 — One Shared Menu in One Database

All QR codes open the same menu. Only the table number is different.

```
menu?table=1   ─┐
menu?table=2   ─┤──  same menu, same database
menu?table=15  ─┘
```

> Admin changes one item — every table sees it instantly.
> Mark an item unavailable — it disappears for everyone immediately.

---
---

## 💡 Part 3 — What the System Does (The Idea)

This system is a **digital replacement for printed menus and manual order-taking.**

---

### For the Customer

The customer scans a QR code, picks their language, browses the menu,
and places an order — all from their own phone.
They can track the order status live without asking anyone.

---

### For the Kitchen

Every new order appears on the kitchen screen the moment it is placed.
The kitchen sees the table number, floor, and items clearly.
They update the status as they prepare the food.

---

### For the Waiter

The waiter has one screen that shows all orders that are ready to deliver,
with the floor and table number. No guessing. No waiting for a call.

---

### For the Manager

The manager receives a Telegram message for every new order.
They can view all orders for the day and see a simple sales summary.
They can also update the menu, change prices, or hide sold-out items
from one admin panel.

---

### The Big Picture

```
Customer  →  scans QR, orders in their language
Kitchen   →  sees order instantly, updates status
Waiter    →  delivers to the right floor and table
Manager   →  gets notified, controls the menu
```

> One system. One database. Every floor. Every table. Any language.

---

## 🏢 How Each Floor Is Managed

A large hotel may have many floors and sometimes a separate kitchen per floor.
Each floor needs at least one tablet for the waiter and one screen for the kitchen.

---

### Small Hotel (1 Floor, 1 Kitchen)

```
1 Kitchen Screen   →  sees all orders
1 Waiter Tablet    →  sees all ready orders
```

> One of each is enough. Simple.

---

### Medium Hotel (3 Floors, 1 Central Kitchen)

The kitchen is in one place but waiters are on different floors.

```
Floor 1  →  1 Waiter Tablet  (filters orders for Floor 1)
Floor 2  →  1 Waiter Tablet  (filters orders for Floor 2)
Floor 3  →  1 Waiter Tablet  (filters orders for Floor 3)

Kitchen  →  1 Kitchen Screen  (sees ALL orders from all floors)
```

> The kitchen handles everything centrally.
> Each waiter tablet only shows orders for its own floor.

---

### Large Hotel (6 Floors, Kitchen Per Floor)

Each floor has its own kitchen and its own waiter.

```
Floor 1  →  1 Kitchen Screen  +  1 Waiter Tablet
Floor 2  →  1 Kitchen Screen  +  1 Waiter Tablet
Floor 3  →  1 Kitchen Screen  +  1 Waiter Tablet
Floor 4  →  1 Kitchen Screen  +  1 Waiter Tablet
Floor 5  →  1 Kitchen Screen  +  1 Waiter Tablet
Floor 6  →  1 Kitchen Screen  +  1 Waiter Tablet
```

> Each kitchen screen only shows orders from its own floor.
> Each waiter tablet only shows ready orders from its own floor.
> The manager dashboard sees everything across all floors.

---

### How the System Knows Which Screen Gets Which Order

The table number tells the system everything.

```
Order from Table 603
          ↓
System reads: Floor 6
          ↓
Sends to:  Kitchen Screen — Floor 6
           Waiter Tablet  — Floor 6
           Manager        — sees all
```

> No manual routing needed.
> The floor digit in the table number does it automatically.

---

### Minimum Hardware Per Floor

| Setup                  | Kitchen Screens | Waiter Tablets |
|------------------------|-----------------|----------------|
| 1 floor, 1 kitchen     | 1               | 1              |
| 3 floors, 1 kitchen    | 1 (central)     | 3 (one each)   |
| 6 floors, 6 kitchens   | 6 (one each)    | 6 (one each)   |

> Any tablet or old Android phone can work as a kitchen or waiter screen.
> No special hardware needed — just a browser and the hotel Wi-Fi.

---



| Problem                    | Solution                                  |
|----------------------------|-------------------------------------------|
| No table identity          | Unique QR per table with table ID in URL  |
| No floor awareness         | Table number includes floor digit         |
| Language barrier           | Language button — EN / አማርኛ / العربية     |
| Duplicate orders           | Button disabled after order placed        |
| No customer feedback       | Live order status page on phone           |
| No waiter notification     | Waiter ready-order screen                 |
| Internet dependency        | Runs on local hotel Wi-Fi                 |
| Hard to update menu        | One shared menu in one database           |

---

*Prototype — Node.js · React · SQLite · Socket.IO · Telegram Bot*
