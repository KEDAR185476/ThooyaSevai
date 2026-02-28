import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Lightbulb, AlertTriangle, Clock, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WardData {
  id: string;
  name: string;
  ward_number: number;
  cleanliness_score: number;
  total_reports: number;
  resolved_reports: number;
}

const WardExplainDialog = ({ ward }: { ward: WardData }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchExplanation = async () => {
    if (explanation) return; // cached
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("explain-ward", {
        body: { ward },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExplanation(data.explanation);
    } catch (e: any) {
      toast({ title: "Could not generate explanation", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) fetchExplanation();
  };

  const score = ward.total_reports > 0 ? Math.round((ward.resolved_reports / ward.total_reports) * 100) : 100;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground hover:text-primary">
          <Brain className="h-3 w-3" /> Why?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            AI Explanation — Ward {ward.ward_number}
          </DialogTitle>
        </DialogHeader>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-secondary/50 p-2">
            <Activity className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{ward.cleanliness_score}</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2">
            <Clock className="h-4 w-4 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold">{score}%</p>
            <p className="text-[10px] text-muted-foreground">Resolved</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold">{ward.total_reports - ward.resolved_reports}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-accent" />
            AI Analysis
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing ward data...
            </div>
          ) : explanation ? (
            <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{explanation}</div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Click to generate explanation</p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          🤖 Powered by Explainable AI — transparent, data-driven insights
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WardExplainDialog;
