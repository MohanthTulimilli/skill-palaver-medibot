import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserRole } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/dashboard/Dashboard";
import PatientOnboarding from "@/pages/patients/PatientOnboarding";
import ClaimsManagement from "@/pages/claims/ClaimsManagement";
import BillingPayments from "@/pages/billing/BillingPayments";
import AIMonitoring from "@/pages/ai-monitoring/AIMonitoring";
import Analytics from "@/pages/analytics/Analytics";
import SettingsPage from "@/pages/settings/Settings";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Index from "@/pages/Index";
import MyDashboard from "@/pages/patient/MyDashboard";
import MyClaims from "@/pages/patient/MyClaims";
import PaymentHistory from "@/pages/patient/PaymentHistory";
import MakePayment from "@/pages/patient/MakePayment";
import Support from "@/pages/patient/Support";
import BookAppointment from "@/pages/patient/BookAppointment";
import AuditLogs from "@/pages/admin/AuditLogs";
import AutomationLogs from "@/pages/ai-analyst/AutomationLogs";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorAppointments from "@/pages/doctor/DoctorAppointments";
import DoctorAssignCare from "@/pages/doctor/DoctorAssignCare";
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";
import ManageHospitals from "@/pages/super-admin/ManageHospitals";
import SuperAdminUsers from "@/pages/super-admin/SuperAdminUsers";
import HospitalAdminDashboard from "@/pages/hospital-admin/HospitalAdminDashboard";
import HospitalAdminUsers from "@/pages/hospital-admin/HospitalAdminUsers";
import HospitalAdminPatientApprovals from "@/pages/hospital-admin/HospitalAdminPatientApprovals";
import ServiceCatalog from "@/pages/admin/ServiceCatalog";
import Departments from "@/pages/admin/Departments";
import TestBooking from "@/pages/patient/TestBooking";
import OperationScheduling from "@/pages/admin/OperationScheduling";
import OperationTheatreManagement from "@/pages/admin/OperationTheatreManagement";
import LabReportUpload from "@/pages/admin/LabReportUpload";
import DepartmentAnalytics from "@/pages/admin/DepartmentAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<Index />} />
              <Route element={<DashboardLayout />}>
                {/* Super Admin */}
                <Route path="/super-admin/dashboard" element={
                  <ProtectedRoute roles={[UserRole.SUPER_ADMIN]}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/hospitals" element={
                  <ProtectedRoute roles={[UserRole.SUPER_ADMIN]}>
                    <ManageHospitals />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/users" element={
                  <ProtectedRoute roles={[UserRole.SUPER_ADMIN]}>
                    <SuperAdminUsers />
                  </ProtectedRoute>
                } />
                {/* Hospital Admin */}
                <Route path="/hospital-admin/dashboard" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <HospitalAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/hospital-admin/users" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <HospitalAdminUsers />
                  </ProtectedRoute>
                } />
                <Route path="/hospital-admin/patient-approvals" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <HospitalAdminPatientApprovals />
                  </ProtectedRoute>
                } />
                {/* Shared staff routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute roles={[UserRole.BILLING, UserRole.INSURANCE]}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/my-dashboard" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <MyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/patients" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN, UserRole.BILLING, UserRole.INSURANCE]}>
                    <PatientOnboarding />
                  </ProtectedRoute>
                } />
                <Route path="/claims" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN, UserRole.BILLING, UserRole.INSURANCE, UserRole.AI_ANALYST]}>
                    <ClaimsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/my-claims" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <MyClaims />
                  </ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN, UserRole.BILLING, UserRole.PATIENT]}>
                    <BillingPayments />
                  </ProtectedRoute>
                } />
                <Route path="/payment-history" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <PaymentHistory />
                  </ProtectedRoute>
                } />
                <Route path="/make-payment" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <MakePayment />
                  </ProtectedRoute>
                } />
                <Route path="/book-appointment" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <BookAppointment />
                  </ProtectedRoute>
                } />
                <Route path="/test-booking" element={
                  <ProtectedRoute roles={[UserRole.PATIENT, UserRole.HOSPITAL_ADMIN]}>
                    <TestBooking />
                  </ProtectedRoute>
                } />
                <Route path="/patient-onboarding" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <PatientOnboarding />
                  </ProtectedRoute>
                } />
                <Route path="/ai-monitoring" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN, UserRole.AI_ANALYST, UserRole.INSURANCE]}>
                    <AIMonitoring />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.BILLING, UserRole.AI_ANALYST, UserRole.INSURANCE]}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/audit-logs" element={
                  <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
                <Route path="/automation-logs" element={
                  <ProtectedRoute roles={[UserRole.AI_ANALYST, UserRole.HOSPITAL_ADMIN]}>
                    <AutomationLogs />
                  </ProtectedRoute>
                } />
                <Route path="/doctor-dashboard" element={
                  <ProtectedRoute roles={[UserRole.DOCTOR]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/doctor-appointments" element={
                  <ProtectedRoute roles={[UserRole.DOCTOR]}>
                    <DoctorAppointments />
                  </ProtectedRoute>
                } />
                <Route path="/doctor-assign-care" element={
                  <ProtectedRoute roles={[UserRole.DOCTOR]}>
                    <DoctorAssignCare />
                  </ProtectedRoute>
                } />
                <Route path="/service-catalog" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <ServiceCatalog />
                  </ProtectedRoute>
                } />
                <Route path="/departments" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <Departments />
                  </ProtectedRoute>
                } />
                <Route path="/operation-scheduling" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <OperationScheduling />
                  </ProtectedRoute>
                } />
                <Route path="/operation-theatre" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <OperationTheatreManagement />
                  </ProtectedRoute>
                } />
                <Route path="/lab-reports" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <LabReportUpload />
                  </ProtectedRoute>
                } />
                <Route path="/department-analytics" element={
                  <ProtectedRoute roles={[UserRole.HOSPITAL_ADMIN]}>
                    <DepartmentAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.BILLING, UserRole.INSURANCE, UserRole.AI_ANALYST, UserRole.PATIENT, UserRole.DOCTOR]}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/support" element={
                  <ProtectedRoute roles={[UserRole.PATIENT]}>
                    <Support />
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
