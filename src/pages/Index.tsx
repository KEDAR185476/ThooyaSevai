import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recycle, Camera, Trophy, MapPin, BarChart3, Shield, ArrowRight, Leaf, Sparkles, Trash2, Wind, Droplets, TreePine, Users, TrendingUp, Globe } from "lucide-react";

const features = [
  { icon: Camera, title: "Snap & Report", desc: "Point your camera at waste — AI identifies the type and logs a geotagged report instantly.", color: "from-emerald-500/20 to-teal-500/20" },
  { icon: Sparkles, title: "AI Classification", desc: "Plastic, Organic, Construction, or Mixed — our model classifies with 95%+ accuracy.", color: "from-violet-500/20 to-purple-500/20" },
  { icon: Trophy, title: "Earn & Rise", desc: "Every report earns points. Climb from Bronze → Silver → Gold → Platinum badge.", color: "from-amber-500/20 to-orange-500/20" },
  { icon: MapPin, title: "Live Heatmap", desc: "Real-time garbage hotspot visualization helps authorities prioritize cleanup.", color: "from-rose-500/20 to-pink-500/20" },
  { icon: BarChart3, title: "City Analytics", desc: "Track cleanliness scores, resolution trends, and citizen participation at ward level.", color: "from-sky-500/20 to-blue-500/20" },
  { icon: Shield, title: "Ward Management", desc: "Officers manage reports with SLA tracking, auto-escalation, and AI insights.", color: "from-lime-500/20 to-green-500/20" },
];

const stats = [
  { value: "10K+", label: "Reports Filed", icon: Trash2 },
  { value: "72", label: "Wards Covered", icon: Globe },
  { value: "85%", label: "Resolution Rate", icon: TrendingUp },
  { value: "5K+", label: "Active Citizens", icon: Users },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">ThooyaSevai</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button size="sm" variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="shadow-lg shadow-primary/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium gap-2 shadow-sm">
            <Leaf className="h-3.5 w-3.5" /> AI-Powered Urban Cleanliness Platform
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6">
            Every Street
            <span className="text-primary"> Deserves</span>
            <br />
            to Be <span className="relative inline-block">
              Clean
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Report waste, track cleanup progress, earn rewards — and watch your neighborhood transform. Powered by AI and driven by citizens like you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Start Reporting <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                <MapPin className="h-4 w-4" /> View Heatmap
              </Button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-display font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/50 to-secondary/30 -z-10" />
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Wind className="h-3.5 w-3.5" /> Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold">How ThooyaSevai Works</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">From a quick photo to city-wide analytics — everything you need for a cleaner neighborhood.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={f.title} className="group border-border/40 bg-card/60 backdrop-blur hover:bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${f.color} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10`} />
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                        <h3 className="font-display font-bold text-lg">{f.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Environment strip */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex gap-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <TreePine className="h-7 w-7 text-primary" />
              </div>
              <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Droplets className="h-7 w-7 text-accent" />
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Leaf className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-display font-bold mb-2">Building a Greener Tomorrow</h3>
              <p className="text-muted-foreground max-w-xl">Every report contributes to cleaner streets, healthier communities, and a sustainable future for Madurai.</p>
            </div>
            <Link to="/auth">
              <Button size="lg" className="shrink-0 gap-2 shadow-lg shadow-primary/20">
                Join the Movement <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent -z-10" />
        <div className="container mx-auto text-center max-w-2xl">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Recycle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of citizens working together for a cleaner, greener Madurai.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 text-base px-10 h-12 shadow-xl shadow-primary/25">
              Join ThooyaSevai <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4 bg-card/50">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Recycle className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-foreground">ThooyaSevai</span>
          </div>
          <p>© 2026 ThooyaSevai. Making Madurai cleaner, one report at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
