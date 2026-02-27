import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface WardHeatData {
  id: string;
  name: string;
  ward_number: number;
  total_reports: number;
  resolved_reports: number;
  pending: number;
  severity: "red" | "yellow" | "green";
}

const severityConfig = {
  red: {
    label: "Heavy Garbage",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
  yellow: {
    label: "Medium",
    bg: "bg-accent/10",
    border: "border-accent/30",
    text: "text-accent",
    badge: "bg-accent/15 text-accent border-accent/30",
    dot: "bg-accent",
  },
  green: {
    label: "Clean",
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
    badge: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
};

const Heatmap = () => {
  const { data: wards } = useQuery({
    queryKey: ["wards-heat"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").order("ward_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["reports-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("ward_id, status");
      if (error) throw error;
      return data;
    },
  });

  const heatData: WardHeatData[] = useMemo(() => {
    if (!wards) return [];
    return wards.map((ward) => {
      const wardReports = reports?.filter((r) => r.ward_id === ward.id) ?? [];
      const pending = wardReports.filter((r) => r.status !== "resolved").length;
      const severity: "red" | "yellow" | "green" = pending >= 8 ? "red" : pending >= 4 ? "yellow" : "green";
      return {
        id: ward.id,
        name: ward.name,
        ward_number: ward.ward_number,
        total_reports: wardReports.length,
        resolved_reports: wardReports.filter((r) => r.status === "resolved").length,
        pending,
        severity,
      };
    });
  }, [wards, reports]);

  const counts = useMemo(() => ({
    red: heatData.filter((w) => w.severity === "red").length,
    yellow: heatData.filter((w) => w.severity === "yellow").length,
    green: heatData.filter((w) => w.severity === "green").length,
  }), [heatData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Live Garbage Heatmap 🗺️</h1>
          <p className="text-muted-foreground mt-1">Real-time garbage density across Madurai wards</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(["red", "yellow", "green"] as const).map((level) => {
            const cfg = severityConfig[level];
            return (
              <div key={level} className="flex items-center gap-2 text-sm">
                <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
                <span className="text-muted-foreground">
                  {cfg.label} ({counts[level]})
                </span>
              </div>
            );
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-destructive/20">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.red}</p>
              <p className="text-xs text-muted-foreground">Red Zones</p>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.yellow}</p>
              <p className="text-xs text-muted-foreground">Yellow Zones</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.green}</p>
              <p className="text-xs text-muted-foreground">Clean Zones</p>
            </CardContent>
          </Card>
        </div>

        {/* Ward grid - visual heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ward-wise Density Map</CardTitle>
            <CardDescription>Unresolved reports per ward — Red: 8+, Yellow: 4-7, Green: 0-3</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {heatData.map((ward) => {
                const cfg = severityConfig[ward.severity];
                return (
                  <div
                    key={ward.id}
                    className={`rounded-lg border-2 p-3 transition-all hover:scale-105 ${cfg.bg} ${cfg.border}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Ward {ward.ward_number}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                    </div>
                    <p className="font-bold text-sm truncate">{ward.name}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <MapPin className={`h-3 w-3 ${cfg.text}`} />
                      <span className={`text-xs font-semibold ${cfg.text}`}>{ward.pending} pending</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ward.resolved_reports}/{ward.total_reports} resolved
                    </p>
                  </div>
                );
              })}
              {heatData.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">No ward data available yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Public sharing note */}
        <Card className="bg-secondary/50 border-primary/10">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Public Dashboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This heatmap can be displayed in schools, colleges, corporation offices, and shared on social media
                to drive behavioral change through transparency. Shame + Pride = Behavioral Shift.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Heatmap;
