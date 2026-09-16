export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 ${className}`}>
      {children}
    </div>
  );
}
