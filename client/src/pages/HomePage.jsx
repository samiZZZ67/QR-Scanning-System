import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Utensils, QrCode, Clock } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

const features = [
  {
    icon: QrCode,
    title: 'Scan & Order',
    desc: 'Scan the QR code on your table and browse our full menu instantly.'
  },
  {
    icon: Utensils,
    title: 'Fresh Cuisine',
    desc: 'Authentic Ethiopian dishes crafted daily by our master chefs.'
  },
  {
    icon: Clock,
    title: 'Real-Time Tracking',
    desc: 'Follow your order from kitchen to table with live status updates.'
  },
  {
    icon: Star,
    title: 'Leave Feedback',
    desc: 'Rate your experience and help us serve you better every visit.'
  }
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        aria-label="Hero"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-off-navy via-rough to-rough-light"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 60%, rgba(196,144,58,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(120,93,50,0.3) 0%, transparent 50%)'
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gold-hover text-sm font-medium tracking-widest uppercase mb-4"
          >
            Welcome to
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl sm:text-7xl font-bold text-pale leading-tight mb-6"
          >
            Habesha Grand Hotel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-gold-muted text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Where tradition meets luxury — experience Ethiopian hospitality through seamless digital dining.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              variant="primary"
              icon={<ArrowRight size={18} />}
              onClick={() => window.location.href = '/order'}
            >
              View Menu
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-pale-light text-pale-light hover:bg-pale-light hover:text-rough"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Us
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-pale/30 flex items-start justify-center pt-1.5"
          aria-hidden="true"
        >
          <div className="w-1.5 h-3 bg-pale/50 rounded-full" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full" aria-label="Features">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-rough mb-3">
            A New Way to Dine
          </h2>
          <p className="text-body max-w-xl mx-auto">
            Our QR ordering system makes dining effortless — browse, order, and enjoy without waiting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
              className="bg-surface rounded-2xl border border-gold-muted/40 shadow-card p-6 flex flex-col gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-pale flex items-center justify-center">
                <Icon size={22} className="text-gold" aria-hidden="true" />
              </div>
              <h3 className="font-display font-semibold text-rough text-lg">{title}</h3>
              <p className="text-sm text-body leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pale py-16 px-6" aria-label="Call to action">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-rough mb-4">
            Ready to Order?
          </h2>
          <p className="text-body mb-8">
            Scan the QR code at your table or browse the menu online. Your next great meal is just a tap away.
          </p>
          <Link to="/order">
            <Button size="lg" icon={<ArrowRight size={18} />}>
              Browse Menu
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
