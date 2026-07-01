import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { getMenu, getItemReviews } from '../api/menu.js';
import { useCart } from '../contexts/CartContext.jsx';
import OptimizedImage from '../components/ui/OptimizedImage.jsx';
import StarRating from '../components/ui/StarRating.jsx';
import NumericField from '../components/ui/NumericField.jsx';
import Button from '../components/ui/Button.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import Notice from '../components/ui/Notice.jsx';
import { formatMoney } from '../utils/formatting.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function ItemPage() {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item');
  const tableNumber = searchParams.get('table') || '1';
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t } = useLanguage();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    Promise.all([getMenu(), getItemReviews(itemId).catch(() => [])])
      .then(([menuData, reviewData]) => {
        const found = menuData.items?.find((i) => String(i.id) === itemId);
        setItem(found || null);
        setReviews(reviewData || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [itemId]);

  function handleAdd() {
    if (!item) return;
    addItem({
      id: item.id,
      name: t(item.name),
      price: item.price,
      imageUrl: item.imageUrl,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading item..." />;
  if (error)   return <Notice type="error" message={error} />;
  if (!item)   return <Notice type="error" message="Item not found." />;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6 pb-10">
      {added && (
        <Notice type="success" message={`${t(item.name)} added to cart!`} onDismiss={() => setAdded(false)} />
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gold-muted hover:text-gold transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </button>

      {item.imageUrl && (
        <div className="rounded-2xl overflow-hidden h-56">
          <OptimizedImage src={item.imageUrl} alt={t(item.name)} className="w-full h-full" />
        </div>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold text-rough">{t(item.name)}</h1>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={Math.round(avgRating)} readOnly size="sm" />
            <span className="text-xs text-gold-muted">({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {item.description && (
        <p className="text-body leading-relaxed">{t(item.description)}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-2xl text-gold">{formatMoney(item.price)}</span>
        <NumericField value={qty} onChange={setQty} min={1} max={20} label="Quantity" />
      </div>

      <Button size="lg" className="w-full" icon={<ShoppingCart size={18} />} onClick={handleAdd}>
        Add {qty > 1 ? `${qty}x ` : ''}to Cart — {formatMoney(item.price * qty)}
      </Button>

      {reviews.length > 0 && (
        <section aria-label="Customer reviews">
          <h2 className="font-display font-semibold text-rough text-lg mb-3">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="bg-pale rounded-xl p-4">
                <StarRating value={r.rating} readOnly size="sm" />
                {r.comment && <p className="text-sm text-body mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
