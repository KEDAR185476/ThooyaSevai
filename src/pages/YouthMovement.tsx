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
  MapPin, Calendar, Target, Award, Trash2, ArrowRight
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface Family {
  id: string;
  family_name: string;
  street_name: string | null;
  is_participating: boolean;
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

const YouthMovement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [participation, setParticipation] = useState<Participation[]>([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newStreetName, setNewStreetName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM dd");
  const weekStartDisplay = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM dd");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [famRes, partRes] = await Promise.all([
      supabase.from("families").select("*").eq("student_id", user!.id).order("created_at"),
      supabase.from("family_participation").select("*").eq("student_id", user!.id).eq("week_start", weekStart),
    ]);
    setFamilies((famRes.data as Family[]) || []);
    setParticipation((partRes.data as Participation[]) || []);
    setLoading(false);
  };

  const addFamily = async () => {
    if (!newFamilyName.trim()) return;
    if (families.length >= 10) {
      toast({ title: "Maximum 10 families", description: "You can register up to 10 families per street.", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("families").insert({
      student_id: user!.id,
      family_name: newFamilyName.trim(),
      street_name: newStreetName.trim() || null,
      is_participating: true,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Family registered! 🏠", description: `${newFamilyName} has been added to your movement.` });
      setNewFamilyName("");
      setNewStreetName("");
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

    if (existing) {
      if (existing.completed) return; // already done
      const { error } = await supabase
        .from("family_participation")
        .update({ completed: true, completed_at: new Date().toISOString(), points_earned: 5 })
        .eq("id", existing.id);
      if (!error) {
        toast({ title: "+5 Points! ⭐", description: `Task completed for this family.` });
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
        points_earned: 5,
      });
      if (!error) {
        toast({ title: "+5 Points! ⭐", description: `Task completed for this family.` });
        fetchData();
      }
    }
  };

  const totalWeeklyTasks = families.length * weeklyTasks.length;
  const completedTasks = participation.filter((p) => p.completed).length;
  const weeklyProgress = totalWeeklyTasks > 0 ? Math.round((completedTasks / totalWeeklyTasks) * 100) : 0;
  const weeklyPoints = participation.filter((p) => p.completed).reduce((sum, p) => sum + p.points_earned, 0);

  const getFamilyProgress = (familyId: string) => {
    const familyTasks = participation.filter((p) => p.family_id === familyId);
    const completed = familyTasks.filter((p) => p.completed).length;
    return { completed, total: weeklyTasks.length, percent: Math.round((completed / weeklyTasks.length) * 100) };
  };

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
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">Youth Movement</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">1 Student = 1 Street 🌱</h1>
            <p className="text-primary-foreground/80 text-sm md:text-base max-w-lg">
              Educate families on your street, track their weekly participation, and earn rewards as a Clean Ambassador!
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{families.length}<span className="text-sm text-muted-foreground">/10</span></p>
              <p className="text-xs text-muted-foreground">Families</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-accent mx-auto mb-1" />
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
              <Plus className="h-4 w-4 text-primary" /> Register a Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Family name (e.g., Rajan Family)"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Street name"
                value={newStreetName}
                onChange={(e) => setNewStreetName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addFamily} disabled={adding || !newFamilyName.trim()} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Register up to 10 families on your street. Each family's weekly participation earns you rewards!
            </p>
          </CardContent>
        </Card>

        {/* Family Cards with Tasks */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : families.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">No families yet</h3>
              <p className="text-sm text-muted-foreground">Start by registering families on your street to begin the movement!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Your Families ({families.length})
            </h2>
            {families.map((family) => {
              const prog = getFamilyProgress(family.id);
              return (
                <Card key={family.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{family.family_name}</CardTitle>
                        {family.street_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {family.street_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={prog.percent === 100 ? "default" : "secondary"}>
                          {prog.completed}/{prog.total}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFamily(family.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                              <span className="ml-auto text-xs text-accent font-medium shrink-0">+5 pts</span>
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

        {/* Motivation Section */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> How It Works
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Register Families", desc: "Add up to 10 families on your street as a Clean Ambassador." },
                { step: "2", title: "Track Weekly Tasks", desc: "Guide families to complete 5 eco-tasks every week for points." },
                { step: "3", title: "Earn Rewards", desc: "Your families' participation earns you badges, points & prizes!" },
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

        {/* Impact Quote */}
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm italic">
            "Youth movement changes cities. One student, one street, one family at a time." 🌍
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default YouthMovement;
