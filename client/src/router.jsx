import { lazy, useEffect } from "react";
import { createBrowserRouter, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HomePage = lazy(() => import("./pages/home/index.jsx"));
const ContactPage = lazy(() => import("./pages/contact/index.jsx"));
const CustomerPage = lazy(() => import("./pages/customer/index.jsx"));
const ItemPage = lazy(() => import("./pages/item/index.jsx"));
const KitchenPage = lazy(() => import("./pages/kitchen/index.jsx"));
const WaiterPage = lazy(() => import("./pages/waiter/index.jsx"));
const AdminPage = lazy(() => import("./pages/admin/index.jsx"));

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

function PageWrapper({ children }) {
  return <motion.div {...pageMotion}>{children}</motion.div>;
}

/**
 * RestoreSpaRoute — handles the fallback redirect from public/404.html.
 *
 * On static hosts that don't support SPA rewrites (e.g. GitHub Pages),
 * 404.html stores the original path in sessionStorage and redirects to "/".
 * This component reads that stored path and navigates to it, preserving
 * the full URL (path + query string + hash).
 *
 * On Render (which rewrites /* → /index.html), 404.html is never served
 * and this component simply redirects unknown paths to "/".
 */
function RestoreSpaRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem("__spa_redirect");
    if (stored && stored !== "/") {
      sessionStorage.removeItem("__spa_redirect");
      navigate(stored, { replace: true });
    }
  }, [navigate]);

  // While we check sessionStorage, render nothing (or fall through to home)
  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PageWrapper>
        <HomePage />
      </PageWrapper>
    ),
  },
  {
    path: "/contact",
    element: (
      <PageWrapper>
        <ContactPage />
      </PageWrapper>
    ),
  },
  {
    path: "/order",
    element: (
      <PageWrapper>
        <CustomerPage />
      </PageWrapper>
    ),
  },
  {
    path: "/item",
    element: (
      <PageWrapper>
        <ItemPage />
      </PageWrapper>
    ),
  },
  {
    path: "/kitchen",
    element: (
      <PageWrapper>
        <KitchenPage />
      </PageWrapper>
    ),
  },
  {
    path: "/waiter",
    element: (
      <PageWrapper>
        <WaiterPage />
      </PageWrapper>
    ),
  },
  {
    path: "/admin",
    element: (
      <PageWrapper>
        <AdminPage />
      </PageWrapper>
    ),
  },
  {
    path: "*",
    element: <RestoreSpaRoute />,
  },
]);
