import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, CheckCircle2, Circle, Trophy, Star, Sparkles,
  MapPin, Calendar, Target, Award, Trash2, Copy, Share2, Zap
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface StreetAssignment {
  id: string;
  student_id: string;
  street_name: string;
  invite_code: string;
}

interface Family {
  id: string;
  family_name: string;
  street_name: string | null;
  is_participating: boolean;
  neighbor_user_id: string | null;
}

interface Participation {
  id: string;
  family_id: string;
  task_description: string;
  completed: boolean;
  completed_at: string | null;
  points_earned: number;
  week_start: string;
}

const weeklyTasks = [
  "Segregate waste at home (wet & dry)",
  "Compost kitchen waste",
  "Use cloth bags for shopping",
  "Clean the street area in front of house",
  "Teach a neighbor about waste segregation",
];

const getMultiplier = (familyCount: number) => {
  if (familyCount >= 7) return 3;
  if (familyCount >= 4) return 2;
  return 1;
};

const YouthMovement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [streetAssignment, setStreetAssignment] = useState<StreetAssignment | null>(null);
  const [claimStreetName, setClaimStreetName] = useState("");
  const [families, setFamilies] = useState<Family[]>([]);
  const [participation, setParticipation] = useState<Participation[]>([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM dd");
  const weekStartDisplay = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM dd");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [assignRes, famRes, partRes] = await Promise.all([
      supabase.from("street_assignments").select("*").eq("student_id", user!.id).maybeSingle(),
      supabase.from("families").select("*").eq("student_id", user!.id).order("created_at"),
      supabase.from("family_participation").select("*").eq("student_id", user!.id).eq("week_start", weekStart),
    ]);
    setStreetAssignment(assignRes.data as StreetAssignment | null);
    setFamilies((famRes.data as Family[]) || []);
    setParticipation((partRes.data as Participation[]) || []);
    setLoading(false);
  };

  const claimStreet = async () => {
    if (!claimStreetName.trim()) return;
    const { error } = await supabase.from("street_assignments").insert({
      student_id: user!.id,
      street_name: claimStreetName.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Street claimed! 🎉", description: `You are now the ambassador for ${claimStreetName}` });
      setClaimStreetName("");
      fetchData();
    }
  };

  const copyInviteCode = () => {
    if (!streetAssignment) return;
    const url = `${window.location.origin}/join-street?code=${streetAssignment.invite_code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied! 📋", description: "Share this with your neighbors to join." });
  };

  const addFamily = async () => {
    if (!newFamilyName.trim() || !streetAssignment) return;
    if (families.length >= 10) {
      toast({ title: "Maximum 10 families", description: "You can register up to 10 families.", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("families").insert({
      student_id: user!.id,
      family_name: newFamilyName.trim(),
      street_name: streetAssignment.street_name,
      is_participating: true,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Family registered! 🏠", description: `${newFamilyName} added to your movement.` });
      setNewFamilyName("");
      fetchData();
    }
    setAdding(false);
  };

  const removeFamily = async (id: string) => {
    await supabase.from("families").delete().eq("id", id);
    fetchData();
  };

  const toggleTask = async (familyId: string, task: string) => {
    const existing = participation.find(
      (p) => p.family_id === familyId && p.task_description === task
    );
    const multiplier = getMultiplier(families.length);
    const points = 5 * multiplier;

    if (existing) {
      if (existing.completed) return;
      const { error } = await supabase
        .from("family_participation")
        .update({ completed: true, completed_at: new Date().toISOString(), points_earned: points })
        .eq("id", existing.id);
      if (!error) {
        toast({ title: `+${points} Points! ⭐ (${multiplier}x)`, description: "Task completed!" });
        fetchData();
      }
    } else {
      const { error } = await supabase.from("family_participation").insert({
        family_id: familyId,
        student_id: user!.id,
        week_start: weekStart,
        task_description: task,
        completed: true,
        completed_at: new Date().toISOString(),
        points_earned: points,
      });
      if (!error) {
        toast({ title: `+${points} Points! ⭐ (${multiplier}x)`, description: "Task completed!" });
        fetchData();
      }
    }
  };

  const multiplier = getMultiplier(families.length);
  const totalWeeklyTasks = families.length * weeklyTasks.length;
  const completedTasks = participation.filter((p) => p.completed).length;
  const weeklyProgress = totalWeeklyTasks > 0 ? Math.round((completedTasks / totalWeeklyTasks) * 100) : 0;
  const weeklyPoints = participation.filter((p) => p.completed).reduce((sum, p) => sum + p.points_earned, 0);

  const getFamilyProgress = (familyId: string) => {
    const familyTasks = participation.filter((p) => p.family_id === familyId);
    const completed = familyTasks.filter((p) => p.completed).length;
    return { completed, total: weeklyTasks.length, percent: Math.round((completed / weeklyTasks.length) * 100) };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 md:p-8 text-primary-foreground">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">Youth Revolution</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">1 Student = 1 Street 🌱</h1>
            <p className="text-primary-foreground/80 text-sm md:text-base max-w-lg">
              Claim your street, invite neighbors to join, and lead the transformation from the dirtiest city to the cleanest!
            </p>
          </div>
        </div>

        {/* Street Claim Section */}
        {!streetAssignment ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Claim Your Street
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                As a Clean Ambassador, you'll be responsible for one street. Enter your street name to get started!
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter your street name (e.g., Gandhi Nagar 3rd Street)"
                  value={claimStreetName}
                  onChange={(e) => setClaimStreetName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={claimStreet} disabled={!claimStreetName.trim()} className="gap-2 shrink-0">
                  <MapPin className="h-4 w-4" /> Claim Street
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Invite Code Card */}
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Your Street</p>
                  <p className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {streetAssignment.street_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Invite code: <span className="font-mono font-bold text-foreground">{streetAssignment.invite_code}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyInviteCode} className="gap-2">
                    <Copy className="h-3 w-3" /> Copy Invite Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Join my Clean Street Movement!",
                        text: `Join me in keeping ${streetAssignment.street_name} clean!`,
                        url: `${window.location.origin}/join-street?code=${streetAssignment.invite_code}`,
                      });
                    } else {
                      copyInviteCode();
                    }
                  }} className="gap-2">
                    <Share2 className="h-3 w-3" /> Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Row with Multiplier */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{families.length}<span className="text-sm text-muted-foreground">/10</span></p>
                  <p className="text-xs text-muted-foreground">Neighbors</p>
                </CardContent>
              </Card>
              <Card className="border-accent/30">
                <CardContent className="p-4 text-center">
                  <Zap className="h-6 w-6 text-accent mx-auto mb-1" />
                  <p className="text-2xl font-bold text-accent">{multiplier}x</p>
                  <p className="text-xs text-muted-foreground">Multiplier</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{weeklyProgress}%</p>
                  <p className="text-xs text-muted-foreground">Week Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 text-accent mx-auto mb-1" />
                  <p className="text-2xl font-bold">{weeklyPoints}</p>
                  <p className="text-xs text-muted-foreground">Points This Week</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile?.total_points ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </CardContent>
              </Card>
            </div>

            {/* Multiplier Info */}
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-accent" /> Bonus Multiplier
                </p>
                <div className="flex gap-4 text-xs">
                  <span className={`px-2 py-1 rounded-full ${multiplier === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    1-3 neighbors: 1x
                  </span>
                  <span className={`px-2 py-1 rounded-full ${multiplier === 2 ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
                    4-6 neighbors: 2x
                  </span>
                  <span className={`px-2 py-1 rounded-full ${multiplier === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    7+ neighbors: 3x
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  More neighbors = higher point multiplier. Invite more families to boost your rewards!
                </p>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Week: {weekStartDisplay} – {weekEnd}
                  </span>
                  <Badge variant="secondary">{completedTasks}/{totalWeeklyTasks} tasks</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={weeklyProgress} className="h-3" />
                {weeklyProgress === 100 && (
                  <p className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
                    <Trophy className="h-4 w-4" /> All tasks completed this week! Amazing work! 🎉
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Add Family */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Add a Neighbor Family
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Family name (e.g., Rajan Family)"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addFamily} disabled={adding || !newFamilyName.trim()} className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Add families manually, or share your invite link so neighbors can join themselves!
                </p>
              </CardContent>
            </Card>

            {/* Family Cards with Tasks */}
            {families.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">No neighbors yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add families manually or share your invite link to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Your Neighbors ({families.length})
                  {families.some(f => f.neighbor_user_id) && (
                    <Badge variant="secondary" className="text-xs">
                      {families.filter(f => f.neighbor_user_id).length} self-joined
                    </Badge>
                  )}
                </h2>
                {families.map((family) => {
                  const prog = getFamilyProgress(family.id);
                  return (
                    <Card key={family.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{family.family_name}</CardTitle>
                            {family.neighbor_user_id && (
                              <Badge variant="outline" className="text-[10px]">App User</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={prog.percent === 100 ? "default" : "secondary"}>
                              {prog.completed}/{prog.total}
                            </Badge>
                            {!family.neighbor_user_id && (
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFamily(family.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Progress value={prog.percent} className="h-1.5 mt-2" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="divide-y divide-border">
                          {weeklyTasks.map((task) => {
                            const done = participation.some(
                              (p) => p.family_id === family.id && p.task_description === task && p.completed
                            );
                            return (
                              <button
                                key={task}
                                onClick={() => !done && toggleTask(family.id, task)}
                                disabled={done}
                                className="w-full flex items-center gap-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors px-1 rounded"
                              >
                                {done ? (
                                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                                )}
                                <span className={done ? "line-through text-muted-foreground" : ""}>
                                  {task}
                                </span>
                                {!done && (
                                  <span className="ml-auto text-xs text-accent font-medium shrink-0">
                                    +{5 * multiplier} pts
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* How It Works */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> How It Works
            </h3>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Claim Your Street", desc: "Pick a street to become its Clean Ambassador." },
                { step: "2", title: "Invite Neighbors", desc: "Share your invite link or add families manually." },
                { step: "3", title: "Track Weekly Tasks", desc: "Guide neighbors through 5 eco-tasks every week." },
                { step: "4", title: "Earn Multiplied Rewards", desc: "More neighbors = higher multiplier on all points!" },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg mb-2">
                    {item.step}
                  </div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm italic">
            "One student, one street, one revolution. Together we make the dirtiest city the cleanest." 🌍
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default YouthMovement;
