const styles = {
  approved: "bg-success/10 text-success",
  verified: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-danger/10 text-danger",
  suspended: "bg-danger/10 text-danger",
  neutral: "bg-gray-100 text-slate-600",
};

export default function Badge({ status = "neutral", children }) {
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[key] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
}
