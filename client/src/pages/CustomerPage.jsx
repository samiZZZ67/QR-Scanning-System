import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMenu } from '../hooks/useMenu.js';
import { useCart } from '../contexts/CartContext.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import Notice from '../components/ui/Notice.jsx';
import Button from '../components/ui/Button.jsx';
import OptimizedImage from '../components/ui/OptimizedImage.jsx';
import NumericField from '../components/ui/NumericField.jsx';
import { formatMoney } from '../utils/formatting.js';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { placeOrder } from '../api/orders.js';
import { randomIdempotencyKey } from '../utils/formatting.js';

export default function CustomerPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '1';
  const { menu, loading, error } = useMenu();
  const { cart, addToCart, cartTotal, cartCount, clearCart } = useCart();
  const [activeCategory, setActiveCategory] = useState(null);
  const [notice, setNotice] = useState(null);
  const [ordering, setOrdering] = useState(false);

  const filteredItems = activeCategory
    ? menu.items.filter((i) => i.categoryId === activeCategory)
    : menu.items;

  async function handlePlaceOrder() {
    if (!cart.length) return;
    setOrdering(true);
    try {
      await placeOrder({
        tableNumber: Number(tableNumber),
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        idempotencyKey: randomIdempotencyKey()
      });
      clearCart();
      setNotice({ type: 'success', message: 'Your order has been placed! We will start preparing it now.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setOrdering(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading menu..." />;
  if (error) return <Notice type="error" message={error} />;

  return (
    <div className="space-y-6 pb-32">
      {notice && (
        <Notice
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <h1 className="font-display text-2xl font-bold text-rough">Our Menu</h1>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Menu categories">
        <button
          role="tab"
          aria-selected={!activeCategory}
          onClick={() => setActiveCategory(null)}
          className={[
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            !activeCategory ? 'bg-gold text-pale-light' : 'bg-pale text-body hover:text-gold'
          ].join(' ')}
        >
          All
        </button>
        {menu.categories.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={[
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat.id ? 'bg-gold text-pale-light' : 'bg-pale text-body hover:text-gold'
            ].join(' ')}
          >
            {cat.name?.en || cat.name}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-2xl border border-gold-muted/40 shadow-card overflow-hidden"
          >
            {item.imageUrl && (
              <div className="h-40 overflow-hidden">
                <OptimizedImage
                  src={item.imageUrl}
                  alt={item.name?.en || item.name || ''}
                  className="w-full h-full"
                />
              </div>
            )}
            <div className="p-4 space-y-2">
              <h3 className="font-display font-semibold text-rough text-base">
                {item.name?.en || item.name}
              </h3>
              {item.description && (
                <p className="text-xs text-body line-clamp-2">{item.description?.en || item.description}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-gold">{formatMoney(item.price)}</span>
                <Button
                  size="sm"
                  onClick={() => addToCart({
                    menuItemId: item.id,
                    name: item.name?.en || item.name,
                    price: item.price,
                    image: item.imageUrl
                  })}
                >
                  Add
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 bg-surface border-t border-gold-muted/30 shadow-lifted z-30"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-rough">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gold-muted">{formatMoney(cartTotal)}</p>
            </div>
            <Button
              size="md"
              loading={ordering}
              icon={<ShoppingCart size={16} />}
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
