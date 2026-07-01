import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Minus, Plus, Trash2, FileText } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatMoney } from '../../utils/formatting.js';
import Button from '../ui/Button.jsx';

export function CartDrawer({ isOpen, onClose, onOrder, loading = false }) {
  const { items, removeItem, updateQty, updateNote, totalItems, totalPrice, clearCart } = useCart();
  const { t } = useLanguage();
  const [expandedNote, setExpandedNote] = useState(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-rough/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-pale-light border-l border-gold-muted/30 shadow-2xl z-50 flex flex-col"
            aria-label={t('yourCart')}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gold-muted/30">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-gold" />
                <h2 className="font-display text-lg font-semibold text-rough">
                  {t('yourCart')}
                  {totalItems > 0 && (
                    <span className="ml-2 text-sm font-sans text-gold-muted">
                      ({totalItems} {totalItems !== 1 ? t('items') : t('item')})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-pale text-gold-muted hover:text-rough transition-colors"
                aria-label={t('close')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gold-muted gap-3">
                  <ShoppingCart size={48} className="text-gold-muted/30" />
                  <p className="font-display text-rough text-lg">{t('cartEmpty')}</p>
                  <p className="text-sm">{t('browseMenuToAdd')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => {
                    const name = t(item.name);
                    const itemKey = `${item.id}-${idx}`;
                    const isExpanded = expandedNote === itemKey;
                    return (
                      <motion.div
                        key={itemKey}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="bg-pale rounded-xl p-3 border border-gold-muted/20"
                      >
                        <div className="flex gap-3">
                          {/* Image */}
                          {(item.imageUrl || item.image) && (
                            <img
                              src={item.imageUrl || item.image}
                              alt={name || ''}
                              className="w-16 h-16 rounded-lg object-cover shrink-0"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-rough text-sm truncate">{name}</p>
                            <p className="text-xs text-gold mt-0.5">{formatMoney(item.price)}</p>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQty(item.id, item.qty - 1, item.note)}
                                  className="w-7 h-7 rounded-lg bg-pale-light border border-gold-muted/30 flex items-center justify-center text-rough hover:bg-gold hover:text-pale-light transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-rough">{item.qty}</span>
                                <button
                                  onClick={() => updateQty(item.id, item.qty + 1, item.note)}
                                  className="w-7 h-7 rounded-lg bg-pale-light border border-gold-muted/30 flex items-center justify-center text-rough hover:bg-gold hover:text-pale-light transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(item.id, item.note)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                aria-label={`Remove ${name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Notes section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-gold-muted/20"
                            >
                              <textarea
                                value={item.note || ''}
                                onChange={(e) => updateNote(item.id, e.target.value, item.note)}
                                placeholder="e.g., No onions, less spicy..."
                                className="w-full text-sm p-2 border border-gold-muted/30 rounded-lg bg-pale-light text-rough placeholder-gold-muted/50 focus:outline-none focus:ring-1 focus:ring-gold"
                                rows="2"
                              />
                            </motion.div>
                          )}
                          {!isExpanded && item.note && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-2 text-xs text-gold-muted italic"
                            >
                              {t('note')}: {item.note}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={() => setExpandedNote(isExpanded ? null : itemKey)}
                          className="mt-2 text-xs text-gold hover:text-rough transition-colors flex items-center gap-1"
                        >
                          <FileText size={12} />
                          {isExpanded ? t('done') : t('addNote')}
                        </button>
                      </motion.div>
                    );
                  })}

                  {items.length > 1 && (
                    <button
                      onClick={clearCart}
                      className="w-full text-center text-xs text-red-400 hover:text-red-600 py-2 transition-colors"
                    >
                      {t('clearAll')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gold-muted/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-rough font-semibold">{t('total')}</span>
                  <span className="font-display text-xl text-gold font-bold">{formatMoney(totalPrice)}</span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={onOrder}
                  loading={loading}
                >
                  <ShoppingCart size={18} aria-hidden="true" />
                  {t('placeOrder')}
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
