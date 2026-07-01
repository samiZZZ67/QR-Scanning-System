import { useState } from 'react';
import { motion } from 'framer-motion';
import OptimizedImage from '../ui/OptimizedImage.jsx';
import Badge from '../ui/Badge.jsx';
import StarRating from '../ui/StarRating.jsx';
import { formatMoney } from '../../utils/formatting.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

/**
 * DishCard — menu grid card.
 * Props: item, onAddToCart(item, qty), tableNumber
 */
export default function DishCard({ item, onAddToCart, onCardClick, tableNumber }) {
  const { t } = useLanguage();
  const [added, setAdded] = useState(false);

  const name        = t(item.name);
  const description = t(item.description);
  const avgRating   = Number(item.avgRating  ?? item.rating       ?? 0);
  const ratingCount = Number(item.ratingCount ?? item.reviewCount  ?? 0);

  function handleAdd(e) {
    e.stopPropagation();
    onAddToCart?.(item, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleCardClick() {
    if (onCardClick) {
      onCardClick(item);
    }
  }

  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: 'var(--shadow-lifted)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-surface rounded-2xl shadow-card border border-gold-muted/30 overflow-hidden cursor-pointer group"
      onClick={handleCardClick}
      aria-label={name}
    >
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-2xl">
        <OptimizedImage
          src={item.imageUrl || item.image}
          alt={name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badges overlay */}
        {(item.isPopular || item.isChefsPick) && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {item.isPopular   && <Badge variant="warning">Popular 🔥</Badge>}
            {item.isChefsPick && <Badge variant="gold">Chef's Pick 👨‍🍳</Badge>}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-display font-semibold text-rough text-[0.95rem] leading-snug line-clamp-1">
          {name}
        </h3>

        {description && (
          <p className="text-xs text-body leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between mt-0.5">
          <span className="text-gold font-bold text-sm">{formatMoney(item.price)}</span>

          {avgRating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating value={avgRating} readOnly size="sm" />
              {ratingCount > 0 && (
                <span className="text-[10px] text-gold-muted">({ratingCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Add button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          className={[
            'w-full mt-1 py-2 rounded-xl text-sm font-semibold transition-colors',
            added
              ? 'bg-green-600 text-white'
              : 'bg-gold text-pale-light hover:bg-gold-hover',
          ].join(' ')}
          aria-label={added ? t('added') : `${t('add')} ${name}`}
        >
          {added ? t('added') : t('add')}
        </motion.button>
      </div>
    </motion.article>
  );
}
