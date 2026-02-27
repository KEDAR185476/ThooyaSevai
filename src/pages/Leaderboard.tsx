import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, TrendingUp, Star, MapPin, GraduationCap, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

const getRankIcon = (i: number) => {
  if (i === 0) return <Trophy className="h-5 w-5 text-accent" />;
  if (i === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
  if (i === 2) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm text-muted-foreground font-medium">#{i + 1}</span>;
};

const Leaderboard = () => {
  // Fetch wards for ward-level ranking
  const { data: wards } = useQuery({
    queryKey: ["wards-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").order("cleanliness_score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch reports for street-level scores
  const { data: reports } = useQuery({
    queryKey: ["reports-street"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("street_name, status");
      if (error) throw error;
      return data;
    },
  });

  // Fetch top users
  const { data: topUsers } = useQuery({
    queryKey: ["top-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("total_points", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Street rankings computed from reports
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
      .map(([name, stats]) => ({
        name,
        ...stats,
        score: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100,
      }))
      .sort((a, b) => b.score - a.score);
  }, [reports]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Leaderboard & Rankings 🏆</h1>
          <p className="text-muted-foreground mt-1">People improve when measured — weekly cleanliness scores</p>
        </div>

        {/* Monthly Awards Banner */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Award</p>
                <p className="font-bold">🏆 Cleanest Street of Madurai</p>
                <p className="text-sm text-primary font-medium">
                  {streetRankings[0]?.name ?? "—"} ({streetRankings[0]?.score ?? 0}%)
                </p>
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
                <p className="text-sm text-primary font-medium">
                  {wards?.[0]?.name ?? "—"} (Score: {wards?.[0]?.cleanliness_score ?? 0})
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ward" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="ward" className="gap-1.5"><MapPin className="h-3.5 w-3.5" /> Wards</TabsTrigger>
            <TabsTrigger value="street" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Streets</TabsTrigger>
            <TabsTrigger value="individual" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Citizens</TabsTrigger>
          </TabsList>

          {/* Ward Rankings */}
          <TabsContent value="ward">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ward-based Rankings</CardTitle>
                <CardDescription>
                  Score = (Resolved / Total) × 100 — updated from live data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {wards?.map((ward, i) => {
                  const score = ward.total_reports > 0
                    ? Math.round((ward.resolved_reports / ward.total_reports) * 100)
                    : 100;
                  return (
                    <div key={ward.id} className="flex items-center gap-3">
                      <div className="w-8 text-center shrink-0">
                        {getRankIcon(i)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">Ward {ward.ward_number} — {ward.name}</p>
                          <span className="text-sm font-bold text-primary">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    </div>
                  );
                })}
                {(!wards || wards.length === 0) && (
                  <p className="text-center text-muted-foreground py-6">No ward data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Street Rankings */}
          <TabsContent value="street">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Street-level Cleanliness Scores</CardTitle>
                <CardDescription>
                  Clean Score = (Complaints Resolved / Total Complaints) × 100
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {streetRankings.slice(0, 20).map((street, i) => (
                  <div key={street.name} className="flex items-center gap-3">
                    <div className="w-8 text-center shrink-0">
                      {getRankIcon(i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{street.name}</p>
                        <span className="text-sm font-bold text-primary">{street.score}%</span>
                      </div>
                      <Progress value={street.score} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {street.resolved}/{street.total} resolved
                      </p>
                    </div>
                  </div>
                ))}
                {streetRankings.length === 0 && (
                  <p className="text-center text-muted-foreground py-6">No street data available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Rankings */}
          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Citizens</CardTitle>
                <CardDescription>Ranked by total points earned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topUsers?.map((user, i) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-8 text-center shrink-0">
                      {getRankIcon(i)}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <Badge className="text-[10px] capitalize" variant="secondary">{user.badge_level}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{user.total_points}</p>
                        <p className="text-[10px] text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!topUsers || topUsers.length === 0) && (
                  <p className="text-center text-muted-foreground py-6">No user data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
