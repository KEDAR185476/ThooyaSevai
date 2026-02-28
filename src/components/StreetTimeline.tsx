import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, TrendingDown, TrendingUp, CheckCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, startOfWeek, startOfMonth, startOfYear, subWeeks, subMonths, subYears, parseISO, isAfter } from "date-fns";

type Range = "weekly" | "monthly" | "yearly";

interface StreetTimelineProps {
  streetName: string;
}

const bucketDate = (dateStr: string, range: Range): string => {
  const d = parseISO(dateStr);
  if (range === "weekly") return format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d");
  if (range === "monthly") return format(startOfMonth(d), "MMM yyyy");
  return format(startOfYear(d), "yyyy");
};

const StreetTimeline = ({ streetName }: StreetTimelineProps) => {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>("monthly");

  const { data: reports } = useQuery({
    queryKey: ["street-timeline", streetName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("created_at, status, resolved_at")
        .eq("street_name", streetName)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const chartData = useMemo(() => {
    if (!reports || reports.length === 0) return [];

    const now = new Date();
    const cutoff =
      range === "weekly" ? subWeeks(now, 12) :
      range === "monthly" ? subMonths(now, 12) :
      subYears(now, 5);

    const filtered = reports.filter((r) => isAfter(parseISO(r.created_at), cutoff));

    const buckets = new Map<string, { complaints: number; resolved: number; pending: number }>();

    filtered.forEach((r) => {
      const key = bucketDate(r.created_at, range);
      const entry = buckets.get(key) ?? { complaints: 0, resolved: 0, pending: 0 };
      entry.complaints++;
      if (r.status === "resolved") entry.resolved++;
      else entry.pending++;
      buckets.set(key, entry);
    });

    return Array.from(buckets.entries()).map(([period, stats]) => ({
      period,
      complaints: stats.complaints,
      resolved: stats.resolved,
      pending: stats.pending,
      resolution_rate: stats.complaints > 0 ? Math.round((stats.resolved / stats.complaints) * 100) : 100,
    }));
  }, [reports, range]);

  // Compute transformation metrics
  const transformation = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const complaintChange = first.complaints > 0
      ? Math.round(((last.complaints - first.complaints) / first.complaints) * 100)
      : 0;
    const resolutionChange = last.resolution_rate - first.resolution_rate;
    const pendingChange = last.pending - first.pending;
    return { complaintChange, resolutionChange, pendingChange };
  }, [chartData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground hover:text-accent">
          <History className="h-3 w-3" /> Timeline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-accent" />
            {streetName} — Transformation Story
          </DialogTitle>
        </DialogHeader>

        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transformation Metrics */}
        {transformation && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-secondary/50 p-2.5">
              {transformation.complaintChange <= 0 ? (
                <ArrowDownRight className="h-4 w-4 mx-auto mb-1 text-primary" />
              ) : (
                <ArrowUpRight className="h-4 w-4 mx-auto mb-1 text-destructive" />
              )}
              <p className="text-base font-bold">
                {transformation.complaintChange <= 0 ? "" : "+"}{transformation.complaintChange}%
              </p>
              <p className="text-[10px] text-muted-foreground">Complaint Density</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2.5">
              {transformation.resolutionChange >= 0 ? (
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 mx-auto mb-1 text-destructive" />
              )}
              <p className="text-base font-bold">
                {transformation.resolutionChange >= 0 ? "+" : ""}{transformation.resolutionChange}%
              </p>
              <p className="text-[10px] text-muted-foreground">Resolution Rate</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2.5">
              {transformation.pendingChange <= 0 ? (
                <CheckCircle className="h-4 w-4 mx-auto mb-1 text-primary" />
              ) : (
                <CheckCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
              )}
              <p className="text-base font-bold">
                {transformation.pendingChange <= 0 ? "" : "+"}{transformation.pendingChange}
              </p>
              <p className="text-[10px] text-muted-foreground">Pending Change</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="rounded-lg border bg-card p-3">
          {chartData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    name="Complaints"
                    stroke="hsl(0,72%,51%)"
                    fill="hsl(0,72%,51%)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="hsl(152,60%,36%)"
                    fill="hsl(152,60%,36%)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke="hsl(38,92%,50%)"
                    fill="hsl(38,92%,50%)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10 text-sm">
              No historical data available for this street yet
            </p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          📍 Every street has a transformation story — track progress over time
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default StreetTimeline;
