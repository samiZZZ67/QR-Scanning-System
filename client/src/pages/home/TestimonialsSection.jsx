import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Yonas Bekele',
    role: 'Business Traveller',
    rating: 5,
    text: 'The QR ordering system is revolutionary — I ordered Doro Wot and it arrived in 12 minutes, perfectly spiced. The digital menu with photos made choosing so easy.',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Tourist from London',
    rating: 5,
    text: "I don't speak Amharic but the English menu was perfect. The coffee ceremony experience was absolutely magical — three rounds and incense!",
  },
  {
    name: 'Mohamed Al-Rashid',
    role: 'Conference Guest',
    rating: 5,
    text: 'القائمة باللغة العربية كانت ممتازة. الخدمة سريعة جداً والطعام الإثيوبي رائع.',
  },
  {
    name: 'Tigist Alemu',
    role: 'Local Regular',
    rating: 5,
    text: 'ምግቡ በጣም ጥሩ ነው! The digital ordering system made it easy to customize my order without language barriers.',
  },
];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const advance = useCallback((dir) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => advance(1), 5000);
    return () => clearInterval(timer);
  }, [advance]);

  const t = TESTIMONIALS[current];

  return (
    <section
      className="bg-rough py-24 sm:py-32 overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-sm font-medium font-sans mb-4">
            Guest Reviews
          </span>
          <h2
            id="testimonials-heading"
            className="font-display text-4xl sm:text-5xl text-pale mb-3"
          >
            What Our Guests Say
          </h2>
          <p className="text-pale/50 font-sans max-w-md mx-auto">
            Real experiences from guests who chose Habesha Grand Hotel.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative max-w-2xl mx-auto">
          {/* Prev / Next */}
          <button
            onClick={() => advance(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 z-10 w-10 h-10 rounded-full bg-pale/10 border border-pale/20 flex items-center justify-center text-pale/60 hover:text-pale hover:bg-pale/20 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => advance(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 z-10 w-10 h-10 rounded-full bg-pale/10 border border-pale/20 flex items-center justify-center text-pale/60 hover:text-pale hover:bg-pale/20 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>

          {/* Card */}
          <div className="relative min-h-[260px] flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <div className="bg-pale/5 backdrop-blur-sm border border-pale/10 rounded-2xl p-8 sm:p-10 text-center">
                  {/* Quote icon */}
                  <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-6">
                    <Quote size={22} className="text-gold" aria-hidden="true" />
                  </div>

                  {/* Text */}
                  <blockquote className="text-pale/85 text-lg sm:text-xl leading-relaxed font-sans mb-6">
                    "{t.text}"
                  </blockquote>

                  {/* Stars */}
                  <div className="flex justify-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < t.rating ? 'fill-gold text-gold' : 'text-pale/20'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {/* Author */}
                  <p className="font-display text-pale font-semibold">{t.name}</p>
                  <p className="text-pale/40 text-sm font-sans">{t.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Testimonial navigation">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={[
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  i === current ? 'bg-gold w-8' : 'bg-pale/20 hover:bg-pale/40',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
