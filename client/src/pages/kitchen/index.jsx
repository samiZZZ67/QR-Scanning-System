import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import StaffLayout from '../../layouts/StaffLayout.jsx';
import KitchenPageContent from '../KitchenPage.jsx';
import Button from '../../components/ui/Button.jsx';

export default function KitchenPage() {
  const { isAuthenticated, role, authenticate } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!pin.trim()) { setError('PIN is required'); return; }
    setLoading(true);
    setError('');
    try {
      const ok = await authenticate(pin, 'Kitchen');
      if (!ok) setError('Invalid PIN. Please try again.');
    } catch {
      setError('Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated || (role && role !== 'Kitchen')) {
    return (
      <div className="min-h-screen bg-rough flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <span className="text-5xl" aria-hidden="true">🏨</span>
            <h1 className="font-display text-2xl font-bold text-pale mt-3">Kitchen Staff Access</h1>
            <p className="text-sm text-pale/50 mt-1">Enter your staff PIN to continue</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-pale-light/10 backdrop-blur-sm rounded-2xl border border-pale/15 p-6 space-y-4"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 p-3 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pale/40" />
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
                className="w-full bg-pale/10 border border-pale/20 rounded-xl pl-10 pr-4 py-3 text-pale placeholder:text-pale/30 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <StaffLayout title="Kitchen Display">
      <div className="p-4 sm:p-6 lg:p-8">
        <KitchenPageContent />
      </div>
    </StaffLayout>
  );
}
