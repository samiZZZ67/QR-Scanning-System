# Hotel Digital Menu MVP

A polished QR-based hotel and restaurant ordering system with a modern customer experience, staff dashboards, admin controls, image support, feedback collection, and Grok AI integration.

## Overview

This project already includes a working full-stack experience for:
- Customer QR/table ordering
- Kitchen order processing
- Waiter service requests
- Admin menu, categories, tables, orders, assets, and feedback
- Real-time updates with Socket.IO
- Multi-language UI support in English, Amharic, and Arabic
- Image upload and preview for menu items and categories
- Customer feedback after delivery
- Dedicated item detail pages for menu dishes
- Admin search for faster content management
- Grok AI for translation, writing assistance, and image generation

## How it works

### Customer experience

Customers can visit a table-based URL such as:
- `/order?table=101`

From there they can:
- browse the menu by category
- search for dishes
- view item details and reviews
- add dishes to a cart
- leave notes for the kitchen
- place an order
- track the order status
- submit feedback once the order is delivered

### Staff experience

Staff users can access:
- `/kitchen` for kitchen workflow
- `/waiter` for waiter service and ready orders

Staff views use a shared PIN and support floor filtering for larger properties.

### Admin experience

Admins can access `/admin` and manage:
- menu items
- categories
- tables
- orders
- feedback
- images and banners
- Grok AI assistance

The admin panel also includes search for menu items to make management faster.

### Backend flow

The Express backend handles:
- menu retrieval and updates
- category CRUD
- table CRUD
- order creation and status updates
- service notifications
- feedback submission
- report generation
- image upload handling
- Grok AI requests

The application uses SQLite by default and can also connect to PostgreSQL when `DATABASE_URL` is provided.

### Real-time updates

Socket.IO keeps the experience live for:
- menu changes
- new orders
- status changes
- new feedback
- uploaded assets

## Main features

### Completed improvements

- Modern landing and menu UI
- Better loading and processing feedback for buttons and actions
- Menu item image upload and preview
- Category image upload and preview
- Item detail page with description and review access
- Customer ratings and review display
- Customer feedback after delivery
- Admin search bar for menu management
- Grok AI assistant for translation, writing, and image generation
- Real-time status and asset updates

### Current supported routes

- `/` — landing page
- `/order?table=<number>` — customer menu
- `/item?item=<id>&table=<number>` — item detail page
- `/kitchen` — kitchen dashboard
- `/waiter` — waiter dashboard
- `/admin` — admin panel

## Getting started

### Requirements

- Node.js 18+
- npm

### Install

```bash
cd hotel_projects/hotel_projects
npm install
```

### Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Important variables:
- `PORT` — backend port, default `3000`
- `HOST` — host binding, default `0.0.0.0`
- `DATABASE_PATH` — SQLite file path for local development
- `DATABASE_URL` — PostgreSQL connection string for production
- `STAFF_PIN` — staff/admin PIN, default `1234`
- `PUBLIC_BASE_URL` — base URL used for QR links
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — optional Telegram notifications
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional cloud image storage
- `GROK_API_KEY` or `XAI_API_KEY` — Grok AI access

### Run locally

```bash
npm run dev
```

This starts:
- the Vite frontend
- the Express backend with watch mode

### Build for production

```bash
npm run build
npm start
```

## API overview

### Public
- `GET /api/health`
- `GET /api/menu`
- `POST /api/orders`
- `GET /api/orders/:id`
- `POST /api/service-notifications`
- `GET /api/menu-items/:id/reviews`
- `POST /api/orders/:id/feedback`

### Staff and admin
- `POST /api/staff/session`
- `GET /api/tables`
- `POST /api/tables`
- `DELETE /api/tables/:number`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `POST /api/menu-items`
- `PATCH /api/menu-items/:id`
- `DELETE /api/menu-items/:id`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/service-notifications`
- `PATCH /api/service-notifications/:id/resolve`
- `GET /api/reports/today`
- `GET /api/assets`
- `PATCH /api/assets/:key`
- `POST /api/uploads/image`
- `POST /api/ai/grok`
- `POST /api/ai/grok/image`

## Project structure

- `server/` — backend, database access, uploads, Grok integration, Telegram notifications
- `src/` — React frontend UI, state, routing, translations, realtime hooks
- `public/locales/` — translation files for supported languages
- `data/` — local SQLite database output
- `tests/` — automated tests for core logic

## Production deployment notes

The project is prepared for deployment with:
- Render hosting support
- PostgreSQL via `DATABASE_URL`
- Cloudinary image uploads
- Grok AI integration
- HTTPS redirects in Express for production

Recommended production setup:
- Deploy frontend and backend separately or via a unified service
- Configure environment variables in Render
- Set `DATABASE_URL` to a managed PostgreSQL instance
- Set Cloudinary credentials for asset uploads
- Set `GROK_API_KEY` for AI features

## Remaining ideas

Potential future improvements:
- more advanced role permissions
- richer analytics and reporting
- voucher or promo systems
- payment integration
- reservation and table booking
- stronger image editing tools
- automated deployment pipelines

## Quick usage tips

- Open `/order?table=101` to test the customer flow quickly.
- Use `/kitchen` and `/waiter` with the staff PIN.
- The default PIN is `1234` unless you change it in `.env`.
- Admin search makes menu management faster when the catalog grows.
