import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, MapPin, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WardManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<any>(null);
  const [form, setForm] = useState({ name: "", ward_number: "", cleanliness_score: "100" });

  const { data: wards, isLoading } = useQuery({
    queryKey: ["admin-wards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wards").select("*").order("ward_number");
      if (error) throw error;
      return data;
    },
  });

  const upsertWard = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        ward_number: parseInt(form.ward_number),
        cleanliness_score: parseFloat(form.cleanliness_score),
      };
      if (editingWard) {
        const { error } = await supabase.from("wards").update(payload).eq("id", editingWard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wards").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wards"] });
      toast({ title: editingWard ? "Ward updated" : "Ward added" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteWard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wards"] });
      toast({ title: "Ward deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ name: "", ward_number: "", cleanliness_score: "100" });
    setEditingWard(null);
    setDialogOpen(false);
  };

  const openEdit = (ward: any) => {
    setEditingWard(ward);
    setForm({
      name: ward.name,
      ward_number: String(ward.ward_number),
      cleanliness_score: String(ward.cleanliness_score),
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">Ward Management 🏘️</h1>
            <p className="text-muted-foreground mt-1">Add and manage wards that power the Heatmap & Rankings</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Ward</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingWard ? "Edit Ward" : "Add New Ward"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Ward Number</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1"
                    value={form.ward_number}
                    onChange={(e) => setForm((f) => ({ ...f, ward_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ward Name</Label>
                  <Input
                    placeholder="e.g. Meenakshi Nagar"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cleanliness Score (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.cleanliness_score}
                    onChange={(e) => setForm((f) => ({ ...f, cleanliness_score: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() => upsertWard.mutate()}
                  disabled={!form.name || !form.ward_number || upsertWard.isPending}
                >
                  {upsertWard.isPending ? "Saving..." : editingWard ? "Update" : "Add Ward"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Wards</CardTitle>
            <CardDescription>These wards are used across Heatmap, Leaderboard, and Analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !wards || wards.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No wards added yet. Click "Add Ward" to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Reports</TableHead>
                      <TableHead className="text-center">Resolved</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wards.map((ward) => (
                      <TableRow key={ward.id}>
                        <TableCell className="font-medium">Ward {ward.ward_number}</TableCell>
                        <TableCell>{ward.name}</TableCell>
                        <TableCell className="text-center">{ward.total_reports}</TableCell>
                        <TableCell className="text-center">{ward.resolved_reports}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={
                              Number(ward.cleanliness_score) >= 80
                                ? "bg-primary/10 text-primary"
                                : Number(ward.cleanliness_score) >= 50
                                ? "bg-accent/10 text-accent"
                                : "bg-destructive/10 text-destructive"
                            }
                          >
                            {ward.cleanliness_score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(ward)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteWard.mutate(ward.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WardManagement;
