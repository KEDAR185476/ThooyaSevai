import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, AlertTriangle, CheckCircle, Clock, Trophy, TrendingUp, Star, Medal, Award } from "lucide-react";
import WardExplainDialog from "@/components/WardExplainDialog";
import StreetExplainDialog from "@/components/StreetExplainDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

const severityConfig = {
  red: { label: "Heavy Garbage", bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", dot: "bg-destructive" },
  yellow: { label: "Medium", bg: "bg-accent/10", border: "border-accent/30", text: "text-accent", dot: "bg-accent" },
  green: { label: "Clean", bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", dot: "bg-primary" },
};

const getRankIcon = (i: number) => {
  if (i === 0) return <Trophy className="h-5 w-5 text-accent" />;
  if (i === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (i === 2) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm text-muted-foreground font-medium">#{i + 1}</span>;
};

const CityDashboard = () => {
  const { data: wards } = useQuery({
    queryKey: ["city-wards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").order("ward_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["city-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("ward_id, status, street_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: topUsers } = useQuery({
    queryKey: ["city-top-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name, total_points, badge_level").order("total_points", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Heatmap data
  const heatData = useMemo(() => {
    if (!wards) return [];
    return wards.map((ward) => {
      const wardReports = reports?.filter((r) => r.ward_id === ward.id) ?? [];
      const pending = wardReports.filter((r) => r.status !== "resolved").length;
      const severity: "red" | "yellow" | "green" = pending >= 8 ? "red" : pending >= 4 ? "yellow" : "green";
      return { id: ward.id, name: ward.name, ward_number: ward.ward_number, total_reports: wardReports.length, resolved: wardReports.filter((r) => r.status === "resolved").length, pending, severity };
    });
  }, [wards, reports]);

  const counts = useMemo(() => ({
    red: heatData.filter((w) => w.severity === "red").length,
    yellow: heatData.filter((w) => w.severity === "yellow").length,
    green: heatData.filter((w) => w.severity === "green").length,
  }), [heatData]);

  // Street scores
  const streetRankings = useMemo(() => {
    if (!reports) return [];
    const map = new Map<string, { total: number; resolved: number }>();
    reports.forEach((r) => {
      if (!r.street_name) return;
      const entry = map.get(r.street_name) ?? { total: 0, resolved: 0 };
      entry.total++;
      if (r.status === "resolved") entry.resolved++;
      map.set(r.street_name, entry);
    });
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats, score: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100 }))
      .sort((a, b) => b.score - a.score);
  }, [reports]);

  // Ward rankings sorted by score
  const wardRankings = useMemo(() => {
    if (!wards) return [];
    return [...wards].sort((a, b) => Number(b.cleanliness_score) - Number(a.cleanliness_score));
  }, [wards]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">City Overview 🌆</h1>
          <p className="text-muted-foreground mt-1">See how clean Madurai is — live data, updated in real time</p>
        </div>

        {/* Monthly Awards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Award</p>
                <p className="font-bold">🏆 Cleanest Street</p>
                <p className="text-sm text-primary font-medium">{streetRankings[0]?.name ?? "—"} ({streetRankings[0]?.score ?? 0}%)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Award</p>
                <p className="font-bold">🏆 Most Responsible Ward</p>
                <p className="text-sm text-primary font-medium">{wardRankings[0]?.name ?? "—"} (Score: {wardRankings[0]?.cleanliness_score ?? 0})</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="heatmap" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="heatmap" className="gap-1.5"><MapPin className="h-3.5 w-3.5" /> Heatmap</TabsTrigger>
            <TabsTrigger value="streets" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Streets</TabsTrigger>
            <TabsTrigger value="wards" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Wards</TabsTrigger>
          </TabsList>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {(["red", "yellow", "green"] as const).map((level) => (
                <div key={level} className="flex items-center gap-2 text-sm">
                  <span className={`h-3 w-3 rounded-full ${severityConfig[level].dot}`} />
                  <span className="text-muted-foreground">{severityConfig[level].label} ({counts[level]})</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {heatData.map((ward) => {
                const cfg = severityConfig[ward.severity];
                return (
                  <div key={ward.id} className={`rounded-lg border-2 p-3 ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Ward {ward.ward_number}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                    </div>
                    <p className="font-bold text-sm truncate">{ward.name}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <MapPin className={`h-3 w-3 ${cfg.text}`} />
                      <span className={`text-xs font-semibold ${cfg.text}`}>{ward.pending} pending</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ward.resolved}/{ward.total_reports} resolved</p>
                  </div>
                );
              })}
              {heatData.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No ward data yet</p>}
            </div>
          </TabsContent>

          {/* Streets Tab */}
          <TabsContent value="streets">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Street Cleanliness Scores</CardTitle>
                <CardDescription>Score = (Resolved / Total) × 100</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {streetRankings.slice(0, 15).map((street, i) => (
                  <div key={street.name} className="flex items-center gap-3">
                    <div className="w-8 text-center shrink-0">{getRankIcon(i)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{street.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-primary">{street.score}%</span>
                          <StreetExplainDialog street={street} />
                        </div>
                      </div>
                      <Progress value={street.score} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">{street.resolved}/{street.total} resolved</p>
                    </div>
                  </div>
                ))}
                {streetRankings.length === 0 && <p className="text-center text-muted-foreground py-6">No street data yet</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wards Tab */}
          <TabsContent value="wards">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ward Rankings</CardTitle>
                <CardDescription>Ranked by cleanliness score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {wardRankings.map((ward, i) => {
                  const score = ward.total_reports > 0 ? Math.round((ward.resolved_reports / ward.total_reports) * 100) : 100;
                  return (
                    <div key={ward.id} className="flex items-center gap-3">
                      <div className="w-8 text-center shrink-0">{getRankIcon(i)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">Ward {ward.ward_number} — {ward.name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-sm font-bold text-primary">{score}%</span>
                            <WardExplainDialog ward={ward} />
                          </div>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    </div>
                  );
                })}
                {wardRankings.length === 0 && <p className="text-center text-muted-foreground py-6">No ward data yet</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Top Citizens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Top Citizens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {topUsers?.map((user, i) => (
                <div key={user.id} className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="mx-auto mb-1">{getRankIcon(i)}</div>
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-primary font-bold">{user.total_points} pts</p>
                </div>
              ))}
            </div>
            {(!topUsers || topUsers.length === 0) && <p className="text-center text-muted-foreground py-4">No data yet</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CityDashboard;
