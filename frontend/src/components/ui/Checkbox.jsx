export default function Checkbox({ label, checked, onChange, className = "" }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-gray-50 ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
      />
      {label}
    </label>
  );
}
