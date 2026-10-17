import { Link, useNavigate } from "react-router-dom";
import { MapPin, ShieldCheck, GraduationCap, ArrowUpRight, Bed } from "lucide-react";
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

const formatPropertyType = (type) => {
  if (!type) return "Apartment";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function PropertyCard({ property, variant = "public" }) {
  const navigate = useNavigate();
  const images = property.images || (property.image ? [{ image: property.image }] : []);
  const linkTo = variant === "landlord" ? `/landlord/properties/${property.id}` : `/houses/${property.id}`;

  const handleCardClick = () => {
    navigate(linkTo);
  };

  const universityName = property.university?.name || (typeof property.university === "string" ? property.university : "");
  const locationText = [property.area, property.town].filter(Boolean).join(", ") || property.town || "Nearby Campus";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-slate-300">
      {/* Top Media Showcase with Carousel */}
      <div className="relative h-60 w-full overflow-hidden bg-slate-100">
        <ImageCarousel 
          images={images} 
          title={property.title} 
          rounded="rounded-t-3xl"
          onImageClick={handleCardClick}
        />

        {/* Floating Category Badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-sm">
            <Bed className="h-3 w-3" />
            {formatPropertyType(property.property_type)}
          </span>
        </div>

        {/* Verification or Status Badge */}
        <div className="absolute top-3 right-3 pointer-events-none">
          {variant === "landlord" ? (
            <Badge status={statusVariant[property.verification_status]}>
              {statusLabel[property.verification_status]}
            </Badge>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <Link to={linkTo} className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-extrabold text-slate-900 transition-colors group-hover:text-primary line-clamp-1 leading-snug">
              {property.title}
            </h3>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 line-clamp-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{locationText}</span>
          </div>

          {universityName && (
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary/90 line-clamp-1">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span>Near {universityName}</span>
            </div>
          )}
        </div>

        {/* Financial & Availability Specs */}
        <div className="border-t border-slate-100 pt-3.5 flex items-end justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester Rent</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">
                KES {Number(property.semester_rent || 0).toLocaleString()}   
              </span>
              <span className="text-xs text-slate-400 font-medium">/ sem</span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              property.available_rooms > 0 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${property.available_rooms > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {property.available_rooms > 0 ? `${property.available_rooms} units` : "Full"}
            </span>
          </div>
        </div>

        {variant === "landlord" && property.verification_status === "REJECTED" && property.rejection_reason && (
          <p className="rounded-xl bg-rose-50 p-2.5 text-xs font-medium text-rose-700 border border-rose-200">
            <strong>Rejection reason:</strong> {property.rejection_reason}
          </p>
        )}
      </Link>
    </div>
  );
}
