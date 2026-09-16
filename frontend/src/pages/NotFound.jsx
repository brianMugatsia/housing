import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-2 text-slate-500">Page not found.</p>
      <Link to="/" className="mt-6 font-medium text-primary">
        Back to home
      </Link>
    </div>
  );
}
