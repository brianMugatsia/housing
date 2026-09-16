import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, GraduationCap } from "lucide-react";
import Badge from "./ui/Badge";

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
  const image = property.images?.[0]?.image;
  const linkTo = variant === "landlord" ? `/landlord/properties/${property.id}` : `/houses/${property.id}`;

  return (
    <Link
      to={linkTo}
      className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
    >
      <div className="h-40 bg-gray-100">
        {image && <img src={image} alt={property.title} className="h-full w-full object-cover" />}
      </div>
      <div className="p-4">
        {variant === "landlord" ? (
          <Badge status={statusVariant[property.verification_status]}>
            {statusLabel[property.verification_status]}
          </Badge>
        ) : (
          <div className="flex items-center gap-1 text-xs font-medium text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </div>
        )}

        <h3 className="mt-2 font-semibold text-slate-800">{property.title}</h3>

        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> {property.area}, {property.town}
        </div>

        {property.university && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <GraduationCap className="h-3.5 w-3.5" /> {property.university.name}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="font-bold text-primary">KES {Number(property.monthly_rent).toLocaleString()}/mo</p>
          <p className="text-xs text-slate-500">{property.available_rooms} available</p>
        </div>

        {variant === "landlord" && property.verification_status === "REJECTED" && property.rejection_reason && (
          <p className="mt-2 rounded-lg bg-danger/10 px-2 py-1 text-xs text-danger">
            {property.rejection_reason}
          </p>
        )}
      </div>
    </Link>
  );
}
