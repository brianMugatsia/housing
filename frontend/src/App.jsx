import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import PublicLayout from "./layouts/PublicLayout";
import LandlordLayout from "./layouts/LandlordLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import LandingPage from "./pages/landing/LandingPage";
import HousesPage from "./pages/HousesPage";
import Login from "./pages/auth/Login";
import RegisterChoice from "./pages/auth/RegisterChoice";
import RegisterStudent from "./pages/auth/RegisterStudent";
import RegisterLandlord from "./pages/auth/RegisterLandlord";
import NotFound from "./pages/NotFound";
import BookingPage from "./pages/bookings/BookingPage";
import HouseDetails from "./pages/student/HouseDetails";

import StudentDashboard from "./pages/student/StudentDashboard";
import LandlordDashboard from "./pages/landlord/LandlordDashboard";
import LandlordProperties from "./pages/landlord/LandlordProperties";
import AddProperty from "./pages/landlord/AddProperty";
import LandlordBookings from "./pages/landlord/LandlordBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import PaymentPage from "./pages/payment/PaymentPage";
import AdminPayments from "./pages/admin/AdminPayments";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/houses" element={<HousesPage />} />
            <Route path="/houses/:id" element={<HouseDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterChoice />} />
            <Route path="/register/student" element={<RegisterStudent />} />
            <Route path="/register/landlord" element={<RegisterLandlord />} />
          </Route>

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:houseId"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pay/:bookingId"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          {/* Landlord Protected Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["LANDLORD"]}>
                <LandlordLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
            <Route path="/landlord/properties" element={<LandlordProperties />} />
            <Route path="/landlord/properties/new" element={<AddProperty />} />
            <Route path="/landlord/properties/:id" element={<AddProperty />} />
            <Route path="/landlord/bookings" element={<LandlordBookings />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
