import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import OptimizedImage from '../ui/OptimizedImage.jsx';
import StarRating from '../ui/StarRating.jsx';
import NumericField from '../ui/NumericField.jsx';
import Button from '../ui/Button.jsx';
import { formatMoney } from '../../utils/formatting.js';

export default function ItemModal({ item, isOpen, onClose }) {
  const { addItem } = useCart();
  const { t } = useLanguage();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setAdded(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, item]);

  if (!item) return null;

  // Use t() helper for multilingual fields — resolves {en, am, ar} or plain string
  const name        = t(item.name);
  const description = t(item.description);
  const avgRating   = Number(item.avgRating ?? item.rating ?? 0);
  const ratingCount = Number(item.ratingCount ?? item.reviewCount ?? 0);

  function handleAdd() {
    addItem({
      id: item.id,
      name: item.name,   // store the full multilingual object so cart resolves correctly
      price: item.price,
      imageUrl: item.imageUrl,
    }, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-rough/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header / Image */}
            <div className="relative shrink-0">
              {item.imageUrl ? (
                <div className="h-56 w-full">
                  <OptimizedImage src={item.imageUrl} alt={name} className="w-full h-full" />
                </div>
              ) : (
                <div className="h-16 bg-gold-muted/10 w-full" />
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 bg-rough/50 hover:bg-rough/70 text-pale-light rounded-full backdrop-blur-md transition-colors"
                aria-label={t('close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto">
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold text-rough">{name}</h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <StarRating value={avgRating} readOnly size="sm" />
                    <span className="text-xs text-gold-muted">({ratingCount} {t('reviews')})</span>
                  </div>
                )}
              </div>

              {description && (
                <p className="text-body text-sm leading-relaxed mb-6">{description}</p>
              )}

              {/* Action Area */}
              <div className="bg-pale rounded-xl p-4 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-xl text-gold">{formatMoney(item.price)}</span>
                  <NumericField value={qty} onChange={setQty} min={1} max={20} label="Quantity" />
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  icon={added ? undefined : <ShoppingCart size={18} />}
                  onClick={handleAdd}
                  style={added ? { backgroundColor: '#16a34a', color: 'white' } : {}}
                >
                  {added
                    ? `✓ ${t('added')}`
                    : `${t('addToCart')} — ${formatMoney(item.price * qty)}`}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
