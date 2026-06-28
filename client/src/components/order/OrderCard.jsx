import { STATUS_COLORS, timeAgo, formatMoney } from '../../utils/formatting.js';

const BORDER_ACCENT = {
  received: 'border-l-amber-400',
  preparing: 'border-l-blue-400',
  ready: 'border-l-green-400',
  delivered: 'border-l-gray-300',
  cancelled: 'border-l-red-400',
};

export function OrderCard({ order }) {
  const itemCount = (order.items || []).reduce((s, i) => s + (i.quantity || i.qty || 1), 0);

  return (
    <div
      className={[
        'bg-pale-light rounded-2xl border border-gold-muted/30 p-5 space-y-3 border-l-4',
        BORDER_ACCENT[order.status] || 'border-l-gold-muted',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-rough">
            Table {order.tableNumber}
            <span className="text-xs text-gold-muted font-normal ml-2">#{order.id}</span>
          </p>
          <p className="text-xs text-gold-muted">{timeAgo(order.createdAt)}</p>
        </div>
        <span
          className={[
            'px-2.5 py-1 text-xs font-semibold rounded-full capitalize',
            STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600',
          ].join(' ')}
        >
          {order.status}
        </span>
      </div>

      <ul className="divide-y divide-gold-muted/15 text-sm">
        {(order.items || []).map((item, i) => {
          const name = typeof item.name === 'object' ? item.name.en : (item.name || `Item #${item.menuItemId}`);
          return (
            <li key={i} className="py-1.5 flex justify-between gap-2">
              <span className="text-rough/80 truncate">{name}</span>
              <span className="font-semibold text-rough shrink-0">×{item.quantity || item.qty || 1}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between pt-1 border-t border-gold-muted/15">
        <span className="text-xs text-gold-muted">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <span className="font-display font-bold text-gold">{formatMoney(order.total)}</span>
      </div>
    </div>
  );
}

export default OrderCard;
