import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Star, Clock, CheckCircle2, Loader2 } from "lucide-react";

const Rewards = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: redemptions } = useQuery({
    queryKey: ["my-redemptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redemptions")
        .select("*, rewards(*)")
        .eq("user_id", user!.id)
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from("redemptions")
        .insert({ user_id: user!.id, reward_id: rewardId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reward redeemed! 🎉 Points deducted from your balance.");
      queryClient.invalidateQueries({ queryKey: ["my-redemptions"] });
      // Refresh profile to get updated points
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (err: any) => {
      if (err.message?.includes("Not enough points")) {
        toast.error("Not enough points to redeem this reward.");
      } else {
        toast.error("Failed to redeem reward. Please try again.");
      }
    },
  });

  const currentPoints = profile?.total_points ?? 0;

  const alreadyRedeemed = (rewardId: string) =>
    redemptions?.some((r) => r.reward_id === rewardId) ?? false;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rewards Store 🎁</h1>
          <p className="text-muted-foreground mt-1">
            Redeem your points for exciting rewards
          </p>
        </div>

        {/* Points Balance */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-3xl font-bold text-primary">{currentPoints}</p>
              <p className="text-xs text-muted-foreground">points available</p>
            </div>
            <Badge className="ml-auto capitalize" variant="secondary">
              {profile?.badge_level ?? "bronze"}
            </Badge>
          </CardContent>
        </Card>

        {/* Available Rewards */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Available Rewards</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rewards && rewards.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => {
                const canAfford = currentPoints >= reward.points_required;
                const redeemed = alreadyRedeemed(reward.id);
                return (
                  <Card key={reward.id} className="flex flex-col">
                    {reward.image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={reward.image_url}
                          alt={reward.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Gift className="h-4 w-4 text-accent shrink-0" />
                        {reward.title}
                      </CardTitle>
                      {reward.sponsor_name && (
                        <p className="text-xs text-muted-foreground">
                          by {reward.sponsor_name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-3">
                      {reward.description && (
                        <p className="text-sm text-muted-foreground">
                          {reward.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <Badge variant="outline" className="font-bold">
                          {reward.points_required} pts
                        </Badge>
                        {redeemed ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Redeemed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canAfford || redeemMutation.isPending}
                            onClick={() => redeemMutation.mutate(reward.id)}
                          >
                            {redeemMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : canAfford ? (
                              "Redeem"
                            ) : (
                              "Need more points"
                            )}
                          </Button>
                        )}
                      </div>
                      {reward.expiry_date && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Expires{" "}
                          {new Date(reward.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No rewards available yet. Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Redemption History */}
        {redemptions && redemptions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Your Redemptions</h2>
            <Card>
              <CardContent className="divide-y">
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3 first:pt-4 last:pb-4">
                    <div>
                      <p className="text-sm font-medium">{(r as any).rewards?.title ?? "Reward"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.redeemed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Claimed
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Rewards;
