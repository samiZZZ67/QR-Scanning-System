import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, QrCode } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1800&q=85'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.6 } },
}

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      aria-label="Welcome to Habesha Grand Hotel"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Habesha Grand Hotel — elegant interior with warm Ethiopian ambiance"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-off-navy/85 via-rough/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-off-navy/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/40 text-gold text-sm font-medium font-sans backdrop-blur-sm">
              <span aria-hidden="true">✦</span>
              Premium Hotel Experience
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl text-pale leading-[1.08] tracking-tight mb-6"
          >
            Where Ethiopian Tradition
            <br />
            <span className="text-gold">Meets Modern Luxury</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-pale/75 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl font-sans"
          >
            Scan your table's QR code to explore our full menu, place orders
            instantly, and track your meal — all without leaving your seat.
            Authentic Ethiopian cuisine, served your way.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/order?table=101')}
              className="shadow-lg"
              aria-label="Explore our menu and start ordering"
            >
              Explore Our Menu
              <ArrowRight size={18} aria-hidden="true" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/contact')}
              aria-label="Contact Habesha Grand Hotel"
            >
              Contact Us
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-pale/50 text-xs font-sans tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-pale/30 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-pale/60" />
        </motion.div>
      </motion.div>

      {/* Floating QR animation card */}
      <motion.div
        initial={{ opacity: 0, x: 60, y: 30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-16 right-8 z-10 hidden lg:block"
        aria-hidden="true"
      >
        <div className="relative bg-pale/10 backdrop-blur-md border border-pale/20 rounded-2xl p-5 w-48 shadow-2xl">
          {/* QR grid decoration */}
          <div className="grid grid-cols-7 gap-0.5 mb-3">
            {Array.from({ length: 49 }).map((_, i) => {
              const on = [0,1,2,3,4,5,6,7,13,14,20,21,24,25,26,27,28,34,35,41,42,43,44,45,46,47,48].includes(i)
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-sm ${on ? 'bg-gold' : 'bg-pale/20'}`}
                />
              )
            })}
          </div>

          {/* Scan line */}
          <motion.div
            animate={{ y: ['0%', '420%', '0%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-5 right-5 top-5 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full"
          />

          <div className="flex items-center gap-2 mt-1">
            <QrCode size={14} className="text-gold shrink-0" />
            <span className="text-pale/70 text-xs font-sans">Scan to order</span>
          </div>

          {/* Ping dot */}
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
          </span>
        </div>
      </motion.div>
    </section>
  )
}
