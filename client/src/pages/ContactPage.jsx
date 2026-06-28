import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Notice from '../components/ui/Notice.jsx';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-rough mb-3">Get in Touch</h1>
        <p className="text-body max-w-md mx-auto">
          We would love to hear from you. Reach out for reservations, inquiries, or feedback.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          {[
            { icon: MapPin, label: 'Address', value: 'Bole Road, Addis Ababa, Ethiopia' },
            { icon: Phone, label: 'Phone', value: '+251 11 123 4567', href: 'tel:+251111234567' },
            { icon: Mail,  label: 'Email', value: 'info@habeshagrande.com', href: 'mailto:info@habeshagrande.com' },
            { icon: Clock, label: 'Hours', value: 'Open daily 7:00 AM – 10:30 PM' }
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pale flex items-center justify-center shrink-0">
                <Icon size={18} className="text-gold" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gold-muted uppercase tracking-wider mb-0.5">{label}</p>
                {href
                  ? <a href={href} className="text-body hover:text-gold transition-colors">{value}</a>
                  : <p className="text-body">{value}</p>
                }
              </div>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface rounded-2xl border border-gold-muted/40 shadow-card p-6 space-y-4"
          aria-label="Contact form"
        >
          {sent && (
            <Notice
              type="success"
              message="Message sent! We will get back to you shortly."
              onDismiss={() => setSent(false)}
            />
          )}
          <Input
            label="Your Name"
            placeholder="Abebe Girma"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="abebe@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-message" className="text-sm font-medium text-rough">
              Message <span className="text-rough-light" aria-hidden="true">*</span>
            </label>
            <textarea
              id="contact-message"
              required
              rows={4}
              placeholder="How can we help you?"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full bg-surface rounded-xl border border-gold-muted px-4 py-2.5 text-sm text-body placeholder:text-gold-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors resize-none"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" icon={<Send size={16} />}>
            Send Message
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
