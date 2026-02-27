import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ReportGarbage from "./pages/ReportGarbage";
import SellWaste from "./pages/SellWaste";
import MyListings from "./pages/MyListings";
import DealerDashboard from "./pages/DealerDashboard";
import NotFound from "./pages/NotFound";
import Heatmap from "./pages/Heatmap";
import Leaderboard from "./pages/Leaderboard";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Placeholder routes - will be built in next phases */}
            <Route path="/report" element={<ProtectedRoute><ReportGarbage /></ProtectedRoute>} />
            <Route path="/sell-waste" element={<ProtectedRoute><SellWaste /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            <Route path="/dealer-dashboard" element={<ProtectedRoute allowedRoles={["scrap_dealer"]}><DealerDashboard /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/families" element={<ProtectedRoute allowedRoles={["student"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/ward-reports" element={<ProtectedRoute allowedRoles={["ward_officer"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute allowedRoles={["admin"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/heatmap" element={<ProtectedRoute allowedRoles={["admin"]}><Heatmap /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><Analytics /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
