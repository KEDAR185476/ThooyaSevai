import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, CheckCircle2, Sparkles } from "lucide-react";

const JoinStreet = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [streetInfo, setStreetInfo] = useState<{ street_name: string; student_id: string } | null>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (code && user) lookupCode(code);
  }, [code, user]);

  const lookupCode = async (inviteCode: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("street_assignments")
      .select("street_name, student_id")
      .eq("invite_code", inviteCode.trim())
      .maybeSingle();

    if (data) {
      setStreetInfo(data);
      // Check if already joined
      const { data: existing } = await supabase
        .from("families")
        .select("id")
        .eq("student_id", data.student_id)
        .eq("neighbor_user_id", user!.id)
        .maybeSingle();
      setAlreadyJoined(!!existing);
    } else {
      setStreetInfo(null);
    }
    setLoading(false);
  };

  const joinStreet = async () => {
    if (!streetInfo || !user || !profile) return;
    setJoining(true);
    const { error } = await supabase.from("families").insert({
      student_id: streetInfo.student_id,
      family_name: `${profile.name}'s Family`,
      street_name: streetInfo.street_name,
      is_participating: true,
      neighbor_user_id: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome aboard! 🎉", description: `You've joined the ${streetInfo.street_name} movement!` });
      navigate("/my-street-tasks");
    }
    setJoining(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Join a Street Movement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the invite code shared by your neighborhood student ambassador.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter invite code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button onClick={() => lookupCode(code)} disabled={!code.trim() || loading}>
                Look Up
              </Button>
            </div>

            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {streetInfo && !loading && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">{streetInfo.street_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Join this street's clean movement and complete weekly eco-tasks to help make your neighborhood shine!
                  </p>
                  {alreadyJoined ? (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" /> You've already joined this street!
                    </div>
                  ) : (
                    <Button onClick={joinStreet} disabled={joining} className="w-full gap-2">
                      <Users className="h-4 w-4" /> Join This Street
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!streetInfo && !loading && code && (
              <p className="text-sm text-destructive text-center">
                No street found with this invite code. Please check and try again.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default JoinStreet;
