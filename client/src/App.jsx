import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy } from "react";
import LoadingSpinner from "./components/ui/LoadingSpinner.jsx";

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

function FallbackSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pale">
      <LoadingSpinner size="lg" text="Loading…" />
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<FallbackSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
          <Route path="/order" element={<PageWrapper><CustomerPage /></PageWrapper>} />
          <Route path="/item" element={<PageWrapper><ItemPage /></PageWrapper>} />
          <Route path="/kitchen" element={<PageWrapper><KitchenPage /></PageWrapper>} />
          <Route path="/waiter" element={<PageWrapper><WaiterPage /></PageWrapper>} />
          <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
