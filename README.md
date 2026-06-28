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

- Modern landing and menu UI with responsive design
- Better loading and processing feedback for buttons and actions
- Menu item image upload and preview with cloud storage support
- Category image upload and preview
- Item detail page with description and review access
- Customer ratings and review display
- Customer feedback after delivery with star ratings
- Admin search bar for fast menu management
- Grok AI assistant for translation, writing, and image generation
- Real-time status and asset updates with Socket.IO
- Fixed sidebar navigation in admin panel
- Staff authentication gate with PIN verification
- Skeleton loading components for better UX
- Improved error handling and form validation

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

**Install client dependencies:**

```bash
cd client
npm install
```

**Install server dependencies:**

```bash
cd ../server
npm install
```

### Environment

Copy the example environment files:

**Client (.env or .env.local):**

```bash
cd client
cp .env.example .env
```

**Server (.env):**

```bash
cd ../server
cp .env.example .env
```

Important server variables:

- `PORT` — backend port, default `3000`
- `HOST` — host binding, default `0.0.0.0`
- `DATABASE_PATH` — SQLite file path for local development (default: `data/hotel.sqlite`)
- `DATABASE_URL` — PostgreSQL connection string for production
- `STAFF_PIN` — staff/admin PIN, default `1234`
- `PUBLIC_BASE_URL` — base URL used for QR links
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — optional Telegram notifications
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional cloud image storage
- `GROK_API_KEY` or `XAI_API_KEY` — Grok AI access

### Run locally

From the root directory:

**Development:**

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend dev server
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend will be running at `http://localhost:3000`

**Production build:**

```bash
# Build client
cd client
npm run build

# Build and start server
cd ../server
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

```
QR-Scanning-System/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── analytics/          # Admin analytics charts
│   │   │   ├── layout/             # Layout components (sidebar, navbar)
│   │   │   ├── menu/               # Menu-related components
│   │   │   ├── order/              # Order management components
│   │   │   ├── ui/                 # Basic UI components
│   │   │   └── auth/               # Authentication components
│   │   ├── pages/                  # Page components
│   │   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── customer/           # Customer ordering pages
│   │   │   ├── kitchen/            # Kitchen dashboard
│   │   │   └── waiter/             # Waiter service pages
│   │   ├── layouts/                # Layout wrappers
│   │   ├── api/                    # API client modules
│   │   ├── contexts/               # React context (Auth, Cart)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Utility functions
│   │   ├── App.jsx                 # Main app component
│   │   └── i18n.js                 # Internationalization setup
│   ├── public/
│   │   └── locales/                # Translation files (en, am, ar)
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── controllers/            # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── menuController.js
│   │   │   ├── orderController.js
│   │   │   ├── aiController.js
│   │   │   └── ...
│   │   ├── db/                     # Database layer
│   │   │   ├── sqlite.js           # SQLite connection
│   │   │   ├── postgres.js         # PostgreSQL connection
│   │   │   ├── repository.js       # Data access patterns
│   │   │   ├── seed.js             # Database seeding
│   │   │   └── demoData.js         # Demo data
│   │   ├── routes/                 # API endpoints
│   │   ├── middlewares/            # Express middlewares
│   │   ├── services/               # Business logic
│   │   │   ├── grok.js             # AI integration
│   │   │   ├── telegram.js         # Notifications
│   │   │   └── uploads.js          # File handling
│   │   ├── socket/                 # Socket.IO real-time
│   │   └── config/                 # Configuration
│   ├── data/                       # SQLite database (local dev)
│   ├── uploads/                    # Temporary file uploads
│   ├── package.json
│   ├── server.js                   # Server entry point
│   └── app.js                      # Express app setup
│
└── README.md                        # This file
```

## Production deployment notes

The project is prepared for deployment as a full-stack application with:

- Client-server monorepo architecture
- Separate frontend (Vite/React) and backend (Express) builds
- PostgreSQL support via `DATABASE_URL` environment variable
- SQLite for local development
- Cloudinary image uploads for cloud storage
- Grok AI integration for advanced features
- HTTPS redirects in Express for production
- Rate limiting and security middleware

Recommended production setup:

- Deploy frontend to CDN (Vercel, Netlify, or similar)
- Deploy backend to managed platform (Render, Railway, Heroku, or similar)
- Configure environment variables in your deployment platform
- Set `DATABASE_URL` to a managed PostgreSQL instance
- Set Cloudinary credentials for asset uploads
- Set `GROK_API_KEY` for AI features
- Set `PUBLIC_BASE_URL` for QR code generation
- Enable CORS and security headers as needed

## Remaining ideas

Potential future improvements:

- more advanced role permissions
- richer analytics and reporting
- voucher or promo systems
- payment integration
- reservation and table booking
- stronger image editing tools
- automated deployment pipelines

## Technology stack

### Frontend

- **React** 18+ — UI framework
- **Vite** — build tool and dev server
- **TailwindCSS** — utility-first styling
- **Framer Motion** — animations and transitions
- **Lucide React** — icon library
- **i18next** — internationalization
- **Socket.IO Client** — real-time updates

### Backend

- **Node.js** 18+ — runtime
- **Express** — web framework
- **Socket.IO** — real-time communication
- **SQLite** — local development database
- **PostgreSQL** — production database
- **Multer** — file uploads
- **Grok AI API** — AI features (translation, content generation)
- **Telegram Bot API** — notifications
- **Cloudinary** — cloud image storage

### Development tools

- **ESLint** — code linting
- **Vitest** — unit testing
- **Nodemon** — auto-reload during development

## Quick usage tips

- Open `/order?table=101` to test the customer flow quickly.
- Use `/kitchen` and `/waiter` with the staff PIN.
- The default PIN is `1234` unless you change it in `.env`.
- Admin search makes menu management faster when the catalog grows.

## Development tips

### Useful npm scripts

**Client:**

```bash
cd client
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

**Server:**

```bash
cd server
npm run dev      # Start with nodemon watch
npm start        # Start production server
npm run seed     # Seed database with demo data
```

### Database operations

**Seed the database with demo data:**

```bash
cd server
npm run seed
```

**Reset database (development only):**

- Delete `data/hotel.sqlite` file
- Restart the server to recreate with seed data

### Testing flows

1. **Customer ordering**: Navigate to `http://localhost:5173/order?table=1`
2. **Kitchen staff**: Go to `http://localhost:5173/kitchen` → PIN: `1234`
3. **Waiter service**: Go to `http://localhost:5173/waiter` → PIN: `1234`
4. **Admin panel**: Go to `http://localhost:5173/admin` → PIN: `1234`

### Language support

The UI supports three languages via URL parameter or language selector:

- English (en) — default
- Amharic (am)
- Arabic (ar)

Add `?lang=am` to URLs to test language switching.

### Debugging

- **Frontend**: Open browser DevTools for client-side debugging
- **Backend**: Check server console output for errors
- **Real-time updates**: Open multiple browser tabs/windows to test Socket.IO updates
- **Network requests**: Use browser DevTools Network tab to inspect API calls
