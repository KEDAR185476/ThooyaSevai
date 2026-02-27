import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Camera, Upload, Loader2, Recycle, Trash2, AlertTriangle,
  Leaf, Sparkles, RotateCcw, TreePine, Lightbulb, ShieldAlert, Heart
} from "lucide-react";

interface WasteAnalysis {
  waste_type: string;
  confidence: number;
  description: string;
  reuse_suggestions: string[];
  disposal_method: string;
  benefits_of_proper_disposal: string[];
  harms_of_improper_disposal: string[];
  fun_fact: string;
  environmental_impact_score: number;
}

const WasteAwareness = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WasteAnalysis | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);

    try {
      const base64 = imagePreview.split(",")[1];
      const { data, error } = await supabase.functions.invoke("analyze-waste", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast.success("Analysis complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImagePreview(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const impactColor = (score: number) =>
    score >= 7 ? "text-destructive" : score >= 4 ? "text-yellow-600" : "text-primary";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Waste Awareness
          </h1>
          <p className="text-muted-foreground text-sm">
            Upload a photo of waste to learn how to reuse, dispose, and protect the environment
          </p>
        </div>

        {/* Upload Section */}
        {!imagePreview && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Take or upload a photo of any waste item
              </p>
              <Button className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Choose Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </CardContent>
          </Card>
        )}

        {/* Image Preview + Analyze */}
        {imagePreview && !analysis && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <img src={imagePreview} alt="Waste to analyze" className="w-full h-full object-cover" />
                <Button variant="secondary" size="icon" className="absolute top-3 right-3 rounded-full shadow" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <Trash2 className="h-4 w-4 mr-2" /> Change Photo
                </Button>
                <Button className="flex-1 gap-2" onClick={analyzeImage} disabled={analyzing}>
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {analyzing ? "Analyzing..." : "Analyze Waste"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Image + Type Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 items-start">
                  <img src={imagePreview!} alt="Analyzed waste" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="text-sm capitalize">{analysis.waste_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(analysis.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground">{analysis.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Environmental Impact:</span>
                      <span className={`text-sm font-bold ${impactColor(analysis.environmental_impact_score)}`}>
                        {analysis.environmental_impact_score}/10
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reuse Suggestions */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Recycle className="h-5 w-5 text-primary" /> Reuse Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {analysis.reuse_suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Correct Disposal */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-primary" /> Correct Disposal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm">{analysis.disposal_method}</p>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <Heart className="h-5 w-5" /> Benefits of Proper Disposal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {analysis.benefits_of_proper_disposal.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <TreePine className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Harms */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-5 w-5" /> Harms of Improper Disposal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {analysis.harms_of_improper_disposal.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Fun Fact */}
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Leaf className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Did You Know?</p>
                    <p className="text-sm mt-1">{analysis.fun_fact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyze Another */}
            <Button className="w-full gap-2" onClick={reset}>
              <Camera className="h-4 w-4" /> Analyze Another Item
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WasteAwareness;
