import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, AlertCircle, RefreshCw } from "lucide-react";
import { listMyProperties } from "../../services/properties";
import PropertyCard from "../../components/PropertyCard";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

export default function LandlordProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProperties = useCallback(async (isManualReload = false) => {
    if (isManualReload) {
      setLoading(true);
      setError("");
    }
    
    try {
      const response = await listMyProperties();

      const propertyList = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setProperties(propertyList);
    } catch (err) {
      console.error("Failed to load landlord properties:", err);
      setError(
        err.response?.status === 401
          ? "Authentication required. Please log in again."
          : "Failed to load properties. Please try again."
      );
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const response = await listMyProperties();
        if (!ignore) {
          const propertyList = Array.isArray(response)
            ? response
            : Array.isArray(response?.results)
            ? response.results
            : Array.isArray(response?.data?.results)
            ? response.data.results
            : Array.isArray(response?.data)
            ? response.data
            : [];

          setProperties(propertyList);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load landlord properties:", err);
          setError(
            err.response?.status === 401
              ? "Authentication required. Please log in again."
              : "Failed to load properties. Please try again."
          );
          setProperties([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      {/* Header Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all real estate listings created under your account.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchProperties(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload
          </Button>
          <Link to="/landlord/properties/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchProperties(true)}
            className="font-semibold text-red-800 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid State */}
      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-slate-200/60"
            />
          ))}
        </div>
      ) : properties.length === 0 && !error ? (
        <Card className="mt-8 flex flex-col items-center justify-center border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No properties found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            You haven't listed any properties yet. Click below to add your first property.
          </p>
          <Link to="/landlord/properties/new" className="mt-6">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Property
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(properties) &&
            properties.map((p) => (
              <PropertyCard key={p.id} property={p} variant="landlord" />
            ))}
        </div>
      )}
    </div>
  );
}