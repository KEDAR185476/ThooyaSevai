import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, MapPin, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(152,60%,36%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

const Analytics = () => {
  const { data: reports } = useQuery({
    queryKey: ["analytics-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: wards } = useQuery({
    queryKey: ["analytics-wards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").order("ward_number");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!reports) return { total: 0, pending: 0, assigned: 0, resolved: 0, byType: [], byStatus: [] };
    const total = reports.length;
    const pending = reports.filter((r) => r.status === "pending").length;
    const assigned = reports.filter((r) => r.status === "assigned").length;
    const resolved = reports.filter((r) => r.status === "resolved").length;

    const typeMap = new Map<string, number>();
    reports.forEach((r) => {
      const t = r.waste_type ?? "unknown";
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
    });
    const byType = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
    const byStatus = [
      { name: "Resolved", value: resolved },
      { name: "Assigned", value: assigned },
      { name: "Pending", value: pending },
    ];
    return { total, pending, assigned, resolved, byType, byStatus };
  }, [reports]);

  const wardChart = useMemo(() => {
    if (!wards) return [];
    return wards.map((w) => ({
      name: `W${w.ward_number}`,
      score: Number(w.cleanliness_score),
      reports: w.total_reports,
    }));
  }, [wards]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">City Analytics 📊</h1>
          <p className="text-muted-foreground mt-1">City-wide garbage management statistics</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BarChart3, label: "Total Reports", value: stats.total, color: "text-primary" },
            { icon: CheckCircle, label: "Resolved", value: stats.resolved, color: "text-primary" },
            { icon: Clock, label: "Assigned", value: stats.assigned, color: "text-accent" },
            { icon: AlertTriangle, label: "Pending", value: stats.pending, color: "text-destructive" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <item.icon className={`h-7 w-7 mx-auto mb-2 ${item.color}`} />
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Status pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {stats.byStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ward scores bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ward Cleanliness Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wardChart}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(152,60%,36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waste type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Waste Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byType} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(38,92%,50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
