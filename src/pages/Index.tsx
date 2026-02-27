import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Recycle, Camera, Trophy, MapPin, BarChart3, Shield, ArrowRight, Leaf, Sparkles } from "lucide-react";

const features = [
  { icon: Camera, title: "Report Garbage", desc: "Snap a photo, AI classifies the waste, and your report goes live instantly." },
  { icon: Sparkles, title: "AI Classification", desc: "Our AI identifies Plastic, Organic, Construction, or Mixed waste automatically." },
  { icon: Trophy, title: "Gamified Points", desc: "Earn points for every report. Rise from Bronze to Platinum badge." },
  { icon: MapPin, title: "Live Heatmap", desc: "Real-time garbage hotspot visualization for city authorities." },
  { icon: BarChart3, title: "Analytics", desc: "Track cleanliness scores, resolution trends, and citizen participation." },
  { icon: Shield, title: "Ward Management", desc: "Officers manage reports with SLA tracking and auto-escalation." },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Clean Madurai</span>
          </div>
          <Link to="/auth">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Leaf className="h-4 w-4" /> AI-Powered Urban Cleanliness
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Making Madurai
            <span className="text-primary"> Cleaner</span>,
            <br />One Report at a Time
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Report garbage, earn rewards, and track your city's cleanliness — powered by AI and citizen participation.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start Reporting <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to make a difference?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of citizens working together for a cleaner Madurai.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Join Clean Madurai <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Recycle className="h-4 w-4 text-primary" />
            <span>Clean Madurai</span>
          </div>
          <p>© 2026 Clean Madurai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
