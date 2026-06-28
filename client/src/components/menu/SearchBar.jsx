import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({ value = '', onChange, placeholder = 'Search menu...' }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => { setLocal(value); }, [value]);

  function handleChange(e) {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  }

  function handleClear() {
    setLocal('');
    onChange('');
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="relative flex items-center bg-pale-light border border-gold-muted/50 rounded-xl focus-within:ring-2 focus-within:ring-gold focus-within:border-gold transition-all">
      <Search size={16} className="absolute left-3 text-gold-muted pointer-events-none" aria-hidden="true" />
      <input
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-transparent pl-9 pr-9 py-2.5 text-sm text-rough placeholder:text-gold-muted focus:outline-none"
        aria-label={placeholder}
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-3 text-gold-muted hover:text-rough transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
