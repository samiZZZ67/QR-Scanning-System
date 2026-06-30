# Deployment Guide: Habesha Grand QR System

This guide outlines how to deploy the **Frontend (React/Vite)** and **Backend (Express/Socket.IO)** as two separate services. This allows you to host the frontend on a CDN (like Vercel, Netlify, or AWS CloudFront) and the backend on a server (like Render, DigitalOcean, or Heroku).

---

## 1. Backend Deployment (Server)

The backend must run in an environment that supports Node.js and persistent WebSockets.

### Prerequisites

- Node.js v18+
- A PostgreSQL database (for production)
- A Telegram bot token (optional, for notifications)
- A Groq API key (for the AI assistant)

### Environment Variables

Set the following environment variables on your backend hosting provider:

```env
NODE_ENV=production
PORT=3000

# Security (Change these!)
SESSION_SECRET=your_super_secret_session_key
ADMIN_PIN=1234
STAFF_PIN=1111
FRONTEND_URL=https://your-frontend-domain.com

# Database (Use Postgres for production)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# External APIs
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_MANAGER_CHAT_ID=your_chat_id
GROQ_API_KEY=your_groq_api_key
```

### Build & Run

1. Go to the `server/` directory.
2. Install dependencies: `npm install`
3. Start the server: `npm start` (This runs `node src/index.js`)

**Hosting Providers Recommended:** Render, Railway, DigitalOcean App Platform, or a VPS with PM2.

---

## 2. Frontend Deployment (Client)

The frontend is a static React/Vite app. It just needs to know where the backend API is located.

### Environment Variables

Before building the frontend, you must provide the backend URL. Create a `.env` file in the `client/` directory (or set this in your hosting provider's build settings):

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

_(Make sure there is no trailing slash)._

### Build Steps

1. Go to the `client/` directory.
2. Install dependencies: `npm install`
3. Build the production assets: `npm run build`
4. The compiled static files will be placed in the `client/dist/` folder.

### Deployment Options

- **Vercel / Netlify:** Connect your GitHub repo, set the Root Directory to `client`, set the Build Command to `npm run build`, the Output Directory to `dist`, and add `VITE_API_BASE_URL` to the Environment Variables.
- **Nginx/Apache (VPS):** Copy the contents of the `client/dist/` folder to your web root (e.g., `/var/www/html/`). Configure your web server to route all traffic to `index.html` (for React Router to work properly).

If users can land on the backend domain directly, set `FRONTEND_URL` or `PUBLIC_BASE_URL` on the backend to your frontend deployment URL. The backend will redirect browser-only routes like `/admin`, `/kitchen`, and `/waiter` there when it is not serving a local `client/dist/` build.

### Note on WebSockets

Ensure your backend hosting provider supports WebSocket connections. Some load balancers might require explicit configuration to allow WebSocket upgrades (e.g., passing the `Upgrade` header in Nginx). The frontend uses `socket.io-client` which will automatically fall back to long-polling if WebSockets are blocked, but true WebSockets perform much better.

---

## Post-Deployment Checklist

1. **Test the API Connection:** Open the frontend and make sure it can fetch the menu.
2. **Test Socket.IO:** Place a test order and verify that it appears instantly in the Admin panel without refreshing.
3. **Test Manager Call:** From the Waiter Page, tap "Call Manager" and verify the notification bell rings on the Admin layout.
4. **CORS:** If you see CORS errors in the browser console, ensure your backend's `FRONTEND_URL` environment variable exactly matches your deployed frontend URL (e.g., `https://your-hotel.vercel.app`).
