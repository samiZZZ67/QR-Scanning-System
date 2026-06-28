/**
 * CustomerLayout — thin wrapper used by guest-facing pages.
 * The page component itself provides the sticky header and content structure;
 * this layout just ensures the min-height and base background.
 */
export default function CustomerLayout({ children }) {
  return <div className="min-h-screen bg-pale-light">{children}</div>;
}
