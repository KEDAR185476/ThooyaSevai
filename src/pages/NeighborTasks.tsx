import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Circle, MapPin, Calendar, Trophy, Star, Sparkles
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface MyFamily {
  id: string;
  family_name: string;
  street_name: string | null;
  student_id: string;
}

interface Participation {
  id: string;
  family_id: string;
  task_description: string;
  completed: boolean;
  points_earned: number;
}

const weeklyTasks = [
  "Segregate waste at home (wet & dry)",
  "Compost kitchen waste",
  "Use cloth bags for shopping",
  "Clean the street area in front of house",
  "Teach a neighbor about waste segregation",
];

const NeighborTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myFamily, setMyFamily] = useState<MyFamily | null>(null);
  const [participation, setParticipation] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM dd");
  const weekStartDisplay = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM dd");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // Find the family record where this user is the neighbor
    const { data: famData } = await supabase
      .from("families")
      .select("*")
      .eq("neighbor_user_id", user!.id)
      .limit(1)
      .maybeSingle();

    if (famData) {
      setMyFamily(famData as MyFamily);
      // Fetch participation for this family this week
      const { data: partData } = await supabase
        .from("family_participation")
        .select("*")
        .eq("family_id", famData.id)
        .eq("week_start", weekStart);
      setParticipation((partData as Participation[]) || []);
    }
    setLoading(false);
  };

  const toggleTask = async (task: string) => {
    if (!myFamily) return;
    const existing = participation.find((p) => p.task_description === task);

    if (existing?.completed) return;

    if (existing) {
      await supabase
        .from("family_participation")
        .update({ completed: true, completed_at: new Date().toISOString(), points_earned: 5 })
        .eq("id", existing.id);
    } else {
      await supabase.from("family_participation").insert({
        family_id: myFamily.id,
        student_id: myFamily.student_id,
        week_start: weekStart,
        task_description: task,
        completed: true,
        completed_at: new Date().toISOString(),
        points_earned: 5,
      });
    }
    toast({ title: "Task completed! ⭐", description: "Great job helping keep your street clean!" });
    fetchData();
  };

  const completed = participation.filter((p) => p.completed).length;
  const progress = Math.round((completed / weeklyTasks.length) * 100);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!myFamily) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-12 space-y-4">
          <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-xl font-bold">No street joined yet</h2>
          <p className="text-sm text-muted-foreground">
            Ask your neighborhood student ambassador for an invite link to join a street movement!
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 text-primary-foreground">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">My Street Tasks</span>
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5" /> {myFamily.street_name || "My Street"}
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Complete your weekly eco-tasks to keep your neighborhood clean!
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {weekStartDisplay} – {weekEnd}
              </span>
              <Badge variant="secondary">{completed}/{weeklyTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
            {progress === 100 && (
              <p className="text-sm text-primary font-medium mt-2 flex items-center gap-1">
                <Trophy className="h-4 w-4" /> All tasks done this week! 🎉
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Eco-Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {weeklyTasks.map((task) => {
                const done = participation.some(
                  (p) => p.task_description === task && p.completed
                );
                return (
                  <button
                    key={task}
                    onClick={() => !done && toggleTask(task)}
                    disabled={done}
                    className="w-full flex items-center gap-3 py-3 text-left text-sm hover:bg-muted/50 transition-colors px-1 rounded"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={done ? "line-through text-muted-foreground" : ""}>
                      {task}
                    </span>
                    {done && <Star className="h-4 w-4 text-accent ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground italic">
            Your participation helps your student ambassador earn rewards too! 🤝
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NeighborTasks;
