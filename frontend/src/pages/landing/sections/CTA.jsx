import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-indigo-700">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to find your next home?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-100/90 text-white/80">
          Join thousands of students who found verified, affordable housing near campus.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-8 shadow-xl shadow-black/10"
          onClick={() => navigate("/houses")}
        >
          Start Searching
        </Button>
      </div>
    </section>
  );
}