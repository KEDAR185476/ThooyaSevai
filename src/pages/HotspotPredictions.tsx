import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, AlertTriangle, Clock, Target, Shield, Zap,
  TrendingUp, MapPin, RefreshCw, Flame, CircleAlert, Info
} from "lucide-react";

interface Prediction {
  location: string;
  risk_level: "critical" | "high" | "medium";
  timeframe: string;
  confidence: number;
  factors: string[];
  action: string;
  waste_type?: string;
}

interface PredictionResult {
  summary: string;
  predictions: Prediction[];
}

const riskConfig = {
  critical: { color: "bg-destructive text-destructive-foreground", icon: Flame, border: "border-destructive/30", bg: "bg-destructive/5" },
  high: { color: "bg-orange-500 text-white", icon: AlertTriangle, border: "border-orange-500/30", bg: "bg-orange-500/5" },
  medium: { color: "bg-yellow-500 text-white", icon: CircleAlert, border: "border-yellow-500/30", bg: "bg-yellow-500/5" },
};

const HotspotPredictions = () => {
  const { toast } = useToast();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-hotspots");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setResult(data as PredictionResult);
        setGeneratedAt(new Date());
      }
    } catch (e: any) {
      toast({ title: "Prediction failed", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/80 to-primary p-6 md:p-8 text-primary-foreground">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">Predictive AI Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Garbage Hotspot Predictions 🔮</h1>
            <p className="text-primary-foreground/80 text-sm md:text-base max-w-lg">
              AI-powered pattern analysis predicting where garbage will accumulate next — enabling preventive action before problems arise.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI Pattern Analysis</p>
                <p className="text-xs text-muted-foreground">
                  {generatedAt
                    ? `Last generated: ${generatedAt.toLocaleTimeString()}`
                    : "Analyzes complaint history, temporal patterns & ward metrics"}
                </p>
              </div>
            </div>
            <Button onClick={generate} disabled={loading} className="gap-2 shrink-0">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing Patterns...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Generate Predictions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Factors Analyzed */}
        {!result && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: TrendingUp, label: "Complaint Frequency", desc: "Rising report trends" },
              { icon: Clock, label: "Temporal Patterns", desc: "Market days & weekends" },
              { icon: MapPin, label: "Location Density", desc: "Cluster analysis" },
              { icon: Target, label: "Resolution Backlog", desc: "Pending complaint load" },
              { icon: Shield, label: "Ward Health", desc: "Cleanliness scores" },
            ].map((f) => (
              <Card key={f.label}>
                <CardContent className="p-4 text-center">
                  <f.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Brain className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Analyzing historical patterns...</p>
              <p className="text-xs text-muted-foreground mt-1">Processing complaint data, temporal trends & ward metrics</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1">AI Risk Assessment</p>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Risk Stats */}
            <div className="grid grid-cols-3 gap-3">
              {(["critical", "high", "medium"] as const).map((level) => {
                const count = result.predictions.filter((p) => p.risk_level === level).length;
                const config = riskConfig[level];
                return (
                  <Card key={level} className={config.border}>
                    <CardContent className="p-4 text-center">
                      <config.icon className="h-6 w-6 mx-auto mb-1 text-foreground" />
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{level} Risk</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Prediction Cards */}
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Predicted Hotspots ({result.predictions.length})
            </h2>

            {result.predictions.map((pred, i) => {
              const config = riskConfig[pred.risk_level];
              const RiskIcon = config.icon;
              return (
                <Card key={i} className={`${config.border} ${config.bg} overflow-hidden`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
                          <RiskIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {pred.location}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={config.color}>{pred.risk_level.toUpperCase()}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {pred.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold">{pred.confidence}%</p>
                        <p className="text-[10px] text-muted-foreground">confidence</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Factors */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Contributing Factors</p>
                      <ul className="space-y-1">
                        {pred.factors.map((f, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action */}
                    <div className="bg-background/60 rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Recommended Action</p>
                      <p className="text-sm flex items-start gap-2">
                        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {pred.action}
                      </p>
                    </div>

                    {pred.waste_type && (
                      <Badge variant="outline" className="text-xs">
                        Expected waste: {pred.waste_type}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm italic">
            "Predicting problems before they happen — from reactive cleanup to preventive governance." 🔮
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HotspotPredictions;
