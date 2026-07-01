import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export function CategoryFilter({ categories = [], active, onSelect }) {
  const { t } = useLanguage();

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none"
      role="tablist"
      aria-label="Menu categories"
    >
      {/* "All" tab */}
      <button
        role="tab"
        aria-selected={active === null}
        onClick={() => onSelect(null)}
        className={[
          'relative shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors',
          active === null
            ? 'bg-gold text-pale-light font-semibold shadow-sm'
            : 'bg-pale text-rough hover:text-gold',
        ].join(' ')}
      >
        {t('all')}
        {active === null && (
          <motion.div
            layoutId="cat-indicator"
            className="absolute inset-0 bg-gold rounded-full -z-10"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </button>

      {categories.map((cat) => {
        const isActive = active === cat.id;
        // Use t() helper so multilingual {en, am, ar} objects resolve correctly
        const label = t(cat.name);
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(cat.id)}
            className={[
              'relative shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-gold text-pale-light font-semibold shadow-sm'
                : 'bg-pale text-rough hover:text-gold',
            ].join(' ')}
          >
            {label}
            {isActive && (
              <motion.div
                layoutId="cat-indicator"
                className="absolute inset-0 bg-gold rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
