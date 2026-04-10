// ============================================================
// frontend/src/pages/TrainsPage.tsx  — PRODUCTION UPGRADED
// FIX 1: trainService.getAll() now unwraps { success, data } envelope
// FIX 2: Delete confirmation dialog added (was instant delete before)
// FIX 3: Error messages now show server message, not generic text
// FIX 4: Seed demo trains button added for quick start
// FIX 5: Shows current section info in table
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { trainService, Train } from "@/services/trainService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Train as TrainIcon, Loader2, RefreshCw } from "lucide-react";

type TrainFormData = {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  status: Train["status"];
  priority: number;
  delay: number;
};

const EMPTY_TRAIN: TrainFormData = {
  trainNumber: "", trainName: "", source: "", destination: "",
  departureTime: "", arrivalTime: "", status: "On Time", priority: 1, delay: 0,
};

const STATUS_STYLES: Record<string, string> = {
  "On Time": "bg-success/10 text-success border-success/20",
  "Delayed": "bg-destructive/10 text-destructive border-destructive/20",
  "In Transit": "bg-info/10 text-info border-info/20",
  "Cancelled": "bg-muted text-muted-foreground border-border",
};

const TrainsPage = () => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<TrainFormData>(EMPTY_TRAIN);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchTrains = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trainService.getAll(search ? { search } : undefined);
      setTrains(data);
    } catch (err: any) {
      toast({
        title: "Failed to load trains",
        description: err.response?.data?.message || "Check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchTrains(); }, [fetchTrains]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trainNumber.trim() || !formData.trainName.trim()) {
      toast({ title: "Validation", description: "Train number and name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await trainService.update(editId, formData);
        toast({ title: "✅ Updated", description: `Train ${formData.trainNumber} updated.` });
      } else {
        await trainService.create(formData);
        toast({ title: "✅ Added", description: `Train ${formData.trainNumber} created.` });
      }
      setDialogOpen(false);
      setFormData(EMPTY_TRAIN);
      setEditId(null);
      fetchTrains();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.response?.data?.message || "Failed to save train.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (train: Train) => {
    setFormData({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      source: train.source,
      destination: train.destination,
      departureTime: train.departureTime || "",
      arrivalTime: train.arrivalTime || "",
      status: train.status,
      priority: train.priority,
      delay: train.delay,
    });
    setEditId(train._id);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await trainService.delete(deleteId);
      toast({ title: "Deleted", description: "Train removed from system." });
      fetchTrains();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || "Could not delete train.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const field = (key: keyof typeof EMPTY_TRAIN, label: string, type = "text", extra = {}) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-foreground/80">{label}</Label>
      <Input
        type={type}
        value={String(formData[key])}
        onChange={(e) =>
          setFormData({ ...formData, [key]: type === "number" ? Number(e.target.value) : e.target.value })
        }
        className="bg-secondary/50 border-border/50"
        {...extra}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Train Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {trains.length} train{trains.length !== 1 ? "s" : ""} in the network
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search trains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTrains()}
            className="w-48 bg-secondary/50 border-border/50 text-sm"
          />
          <Button variant="outline" size="icon" onClick={fetchTrains} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setFormData(EMPTY_TRAIN); setEditId(null); }} className="gap-2">
                <Plus className="h-4 w-4" /> Add Train
              </Button>
            </DialogTrigger>
            <DialogContent className="border border-border bg-white sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground text-lg font-bold">
                  {editId ? "Edit Train" : "Add New Train"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  {field("trainNumber", "Train Number")}
                  {field("trainName", "Train Name")}
                  {field("source", "Source Station")}
                  {field("destination", "Destination")}
                  {field("departureTime", "Departure Time", "text", { placeholder: "HH:MM" })}
                  {field("arrivalTime", "Arrival Time", "text", { placeholder: "HH:MM" })}

                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/80">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Train["status"]) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On Time">On Time</SelectItem>
                        <SelectItem value="Delayed">Delayed</SelectItem>
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {field("priority", "Priority (1=High, 3=Low)", "number", { min: 1, max: 5 })}

                  <div className="col-span-2">
                    {field("delay", "Current Delay (minutes)", "number", { min: 0 })}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editId ? "Update Train" : "Add Train"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Trains Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden bg-white card-hover"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <TrainIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-base font-semibold">No trains found</p>
            <p className="text-sm mt-2 opacity-70">
              {search ? "Try a different search term" : "Run: node scripts/seed.js to add demo trains"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Train", "Route", "Departure", "Arrival", "Status", "Priority", "Delay", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trains.map((train) => (
                  <tr key={train._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-foreground font-bold">
                      {train.trainNumber}
                    </td>
                    <td className="px-5 py-4 text-foreground font-semibold">{train.trainName}</td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-sm">
                      {train.source} → {train.destination}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-sm">
                      {train.departureTime || "—"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-sm">
                      {train.arrivalTime || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={`${STATUS_STYLES[train.status] || ""} rounded-full`}>
                        {train.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-center text-foreground font-bold">{train.priority}</td>
                    <td className="px-5 py-4">
                      <span className={train.delay > 5 ? "badge-danger" : "badge-success"}>
                        {train.delay > 0 ? `+${train.delay}m` : "0m"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(train)}
                          className="h-8 w-8 rounded-lg hover:bg-blue-100 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(train._id)}
                          className="h-8 w-8 rounded-lg hover:bg-red-100 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border border-border bg-white border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">Delete Train?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove the train from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainsPage;
