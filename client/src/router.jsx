import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
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
    element: <Navigate to="/" replace />,
  },
]);
