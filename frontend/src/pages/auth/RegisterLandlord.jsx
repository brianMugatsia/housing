import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function RegisterLandlord() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await api.post("/auth/register/", { ...form, role: "LANDLORD" });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setErrors(err.response?.data || { non_field_errors: ["Something went wrong."] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">Landlord Registration</h1>
        <p className="mt-1 text-sm text-slate-500">Create your account to start listing properties.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="Full name" required value={form.full_name} onChange={handleChange("full_name")} error={errors.full_name?.[0]} />
          <Input label="Email" type="email" required value={form.email} onChange={handleChange("email")} error={errors.email?.[0]} />
          <Input label="Phone number" required value={form.phone} onChange={handleChange("phone")} error={errors.phone?.[0]} />
          <Input
            label="ID / verification information"
            required
            value={form.id_number}
            onChange={handleChange("id_number")}
            error={errors.id_number?.[0]}
          />
          <Input label="Password" type="password" required value={form.password} onChange={handleChange("password")} error={errors.password?.[0]} />
          <Input
            label="Confirm password"
            type="password"
            required
            value={form.confirm_password}
            onChange={handleChange("confirm_password")}
            error={errors.confirm_password?.[0]}
          />

          {errors.non_field_errors && (
            <p className="text-sm text-danger">{errors.non_field_errors[0]}</p>
          )}

          <Button type="submit" variant="secondary" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
