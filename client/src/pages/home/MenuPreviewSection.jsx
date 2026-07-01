import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'

const DISHES = [
  {
    id: 1,
    name: 'Injera Combo Platter',
    description:
      'A generous sharing platter of house-made injera with Doro Wot, Misir Wot, Gomen, and Tikel Gomen — the complete Ethiopian table.',
    price: '480',
    image:
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    chefsPickTitle: "Chef's Pick",
    isChefsPickOn: true,
    category: 'Traditional',
  },
  {
    id: 2,
    name: 'Tibs — Grilled Lamb',
    description:
      'Tender lamb cubes sautéed with jalapeños, rosemary, and Ethiopian spices. Served with injera and a side of ayib cheese.',
    price: '360',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    chefsPickTitle: null,
    isChefsPickOn: false,
    category: 'Grill',
  },
  {
    id: 3,
    name: 'Ethiopian Coffee Ceremony',
    description:
      'Experience the full traditional coffee ceremony — three rounds of freshly roasted, hand-ground Yirgacheffe beans with popcorn and incense.',
    price: '180',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    chefsPickTitle: "Chef's Pick",
    isChefsPickOn: true,
    category: 'Beverage',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function MenuPreviewSection() {
  const navigate = useNavigate()

  return (
    <section
      className="bg-pale py-24 sm:py-32"
      aria-labelledby="menu-preview-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-sm font-medium font-sans mb-4">
            Seasonal Selections
          </span>
          <h2
            id="menu-preview-heading"
            className="font-display text-4xl sm:text-5xl text-rough mb-4"
          >
            A Taste of Excellence
          </h2>
          <p className="text-rough/60 font-sans text-lg max-w-md mx-auto">
            Hand-picked highlights from our kitchen — dishes our guests keep coming back for.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-7"
        >
          {DISHES.map((dish) => (
            <motion.article
              key={dish.id}
              variants={cardVariants}
              className="group bg-pale-light rounded-2xl overflow-hidden border border-gold-muted/30 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              aria-label={dish.name}
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Category pill */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-off-navy/70 backdrop-blur-sm text-pale text-xs font-medium font-sans">
                  {dish.category}
                </span>
                {/* Chef's Pick badge */}
                {dish.isChefsPickOn && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gold text-pale text-xs font-semibold font-sans shadow-sm">
                    {dish.chefsPickTitle}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-xl text-rough mb-2 leading-snug">
                  {dish.name}
                </h3>
                <p className="text-rough/55 text-sm leading-relaxed font-sans mb-4 line-clamp-3">
                  {dish.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-gold">
                    {dish.price} <span className="text-sm text-rough/50 font-sans font-normal">ETB</span>
                  </span>
                  <button
                    onClick={() => navigate('/order')}
                    className="text-sm text-gold hover:text-gold-hover font-medium font-sans flex items-center gap-1 transition-colors"
                    aria-label={`Order ${dish.name}`}
                  >
                    Order
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-14"
        >
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/order')}
            aria-label="View the full menu"
          >
            View Full Menu
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
