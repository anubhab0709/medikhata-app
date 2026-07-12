import Ico from '../utils/icons.jsx';

export default function SearchInput({ value, onChange, placeholder, className = '', id }) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center justify-center">
        <Ico.Search />
      </div>
      <input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        className="input input-search text-[0.9375rem]"
      />
    </div>
  );
}
