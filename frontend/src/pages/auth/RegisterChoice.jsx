import { useNavigate } from "react-router-dom";
import { GraduationCap, Building2 } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function RegisterChoice() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Join HomeFind</h1>
      <p className="mt-2 text-slate-500">Tell us who you are to get started.</p>

      <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
        <Card className="flex flex-col items-center text-center">
          <GraduationCap className="h-10 w-10 text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">I'm a Student</h2>
          <p className="mt-2 text-sm text-slate-500">Search and book verified student accommodation.</p>
          <Button className="mt-6 w-full" onClick={() => navigate("/register/student")}>
            Continue as Student
          </Button>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <Building2 className="h-10 w-10 text-accent" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">I'm a Landlord</h2>
          <p className="mt-2 text-sm text-slate-500">List your property and manage bookings.</p>
          <Button variant="secondary" className="mt-6 w-full" onClick={() => navigate("/register/landlord")}>
            Continue as Landlord
          </Button>
        </Card>
      </div>
    </div>
  );
}
