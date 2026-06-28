import { Check } from 'lucide-react';

const STEPS = [
  { key: 'received', label: 'Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

export function OrderStatus({ status }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full" aria-label={`Order status: ${status}`}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isUpcoming = i > currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500',
                    isCompleted
                      ? 'bg-gold text-pale-light shadow-sm'
                      : isCurrent
                        ? 'bg-gold text-pale-light ring-4 ring-gold/20 shadow-md'
                        : 'bg-pale border-2 border-gold-muted/40 text-gold-muted',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={[
                    'text-xs mt-2 font-medium',
                    isCompleted || isCurrent ? 'text-rough' : 'text-gold-muted',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gold-muted/20">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-700 ease-out"
                    style={{ width: isCompleted ? '100%' : isCurrent ? '50%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderStatus;
