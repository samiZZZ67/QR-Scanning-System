import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import LoadingSpinner from "./components/ui/LoadingSpinner.jsx";
import { router } from "./router.jsx";

function FallbackSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pale">
      <LoadingSpinner size="lg" text="Loading…" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<FallbackSpinner />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
