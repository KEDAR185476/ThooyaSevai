import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Recycle, Home, Camera, Trophy, Gift, Users, ClipboardList,
  Map, BarChart3, LogOut, Menu, X, Shield, GraduationCap, Building2, Package, IndianRupee
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home, roles: ["citizen", "student", "ward_officer", "admin", "scrap_dealer"] },
    { path: "/report", label: "Report Garbage", icon: Camera, roles: ["citizen", "student"] },
    { path: "/sell-waste", label: "Sell Waste", icon: IndianRupee, roles: ["citizen", "student"] },
    { path: "/my-listings", label: "My Listings", icon: Package, roles: ["citizen", "student"] },
    { path: "/dealer-dashboard", label: "Browse Listings", icon: Package, roles: ["scrap_dealer"] },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy, roles: ["citizen", "student", "ward_officer", "admin"] },
    { path: "/rewards", label: "Rewards", icon: Gift, roles: ["citizen", "student"] },
    { path: "/families", label: "My Families", icon: Users, roles: ["student"] },
    { path: "/ward-reports", label: "Ward Reports", icon: ClipboardList, roles: ["ward_officer"] },
    { path: "/complaints", label: "Complaints", icon: ClipboardList, roles: ["admin"] },
    { path: "/heatmap", label: "Heatmap", icon: Map, roles: ["admin"] },
    { path: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter((item) => !role || item.roles.includes(role));

  const roleIcon: Record<string, React.ReactNode> = {
    citizen: <Users className="h-4 w-4" />,
    student: <GraduationCap className="h-4 w-4" />,
    ward_officer: <Shield className="h-4 w-4" />,
    admin: <Building2 className="h-4 w-4" />,
    scrap_dealer: <Package className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Recycle className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">Clean Madurai</p>
            <p className="text-[10px] text-sidebar-accent-foreground/70 truncate">{profile?.name || "Loading..."}</p>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {role && (
          <div className="px-4 py-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {roleIcon[role]} {role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Recycle className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Clean Madurai</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
