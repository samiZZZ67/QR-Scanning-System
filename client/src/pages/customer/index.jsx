import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import CustomerLayout from '../../layouts/CustomerLayout.jsx';
import { useMenu } from '../../hooks/useMenu.js';
import { useCart } from '../../contexts/CartContext.jsx';
import { useRealtime } from '../../hooks/useRealtime.js';
import { placeOrder, getOrder } from '../../api/orders.js';
import { randomIdempotencyKey, formatMoney } from '../../utils/formatting.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import { MenuGridSkeleton } from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import DishCard from '../../components/menu/DishCard.jsx';
import { CategoryFilter } from '../../components/menu/CategoryFilter.jsx';
import { SearchBar } from '../../components/menu/SearchBar.jsx';
import { CartDrawer } from '../../components/menu/CartDrawer.jsx';
import { OrderStatus } from '../../components/order/OrderStatus.jsx';
import { FeedbackForm } from '../../components/order/FeedbackForm.jsx';

export default function CustomerPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '1';
  const { menu, loading, error } = useMenu();
  const cart = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [phase, setPhase] = useState('browse'); // browse | tracking | feedback
  const [currentOrder, setCurrentOrder] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    document.title = `Menu — Table ${tableNumber} | Habesha Grand Hotel`;
  }, [tableNumber]);

  // Poll order status while tracking
  useEffect(() => {
    if (phase !== 'tracking' || !currentOrder?.id) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getOrder(currentOrder.id);
        setCurrentOrder(updated);
        if (updated.status === 'delivered') {
          setPhase('feedback');
        }
      } catch { /* ignore */ }
    }, 8000);
    return () => clearInterval(interval);
  }, [phase, currentOrder?.id]);

  // Realtime order updates
  const handleOrderUpdate = useCallback((data) => {
    if (currentOrder && data.id === currentOrder.id) {
      setCurrentOrder(data);
      if (data.status === 'delivered') setPhase('feedback');
    }
  }, [currentOrder]);

  useRealtime({ room: `table-${tableNumber}` }, {
    'order.statusChanged': handleOrderUpdate,
  });

  async function handlePlaceOrder() {
    if (cart.items.length === 0) return;
    setOrdering(true);
    try {
      const order = await placeOrder({
        tableNumber: Number(tableNumber),
        items: cart.items.map((i) => ({ menuItemId: i.id, quantity: i.qty })),
        idempotencyKey: randomIdempotencyKey(),
      });
      cart.clearCart();
      setShowCart(false);
      setCurrentOrder(order);
      setPhase('tracking');
      setNotice(null);
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setOrdering(false);
    }
  }

  // Filter items
  const items = (menu?.items || []).filter((item) => {
    if (activeCategory && item.categoryId !== activeCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = (typeof item.name === 'object' ? item.name.en : item.name || '').toLowerCase();
      const desc = (typeof item.description === 'object' ? item.description.en : item.description || '').toLowerCase();
      if (!name.includes(term) && !desc.includes(term)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-7 w-32 rounded-lg bg-gold-muted/15 animate-pulse" />
              <div className="h-3 w-20 rounded-lg bg-gold-muted/15 animate-pulse mt-2" />
            </div>
            <LoadingSpinner size="sm" text="Loading menu" />
          </div>
          <MenuGridSkeleton />
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <p className="text-4xl mb-3">😕</p>
            <p className="font-display text-xl text-rough mb-2">Couldn't load menu</p>
            <p className="text-sm text-gold-muted">{error}</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-pale-light pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-rough">Our Menu</h1>
              <p className="text-xs text-gold-muted">Table {tableNumber}</p>
            </div>
            {phase === 'browse' && (
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 rounded-xl bg-gold text-pale-light hover:bg-gold-hover transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart size={20} />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rough text-pale-light text-[10px] font-bold flex items-center justify-center">
                    {cart.totalItems}
                  </span>
                )}
              </button>
            )}
          </div>

          {phase === 'browse' && (
            <>
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
              <CategoryFilter
                categories={menu?.categories || []}
                active={activeCategory}
                onSelect={setActiveCategory}
              />
            </>
          )}
        </div>

        {/* Notices */}
        {notice && (
          <div className={`rounded-xl p-4 text-sm mb-4 ${notice.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            {notice.message}
            <button onClick={() => setNotice(null)} className="ml-2 underline text-xs">dismiss</button>
          </div>
        )}

        {/* Browse phase */}
        {phase === 'browse' && (
          <>
            {items.length === 0 ? (
              <div className="text-center py-20 text-gold-muted">
                <p className="text-4xl mb-3">🍽️</p>
                <p className="font-medium">No items found</p>
                {searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {items.map((item) => (
                  <DishCard
                    key={item.id}
                    item={item}
                    onAddToCart={() =>
                      cart.addItem({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        imageUrl: item.imageUrl,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Tracking phase */}
        {phase === 'tracking' && currentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <div className="text-center">
              <p className="text-4xl mb-3">🎉</p>
              <h2 className="font-display text-2xl text-rough mb-1">Order Placed!</h2>
              <p className="text-sm text-gold-muted">Order #{currentOrder.id} • Table {tableNumber}</p>
            </div>

            <div className="bg-pale-light rounded-2xl border border-gold-muted/30 p-6">
              <OrderStatus status={currentOrder.status} />
            </div>

            {/* Order items */}
            <div className="bg-pale-light rounded-2xl border border-gold-muted/30 p-5">
              <h3 className="font-display font-semibold text-rough mb-3">Your Order</h3>
              <ul className="divide-y divide-gold-muted/15 text-sm">
                {(currentOrder.items || []).map((item, i) => {
                  const name = typeof item.name === 'object' ? item.name.en : item.name;
                  return (
                    <li key={i} className="py-2 flex justify-between">
                      <span className="text-rough/80">{name}</span>
                      <span className="font-semibold text-rough">×{item.quantity || item.qty}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 pt-3 border-t border-gold-muted/15 flex justify-between">
                <span className="font-semibold text-rough">Total</span>
                <span className="font-display font-bold text-gold">{formatMoney(currentOrder.total)}</span>
              </div>
            </div>

            <Button variant="outline" size="md" onClick={() => { setPhase('browse'); setCurrentOrder(null); }}>
              Browse Menu Again
            </Button>
          </motion.div>
        )}

        {/* Feedback phase */}
        {phase === 'feedback' && currentOrder && (
          <div className="mt-8 max-w-md mx-auto">
            <FeedbackForm
              orderId={currentOrder.id}
              onSubmitted={() => {
                setTimeout(() => {
                  setPhase('browse');
                  setCurrentOrder(null);
                }, 3000);
              }}
            />
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onOrder={handlePlaceOrder}
        loading={ordering}
      />

      {/* Floating cart FAB */}
      {phase === 'browse' && cart.totalItems > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gold text-pale-light shadow-xl hover:bg-gold-hover transition-colors flex items-center justify-center z-30"
          onClick={() => setShowCart(true)}
          aria-label="Open cart"
        >
          <ShoppingCart size={22} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rough text-pale-light text-[10px] font-bold flex items-center justify-center">
            {cart.totalItems}
          </span>
        </motion.button>
      )}
    </CustomerLayout>
  );
}
