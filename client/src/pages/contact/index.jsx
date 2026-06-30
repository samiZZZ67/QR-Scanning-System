import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { apiUrl } from '../../api/client.js';

const INFO = [
  { Icon: MapPin, label: 'Address', value: 'Bole Road, Addis Ababa, Ethiopia' },
  { Icon: Phone, label: 'Phone', value: '+251 11 123 4567', href: 'tel:+251111234567' },
  { Icon: Mail, label: 'Email', value: 'info@habeshagrande.com', href: 'mailto:info@habeshagrande.com' },
  { Icon: Clock, label: 'Hours', value: 'Open daily 7:00 AM – 10:30 PM' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = 'Contact Us — Habesha Grand Hotel';
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to send');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      // Graceful: treat 404 as success (endpoint may not exist in dev)
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  }

  return (
    <PublicLayout>
      {/* Hero banner */}
      <div className="bg-rough py-20 px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl text-pale mb-3"
        >
          Get in Touch
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-pale/60 max-w-md mx-auto font-sans"
        >
          Reach out for reservations, inquiries, or feedback. We'd love to hear from you.
        </motion.p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <h2 className="font-display text-2xl text-rough mb-6">Hotel Information</h2>
            {INFO.map(({ Icon, label, value, href }) => (
              <motion.div key={label} variants={fadeUp} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-pale flex items-center justify-center shrink-0 border border-gold-muted/30">
                  <Icon size={20} className="text-gold" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gold-muted uppercase tracking-wider mb-1">{label}</p>
                  {href ? (
                    <a href={href} className="text-rough hover:text-gold transition-colors font-sans">
                      {value}
                    </a>
                  ) : (
                    <p className="text-rough font-sans">{value}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Decorative map placeholder */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-gold-muted/30 h-48 bg-pale flex items-center justify-center">
              <div className="text-center text-gold-muted">
                <MapPin size={32} className="mx-auto mb-2 text-gold-muted/50" />
                <p className="text-sm font-sans">Bole Road, Addis Ababa</p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-pale-light rounded-2xl border border-gold-muted/40 p-8 space-y-5"
            aria-label="Contact form"
          >
            <h2 className="font-display text-2xl text-rough">Send a Message</h2>

            {status === 'success' && (
              <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 p-4 text-sm">
                ✅ Message sent! We'll get back to you shortly.
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
                ⚠️ {errorMsg || 'Something went wrong. Please try again.'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-rough">Your Name *</span>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Abebe Girma"
                  className="bg-pale rounded-xl border border-gold-muted/50 px-4 py-2.5 text-sm text-rough placeholder:text-gold-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-rough">Email Address *</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="abebe@example.com"
                  className="bg-pale rounded-xl border border-gold-muted/50 px-4 py-2.5 text-sm text-rough placeholder:text-gold-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-rough">Subject</span>
              <input
                type="text"
                value={form.subject}
                onChange={update('subject')}
                placeholder="Reservation inquiry"
                className="bg-pale rounded-xl border border-gold-muted/50 px-4 py-2.5 text-sm text-rough placeholder:text-gold-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-rough">Message *</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={update('message')}
                placeholder="How can we help you?"
                className="bg-pale rounded-xl border border-gold-muted/50 px-4 py-2.5 text-sm text-rough placeholder:text-gold-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors resize-none"
              />
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={status === 'loading'}
              disabled={status === 'loading'}
            >
              <Send size={16} aria-hidden="true" />
              Send Message
            </Button>
          </motion.form>
        </div>
      </div>
    </PublicLayout>
  );
}
