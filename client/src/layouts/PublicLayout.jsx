import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";

/**
 * PublicLayout — wraps public-facing pages with the shared Navbar and Footer.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-pale">
      <Navbar />
      <main className="flex-1" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
