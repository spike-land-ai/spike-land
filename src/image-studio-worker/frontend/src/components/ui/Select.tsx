import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, options, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 rounded-xl bg-obsidian-950/50 border border-white/10 text-white
          focus:outline-none focus:ring-1 ring-amber-neon/30 focus:border-white/20
          disabled:opacity-20 text-xs font-semibold appearance-none cursor-pointer transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-obsidian-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
