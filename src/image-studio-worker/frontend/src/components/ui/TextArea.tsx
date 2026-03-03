import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = "", id, ...props }: TextAreaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-4 py-2.5 rounded-xl bg-obsidian-950/50 border border-white/10 text-white
          placeholder:text-gray-700 focus:outline-none focus:ring-1 ring-amber-neon/30 focus:border-white/20
          disabled:opacity-20 text-xs font-medium transition-all resize-y min-h-20 ${error ? "border-red-500/50" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[9px] font-bold text-red-400 mt-1 ml-1 uppercase tracking-tighter">
          {error}
        </p>
      )}
    </div>
  );
}
