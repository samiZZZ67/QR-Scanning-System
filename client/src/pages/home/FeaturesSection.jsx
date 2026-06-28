import { motion } from 'framer-motion'
import { QrCode, Activity, Globe, Star, Shield, ChefHat } from 'lucide-react'

const FEATURES = [
  {
    Icon: QrCode,
    title: 'Instant QR Access',
    description: 'Scan the QR code on your table, browse the full menu, and place your order — all in under a minute.',
  },
  {
    Icon: Activity,
    title: 'Live Order Tracking',
    description: 'Real-time status updates show you exactly where your meal is — from kitchen to table.',
  },
  {
    Icon: Globe,
    title: '3 Languages',
    description: 'Full support for English, Amharic (አማርኛ), and Arabic — so every guest feels at home.',
  },
  {
    Icon: Star,
    title: 'Rate Your Experience',
    description: 'After delivery, leave a rating and review to help us maintain our award-winning standard.',
  },
  {
    Icon: Shield,
    title: 'Secure & Private',
    description: 'Your order data is encrypted and never shared. Dine with confidence.',
  },
  {
    Icon: ChefHat,
    title: 'Kitchen Integration',
    description: 'Orders route directly to our kitchen display system — no delays, no miscommunications.',
  },
]

const sectionVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function FeaturesSection() {
  return (
    <section
      className="bg-pale py-24 sm:py-32"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-sm font-medium font-sans mb-4">
            The Digital Difference
          </span>
          <h2
            id="features-heading"
            className="font-display text-4xl sm:text-5xl text-rough mb-4"
          >
            Why Choose Digital Ordering?
          </h2>
          <p className="text-rough/60 text-lg max-w-xl mx-auto font-sans">
            Our QR-powered system is designed to make every dining moment
            seamless, personal, and memorable.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map(({ Icon, title, description }) => (
            <motion.article
              key={title}
              variants={cardVariants}
              className="group bg-pale-light border border-gold-muted/50 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              aria-label={title}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center mb-5 group-hover:bg-gold/25 transition-colors">
                <Icon size={22} className="text-gold" aria-hidden="true" />
              </div>

              {/* Text */}
              <h3 className="font-display text-xl text-rough mb-2">{title}</h3>
              <p className="text-rough/60 text-sm leading-relaxed font-sans">{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
