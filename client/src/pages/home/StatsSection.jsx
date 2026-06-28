import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'

const STATS = [
  { raw: 500,   suffix: '+',  label: 'Tables Served',            sublabel: 'Across all dining areas' },
  { raw: 10000, suffix: '+',  label: 'Orders Delivered',         sublabel: 'And counting every day' },
  { raw: 4.8,   suffix: '★', label: 'Average Rating',           sublabel: 'From verified guests' },
  { raw: 3,     suffix: ' min', label: 'Avg. Tracking Time',    sublabel: 'Kitchen to your table' },
]

function AnimatedCounter({ raw, suffix, isDecimal }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const motionVal = useMotionValue(0)
  const displayed = useTransform(motionVal, (v) =>
    isDecimal ? v.toFixed(1) : Math.round(v).toLocaleString()
  )

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionVal, raw, {
      duration: 2,
      ease: 'easeOut',
    })
    return controls.stop
  }, [isInView, raw, motionVal])

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{displayed}</motion.span>
      {suffix}
    </span>
  )
}

export default function StatsSection() {
  return (
    <section
      className="relative bg-rough py-24 sm:py-32 overflow-hidden"
      aria-labelledby="stats-heading"
    >
      {/* Decorative gold lines */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Horizontal accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        {/* Corner diamonds */}
        <div className="absolute top-10 left-10 w-24 h-24 border border-gold/10 rotate-45 rounded-sm" />
        <div className="absolute bottom-10 right-10 w-32 h-32 border border-gold/10 rotate-45 rounded-sm" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-16 h-16 border border-gold/10 rotate-45 rounded-sm" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-16 h-16 border border-gold/10 rotate-45 rounded-sm" />
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent" style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,56,0.07) 0%, transparent 65%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            id="stats-heading"
            className="font-display text-4xl sm:text-5xl text-pale mb-3"
          >
            Trusted by Thousands
          </h2>
          <p className="text-pale/50 font-sans">
            Numbers that speak for our commitment to excellence
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {STATS.map(({ raw, suffix, label, sublabel }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: idx * 0.12 }}
              className="text-center"
            >
              {/* Number */}
              <div
                className="font-display text-5xl sm:text-6xl text-pale mb-2 leading-none"
                aria-label={`${raw}${suffix} ${label}`}
              >
                <AnimatedCounter
                  raw={raw}
                  suffix={suffix}
                  isDecimal={!Number.isInteger(raw)}
                />
              </div>

              {/* Divider */}
              <div className="w-10 h-0.5 bg-gold/50 rounded-full mx-auto mb-3" />

              {/* Label */}
              <p className="text-pale font-sans font-medium text-sm sm:text-base mb-1">
                {label}
              </p>
              <p className="text-pale/40 font-sans text-xs">{sublabel}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
