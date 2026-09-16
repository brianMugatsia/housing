import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Upload, X, Check } from "lucide-react";
import api from "../../services/api";
import {
  getProperty,
  createProperty,
  updateProperty,
  submitProperty,
  uploadPropertyImages,
  deletePropertyImage,
  listAmenities,
} from "../../services/properties";
import { PROPERTY_TYPES, ROOM_TYPES, GENDER_RESTRICTIONS } from "../../utils/constants";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Checkbox from "../../components/ui/Checkbox";
import Button from "../../components/ui/Button";

const STEPS = ["Basic Info", "Location", "Pricing", "Amenities", "Photos", "Review"];

const emptyForm = {
  title: "", property_type: "", room_type: "", description: "",
  university: "", county: "", town: "", area: "", address: "", distance_from_university: "",
  monthly_rent: "", deposit: "", total_rooms: "", available_rooms: "",
  gender_restriction: "NONE", amenity_ids: [],
};

export default function AddProperty() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [universities, setUniversities] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [existingStatus, setExistingStatus] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/auth/universities/").then((res) => setUniversities(res.data.results || res.data)).catch(() => {});
    listAmenities().then(setAmenities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getProperty(id)
      .then((p) => {
        setForm({
          title: p.title, property_type: p.property_type, room_type: p.room_type,
          description: p.description, university: p.university?.id || "",
          county: p.county, town: p.town, area: p.area, address: p.address || "",
          distance_from_university: p.distance_from_university || "",
          monthly_rent: p.monthly_rent, deposit: p.deposit,
          total_rooms: p.total_rooms, available_rooms: p.available_rooms,
          gender_restriction: p.gender_restriction, amenity_ids: p.amenities.map((a) => a.id),
        });
        setExistingImages(p.images);
        setExistingStatus(p.verification_status);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleAmenity = (amenityId) => {
    setForm((f) => ({
      ...f,
      amenity_ids: f.amenity_ids.includes(amenityId)
        ? f.amenity_ids.filter((a) => a !== amenityId)
        : [...f.amenity_ids, amenityId],
    }));
  };

  const handleFileChange = (e) => {
    setNewFiles([...newFiles, ...Array.from(e.target.files)]);
  };

  const removeNewFile = (index) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId) => {
    await deletePropertyImage(id, imageId);
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
  };

  const validateStep = () => {
    if (step === 0) return form.title && form.property_type && form.room_type && form.description;
    if (step === 1) return form.university && form.county && form.town && form.area;
    if (step === 2) return form.monthly_rent && form.total_rooms && form.available_rooms;
    return true;
  };

  const next = () => {
    if (!validateStep()) {
      setError("Please fill in all required fields before continuing.");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      let propertyId = id;
      if (isEdit) {
        await updateProperty(id, form);
      } else {
        const created = await createProperty(form);
        propertyId = created.id;
      }

      if (newFiles.length > 0) {
        await uploadPropertyImages(propertyId, newFiles);
      }

      if (!isEdit || existingStatus === "DRAFT" || existingStatus === "REJECTED") {
        await submitProperty(propertyId);
      }

      navigate("/landlord/properties");
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object" && data
          ? Object.values(data).flat().join(" ")
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading property…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEdit ? "Edit Property" : "Add New Property"}
      </h1>

      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i <= step ? "bg-primary text-white" : "bg-gray-100 text-slate-400"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < step ? "bg-primary" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-500">{STEPS[step]}</p>

      <Card className="mt-6">
        {step === 0 && (
          <div className="space-y-4">
            <Input label="Property name" required value={form.title} onChange={update("title")} />
            <Select
              label="Property type" required placeholder="Select type"
              value={form.property_type} onChange={update("property_type")}
              options={PROPERTY_TYPES}
            />
            <Select
              label="Room type" required placeholder="Select room type"
              value={form.room_type} onChange={update("room_type")}
              options={ROOM_TYPES}
            />
            <Textarea label="Description" required value={form.description} onChange={update("description")} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Select
              label="University" required placeholder="Select nearest university"
              value={form.university} onChange={update("university")}
              options={universities.map((u) => ({ value: u.id, label: u.name }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="County" required value={form.county} onChange={update("county")} />
              <Input label="Town" required value={form.town} onChange={update("town")} />
            </div>
            <Input label="Area / Estate" required value={form.area} onChange={update("area")} />
            <Input label="Street address (optional)" value={form.address} onChange={update("address")} />
            <Input
              label="Distance from university (km)" type="number" step="0.1"
              value={form.distance_from_university} onChange={update("distance_from_university")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Monthly rent (KES)" type="number" required value={form.monthly_rent} onChange={update("monthly_rent")} />
              <Input label="Deposit (KES)" type="number" value={form.deposit} onChange={update("deposit")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Total rooms" type="number" required value={form.total_rooms} onChange={update("total_rooms")} />
              <Input label="Available rooms" type="number" required value={form.available_rooms} onChange={update("available_rooms")} />
            </div>
            <Select
              label="Gender restriction" value={form.gender_restriction} onChange={update("gender_restriction")}
              options={GENDER_RESTRICTIONS}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Select available amenities</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {amenities.map((a) => (
                <Checkbox
                  key={a.id}
                  label={a.name}
                  checked={form.amenity_ids.includes(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">
              Upload photos (exterior, rooms, bathroom, kitchen)
            </p>

            {existingImages.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={img.image} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => handleDeleteExistingImage(img.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-8 text-slate-400 hover:border-primary hover:text-primary">
              <Upload className="h-6 w-6" />
              <span className="mt-2 text-sm">Click to select images</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            {newFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {newFiles.map((file, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeNewFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold text-slate-800">Review your listing</h3>
            <p><span className="text-slate-500">Title:</span> {form.title}</p>
            <p><span className="text-slate-500">Type:</span> {form.property_type} / {form.room_type}</p>
            <p><span className="text-slate-500">Location:</span> {form.area}, {form.town}, {form.county}</p>
            <p><span className="text-slate-500">Rent:</span> KES {form.monthly_rent}/mo, Deposit: KES {form.deposit || 0}</p>
            <p><span className="text-slate-500">Rooms:</span> {form.available_rooms} available of {form.total_rooms}</p>
            <p><span className="text-slate-500">Amenities:</span> {form.amenity_ids.length} selected</p>
            <p><span className="text-slate-500">Photos:</span> {existingImages.length + newFiles.length} total</p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={back} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              {isEdit && existingStatus === "APPROVED" ? "Save Changes" : "Submit for Verification"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
