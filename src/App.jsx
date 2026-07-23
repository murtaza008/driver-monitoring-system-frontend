import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import DriverList from "./pages/DriverList";
import AddDriver from "./pages/AddDriver";
import EditDriver from "./pages/EditDriver";
import DriverProfile from "./pages/DriverProfile";
import TodayViolations from "./pages/TodayViolations";
import AllViolations from "./pages/AllViolations";
import DailyReport from "./pages/DailyReport";
import Summary from "./pages/Summary";
import Settings from "./pages/Settings";
import AccountManagement from "./pages/AccountManagement";
import PerformanceThresholds from "./pages/PerformanceThresholds";
import AutomatedNotifications from "./pages/AutomatedNotifications";
import PenaltySettings from "./pages/PenaltySettings";
import SendMessage from "./pages/SendMessage";
import Messages from "./pages/Messages";
import SeverityInfo from "./pages/SeverityInfo";
import LiveTracking from "./pages/LiveTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/drivers" element={<ProtectedPage><DriverList /></ProtectedPage>} />
            <Route path="/drivers/add" element={<ProtectedPage><AddDriver /></ProtectedPage>} />
            <Route path="/drivers/:id" element={<ProtectedPage><DriverProfile /></ProtectedPage>} />
            <Route path="/drivers/:id/edit" element={<ProtectedPage><EditDriver /></ProtectedPage>} />
            <Route path="/violations/today" element={<ProtectedPage><TodayViolations /></ProtectedPage>} />
            <Route path="/violations/all" element={<ProtectedPage><AllViolations /></ProtectedPage>} />
            <Route path="/daily-report" element={<ProtectedPage><DailyReport /></ProtectedPage>} />
            <Route path="/summary" element={<ProtectedPage><Summary /></ProtectedPage>} />
            <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
            <Route path="/settings/account" element={<ProtectedPage><AccountManagement /></ProtectedPage>} />
            <Route path="/settings/thresholds" element={<ProtectedPage><PerformanceThresholds /></ProtectedPage>} />
            <Route path="/settings/notifications" element={<ProtectedPage><AutomatedNotifications /></ProtectedPage>} />
            <Route path="/settings/penalties" element={<ProtectedPage><PenaltySettings /></ProtectedPage>} />
            <Route path="/severity-info" element={<ProtectedPage><SeverityInfo /></ProtectedPage>} />
            <Route path="/live-tracking" element={<ProtectedPage><LiveTracking /></ProtectedPage>} />
            <Route path="/messages" element={<ProtectedPage><Messages /></ProtectedPage>} />
            <Route path="/send-message" element={<ProtectedPage><SendMessage /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
