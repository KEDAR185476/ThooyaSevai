import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, AlertTriangle, Eye, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ReportStatus = Database["public"]["Enums"]["report_status"];

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-destructive/10 text-destructive border-destructive/20" },
  assigned: { label: "Assigned", className: "bg-accent/10 text-accent border-accent/20" },
  resolved: { label: "Resolved", className: "bg-primary/10 text-primary border-primary/20" },
};

const Complaints = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: wards } = useQuery({
    queryKey: ["admin-wards-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("id, name, ward_number").order("ward_number");
      if (error) throw error;
      return data;
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Database["public"]["Tables"]["reports"]["Update"]> }) => {
      const { error } = await supabase.from("reports").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: "Report updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredReports = reports?.filter((r) => filter === "all" || r.status === filter) ?? [];

  const counts = {
    all: reports?.length ?? 0,
    pending: reports?.filter((r) => r.status === "pending").length ?? 0,
    assigned: reports?.filter((r) => r.status === "assigned").length ?? 0,
    resolved: reports?.filter((r) => r.status === "resolved").length ?? 0,
  };

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();
    updateReport.mutate({ id: reportId, updates });
  };

  const handleAssignWard = (reportId: string, wardId: string) => {
    updateReport.mutate({ id: reportId, updates: { ward_id: wardId } });
  };

  const openDetail = (report: any) => {
    setSelectedReport(report);
    setDetailOpen(true);
  };

  const getWardName = (wardId: string | null) => {
    if (!wardId || !wards) return "Unassigned";
    const ward = wards.find((w) => w.id === wardId);
    return ward ? `Ward ${ward.ward_number} — ${ward.name}` : "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Complaints Management 📋</h1>
          <p className="text-muted-foreground mt-1">View, assign, and resolve garbage reports across Madurai</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { key: "all", icon: Eye, label: "Total", color: "text-foreground" },
            { key: "pending", icon: AlertTriangle, label: "Pending", color: "text-destructive" },
            { key: "assigned", icon: Clock, label: "Assigned", color: "text-accent" },
            { key: "resolved", icon: CheckCircle, label: "Resolved", color: "text-primary" },
          ] as const).map((item) => (
            <Card
              key={item.key}
              className={`cursor-pointer transition-shadow hover:shadow-md ${filter === item.key ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilter(item.key)}
            >
              <CardContent className="p-4 text-center">
                <item.icon className={`h-6 w-6 mx-auto mb-1 ${item.color}`} />
                <p className="text-xl font-bold">{counts[item.key]}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reports table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports {filter !== "all" && `— ${filter}`}</CardTitle>
            <CardDescription>Click a report to view details; change status or assign ward inline</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredReports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No reports found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Street</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="text-sm">
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {report.waste_type ?? "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[140px] truncate">
                          {report.street_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.ward_id ?? ""}
                            onValueChange={(val) => handleAssignWard(report.id, val)}
                          >
                            <SelectTrigger className="h-8 text-xs w-[140px]">
                              <SelectValue placeholder="Assign ward" />
                            </SelectTrigger>
                            <SelectContent>
                              {wards?.map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                  W{w.ward_number} — {w.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.status}
                            onValueChange={(val) => handleStatusChange(report.id, val as ReportStatus)}
                          >
                            <SelectTrigger className="h-8 text-xs w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                {selectedReport.image_url && (
                  <img
                    src={selectedReport.image_url}
                    alt="Report"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={statusConfig[selectedReport.status as ReportStatus]?.className}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Waste Type</p>
                    <p className="font-medium capitalize">{selectedReport.waste_type ?? "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Street</p>
                    <p className="font-medium">{selectedReport.street_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ward</p>
                    <p className="font-medium">{getWardName(selectedReport.ward_id)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium text-xs">
                      {selectedReport.latitude}, {selectedReport.longitude}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reported</p>
                    <p className="font-medium">{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                  {selectedReport.confidence_score && (
                    <div>
                      <p className="text-muted-foreground">AI Confidence</p>
                      <p className="font-medium">{selectedReport.confidence_score}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Complaints;
