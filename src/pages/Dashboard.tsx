import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Trophy, Star, TrendingUp, ClipboardList, MapPin, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const badgeColors = {
  bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
  silver: "bg-gray-400/10 text-gray-500 border-gray-400/20",
  gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  platinum: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const CitizenDashboard = () => {
  const { profile } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome, {profile?.name}! 👋</h1>
        <p className="text-muted-foreground mt-1">Help keep Madurai clean today</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile?.total_points ?? 0}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <Badge className={badgeColors[profile?.badge_level ?? "bronze"]}>
              {profile?.badge_level ?? "Bronze"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Badge</p>
          </CardContent>
        </Card>
        <Link to="/report" className="col-span-2">
          <Card className="h-full border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Camera className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg">Report Garbage</p>
                <p className="text-sm text-muted-foreground">Take a photo and earn points</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/leaderboard">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">See where you rank among other citizens</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/rewards">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Redeem your points for rewards</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

const OfficerDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl md:text-3xl font-bold">Ward Officer Dashboard</h1>
    <div className="grid md:grid-cols-3 gap-4">
      <Link to="/ward-reports">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <ClipboardList className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-bold">Ward Reports</p>
            <p className="text-sm text-muted-foreground">View and manage reports</p>
          </CardContent>
        </Card>
      </Link>
      <Link to="/leaderboard">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Trophy className="h-10 w-10 text-accent mx-auto mb-3" />
            <p className="font-bold">Leaderboard</p>
            <p className="text-sm text-muted-foreground">Ward rankings</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl md:text-3xl font-bold">City Admin Dashboard</h1>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { to: "/complaints", icon: ClipboardList, label: "Complaints", desc: "Manage all reports" },
        { to: "/heatmap", icon: MapPin, label: "Heatmap", desc: "Live garbage map" },
        { to: "/analytics", icon: BarChart3, label: "Analytics", desc: "City-wide stats" },
        { to: "/leaderboard", icon: Trophy, label: "Leaderboard", desc: "Rankings" },
      ].map((item) => (
        <Link key={item.to} to={item.to}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <item.icon className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-bold">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const { role } = useAuth();

  return (
    <DashboardLayout>
      {role === "admin" ? (
        <AdminDashboard />
      ) : role === "ward_officer" ? (
        <OfficerDashboard />
      ) : (
        <CitizenDashboard />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
