import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../ui/Button.jsx';

export default function StaffLoginGate({ role = 'Staff', title = 'Staff Access' }) {
  const { authenticate, sessionNotice } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!pin.trim()) {
      setError('PIN is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await authenticate(pin, role);
      if (!ok) setError('Invalid PIN. Please try again.');
    } catch {
      setError('Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-rough flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Building2 size={44} className="mx-auto text-gold" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold text-pale mt-3">{title}</h1>
          <p className="text-sm text-pale/60 mt-1">Enter your staff PIN to start a secure session</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-pale-light/10 backdrop-blur-sm rounded-lg border border-pale/15 p-6 space-y-4"
        >
          {sessionNotice && (
            <div className="rounded-lg bg-amber-400/15 border border-amber-300/30 text-amber-100 p-3 text-sm text-center">
              {sessionNotice}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/15 border border-red-400/30 text-red-200 p-3 text-sm text-center">
              {error}
            </div>
          )}

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pale/45" />
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              required
              className="w-full bg-pale/10 border border-pale/20 rounded-lg pl-10 pr-4 py-3 text-pale placeholder:text-pale/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
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

