import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  GraduationCap, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronDown,
  Check
} from "lucide-react";
import api from "../../services/api";

// Matches backend PropertyType TextChoices explicitly
const PROPERTY_TYPES = [
  { label: "Bedsitter", value: "BEDSITTER" },
  { label: "Single Room", value: "SINGLE_ROOM" },
  { label: "One Bedroom", value: "ONE_BEDROOM" },
  { label: "Two Bedroom", value: "TWO_BEDROOM" },
  { label: "Hostel", value: "HOSTEL" },
  { label: "Shared Room", value: "SHARED_ROOM" },
];

const AMENITIES_LIST = [
  "WiFi Included", 
  "Borehole Water", 
  "CCTV / Security", 
  "Hot Shower", 
  "Backup Generator", 
  "Gated", 
  "Balcony", 
  "Study Desk", 
  "Prepaid Electricity"
];

export default function AddProperty() {
  const navigate = useNavigate();
  const uniDropdownRef = useRef(null);

  // Navigation & UI States
  const [currentStep, setCurrentStep] = useState(1);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUniversities, setFetchingUniversities] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitWarning, setSubmitWarning] = useState("");

  // Searchable Select State for Universities
  const [uniSearch, setUniSearch] = useState("");
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);

  // Form Field States
  const [formData, setFormData] = useState({
    title: "",
    property_type: "BEDSITTER",
    room_type: "SINGLE_OCCUPANCY",
    gender_restriction: "NONE",
    description: "",
    university: "",
    county: "",
    town: "",
    address: "",
    semester_rent: "",
    amenities: [],
  });

  // Room Grid State
  const [totalUnits, setTotalUnits] = useState(20);
  const [selectedUnits, setSelectedUnits] = useState([1, 3, 6, 11, 13, 16]);

  // Image Upload States
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Fetch Universities
  const fetchUniversities = async () => {
    setFetchingUniversities(true);
    try {
      const res = await api.get("properties/universities/");
      let data = [];
      
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (Array.isArray(res.data?.results)) {
        data = res.data.results;
      } else if (Array.isArray(res.data?.data)) {
        data = res.data.data;
      }
      
      setUniversities(data);
    } catch (err) {
      console.error("Failed to fetch universities:", err);
    } finally {
      setFetchingUniversities(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUniversities();
    })();
  }, []);

  // Handle outside clicks for University Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(event.target)) {
        setUniDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Memory Cleanup for Object URLs
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Text / Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Total Units Handler
  const handleTotalUnitsChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 0);
    setTotalUnits(count);
    setSelectedUnits((prev) => prev.filter((unitNum) => unitNum <= count));
  };

  // Room Toggle Handler
  const toggleUnitSelection = (unitNum) => {
    setSelectedUnits((prev) =>
      prev.includes(unitNum)
        ? prev.filter((num) => num !== unitNum)
        : [...prev, unitNum]
    );
  };

  // Checkbox / Amenity Handler
  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter((item) => item !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  // Image Selection Handler
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Step Validation
  const validateStep = () => {
    setError("");
    if (currentStep === 1) {
      if (!formData.title.trim() || !formData.description.trim()) {
        setError("Please enter a listing title and description.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.university || !formData.town.trim() || !formData.county.trim()) {
        setError("Please select a university and fill in location fields.");
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.semester_rent || Number(formData.semester_rent) <= 0) {
        setError("Please enter a valid rent amount.");
        return false;
      }
      if (totalUnits <= 0) {
        setError("Please specify total units in property.");
        return false;
      }
    } else if (currentStep === 4) {
      if (imageFiles.length === 0) {
        setError("Please upload at least one property image before submitting.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Filtered Universities for Searchable Select
  const filteredUniversities = universities.filter((uni) => {
    const name = uni.name || uni.title || "";
    return name.toLowerCase().includes(uniSearch.toLowerCase());
  });

  const selectedUniObj = universities.find((u) => String(u.id || u.pk) === String(formData.university));

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError("");
    setSubmitWarning("");

    try {
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("property_type", formData.property_type);
      payload.append("room_type", formData.room_type);
      payload.append("gender_restriction", formData.gender_restriction);
      payload.append("description", formData.description.trim());
      payload.append("university", formData.university);
      payload.append("county", formData.county.trim());
      payload.append("town", formData.town.trim());
      payload.append("address", formData.address.trim());
      payload.append("semester_rent", formData.semester_rent);
      payload.append("deposit", 0);

      // Quantities matching Property model fields
      payload.append("total_rooms", totalUnits);
      payload.append("available_rooms", selectedUnits.length);

      // Unit numbers JSON array for available_room_numbers JSONField
      const availableRoomLabels = selectedUnits.sort((a, b) => a - b).map((num) => `Room ${num}`);
      payload.append("available_room_numbers", JSON.stringify(availableRoomLabels));

      // Amenities JSON array for PropertyWriteSerializer string parser
      payload.append("amenities", JSON.stringify(formData.amenities));

      // Append files for PropertyImage model creation
      imageFiles.forEach((file) => {
        payload.append("uploaded_images", file);
      });

      // Step 1: Create the property (lands as DRAFT on the backend)
      const createRes = await api.post("properties/", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newPropertyId = createRes.data?.id;

      // Step 2: Immediately submit it for admin review, since photos
      // were already attached in the same request. This moves it from
      // DRAFT -> PENDING_VERIFICATION so it shows correctly in "My
      // Properties" and in the admin dashboard's Pending queue.
      if (newPropertyId) {
        try {
          await api.post(`properties/${newPropertyId}/submit/`);
        } catch (submitErr) {
          console.error("Property created but failed to submit for review:", submitErr);
          setSubmitWarning(
            "Your listing was saved, but we couldn't automatically send it for review. " +
            "Please open it from 'My Properties' and submit it for verification."
          );
        }
      }

      setSuccess(true);
      setTimeout(() => navigate("/landlord/properties"), 2000);
    } catch (err) {
      console.error("DRF error response:", err.response?.data);
      const resData = err.response?.data;
      if (resData && typeof resData === "object") {
        const parsedErrors = Object.entries(resData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ");
        setError(parsedErrors || "Failed to submit property. Please verify your inputs.");
      } else {
        setError("Failed to submit property. Please verify your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-xl my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Property Submitted!</h2>
        <p className="text-sm text-slate-500">
          Your listing has been sent for administrative verification and will appear as{" "}
          <span className="font-semibold text-amber-600">Pending Review</span> until an admin
          approves it. It won't be visible to students until then. Redirecting you to your
          properties...
        </p>
        {submitWarning && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {submitWarning}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">List New Property</h1>
        <p className="mt-1 text-sm text-slate-500">
          Provide accurate details to list your student housing unit for verification.
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        {[
          { step: 1, label: "Basic Info" },
          { step: 2, label: "Location" },
          { step: 3, label: "Pricing & Units" },
          { step: 4, label: "Photos & Submit" }
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= item.step
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {item.step}
            </span>
            <span className={`text-xs font-medium hidden sm:inline ${currentStep >= item.step ? "text-slate-900" : "text-slate-400"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" /> Basic Property Details
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Property Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Sunrise Student Hostels, Studio 4B"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Property Type *
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Gender Restriction
                </label>
                <select
                  name="gender_restriction"
                  value={formData.gender_restriction}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="NONE">No restriction</option>
                  <option value="MALE_ONLY">Male only</option>
                  <option value="FEMALE_ONLY">Female only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe key features, house rules, nearby conveniences..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-500" /> Location Details
              </h2>
              <button
                type="button"
                onClick={fetchUniversities}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                title="Reload Universities"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingUniversities ? "animate-spin" : ""}`} /> Reload
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Nearby University *
              </label>
              <div className="relative" ref={uniDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUniDropdownOpen((prev) => !prev)}
                  disabled={fetchingUniversities}
                  className="w-full flex items-center justify-between pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-left text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                >
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <span className={selectedUniObj ? "text-slate-900" : "text-slate-400"}>
                    {fetchingUniversities
                      ? "Loading universities..."
                      : selectedUniObj
                      ? (selectedUniObj.name || selectedUniObj.title)
                      : "-- Select Target University --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {uniDropdownOpen && !fetchingUniversities && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search university..."
                        value={uniSearch}
                        onChange={(e) => setUniSearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredUniversities.length === 0 ? (
                        <li className="p-3 text-slate-400 text-center">No matching universities</li>
                      ) : (
                        filteredUniversities.map((uni) => {
                          const val = uni.id || uni.pk;
                          return (
                            <li
                              key={val || uni.name}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, university: val }));
                                setUniDropdownOpen(false);
                                setUniSearch("");
                              }}
                              className="p-2.5 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              {uni.name || uni.title}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  County *
                </label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  placeholder="e.g., Uasin Gishu"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Town / Suburb *
                </label>
                <input
                  type="text"
                  name="town"
                  value={formData.town}
                  onChange={handleChange}
                  placeholder="e.g., Eldoret"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Specific Street Address / Landmark
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., Off Annex Campus Gate B"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  SEMESTER RENT (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  name="semester_rent"
                  value={formData.semester_rent}
                  onChange={handleChange}
                  placeholder="30000"
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="mt-1.5 text-xs text-slate-500 font-medium">Students pay this full amount directly upon approval (no separate deposit required).</p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  TOTAL UNITS IN PROPERTY
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalUnits}
                  onChange={handleTotalUnitsChange}
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  SELECT WHICH UNITS ARE CURRENTLY AVAILABLE
                </label>
                
                <div className="border border-slate-200 rounded-2xl p-4 max-h-72 overflow-y-auto bg-slate-50/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: totalUnits }, (_, i) => {
                      const roomNum = i + 1;
                      const isSelected = selectedUnits.includes(roomNum);
                      return (
                        <button
                          key={roomNum}
                          type="button"
                          onClick={() => toggleUnitSelection(roomNum)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-100/80 border-slate-900 text-slate-900 shadow-sm"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <span>Room {roomNum}</span>
                          {isSelected && <Check className="w-4 h-4 text-slate-900" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Amenities & Perks</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES_LIST.map((amenity) => {
                  const active = formData.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? "bg-slate-900 text-white border-slate-900 font-semibold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-slate-500" /> Upload Property Images
            </h2>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Click to upload or drag images here</p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, or WEBP up to 5MB each</p>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Listing"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}