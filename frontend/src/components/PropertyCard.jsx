import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, GraduationCap } from "lucide-react";
import Badge from "./ui/Badge";
import ImageCarousel from "./ImageCarousel";

const statusLabel = {
  DRAFT: "Draft",
  PENDING_VERIFICATION: "Pending Verification",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Verified",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const statusVariant = {
  DRAFT: "neutral",
  PENDING_VERIFICATION: "pending",
  UNDER_REVIEW: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};

export default function PropertyCard({ property, variant = "public" }) {
  const images = property.images || (property.image ? [{ image: property.image }] : []);
  const linkTo = variant === "landlord" ? `/landlord/properties/${property.id}` : `/houses/${property.id}`;

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-52 bg-slate-100 relative">
        <ImageCarousel images={images} title={property.title} />
      </div>
      <Link to={linkTo} className="block p-5">
        {variant === "landlord" ? (
          <Badge status={statusVariant[property.verification_status]}>
            {statusLabel[property.verification_status]}
          </Badge>
        ) : (
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <ShieldCheck className="h-4 w-4" /> Verified Student Housing
          </div>
        )}

        <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{property.title}</h3>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {property.area}, {property.town}
        </div>

        {property.university && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {property.university.name || property.university}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Rent</span>
            <span className="font-extrabold text-slate-900 text-base">KES {Number(property.monthly_rent || 0).toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Availability</span>
            <span className="font-semibold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-full">{property.available_rooms} units</span>
          </div>
        </div>

        {variant === "landlord" && property.verification_status === "REJECTED" && property.rejection_reason && (
          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 border border-rose-200">
            {property.rejection_reason}
          </p>
        )}
      </Link>
    </div>
  );
}
