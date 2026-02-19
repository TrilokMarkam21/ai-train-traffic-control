import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trainService } from "@/services/trainService";
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
import { Plus, Pencil, Trash2, Train as TrainIcon, Loader2 } from "lucide-react";

const emptyTrain = {
  trainNumber: "", trainName: "", source: "", destination: "",
  departureTime: "", arrivalTime: "", status: "On Time", priority: 1, delay: 0,
};

const statusColors = {
  "On Time": "bg-success/10 text-success border-success/20",
  "Delayed": "bg-destructive/10 text-destructive border-destructive/20",
  "In Transit": "bg-info/10 text-info border-info/20",
};

const TrainsPage = () => {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyTrain);
  const [editId, setEditId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTrains = async () => {
    setLoading(true);
    try {
      const data = await trainService.getAll();
      setTrains(data);
    } catch {
      toast({ title: "Error", description: "Failed to load trains.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrains(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trainNumber || !formData.trainName) {
      toast({ title: "Validation", description: "Train number and name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await trainService.update(editId, formData);
        toast({ title: "Updated", description: "Train updated successfully." });
      } else {
        await trainService.create(formData);
        toast({ title: "Added", description: "Train added successfully." });
      }
      setDialogOpen(false);
      setFormData(emptyTrain);
      setEditId(null);
      fetchTrains();
    } catch {
      toast({ title: "Error", description: "Failed to save train.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (train) => {
    setFormData({
      trainNumber: train.trainNumber, trainName: train.trainName,
      source: train.source, destination: train.destination,
      departureTime: train.departureTime, arrivalTime: train.arrivalTime,
      status: train.status, priority: train.priority, delay: train.delay,
    });
    setEditId(train._id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await trainService.delete(id);
      toast({ title: "Deleted", description: "Train removed." });
      fetchTrains();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const openAdd = () => {
    setFormData(emptyTrain);
    setEditId(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Train Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all trains in the network</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Add Train
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/50 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editId ? "Edit Train" : "Add New Train"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Train Number</Label>
                  <Input value={formData.trainNumber} onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Train Name</Label>
                  <Input value={formData.trainName} onChange={(e) => setFormData({ ...formData, trainName: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Source</Label>
                  <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Destination</Label>
                  <Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Departure Time</Label>
                  <Input value={formData.departureTime} onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })} placeholder="HH:MM" className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Arrival Time</Label>
                  <Input value={formData.arrivalTime} onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })} placeholder="HH:MM" className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On Time">On Time</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80">Priority (1-5)</Label>
                  <Input type="number" min={1} max={5} value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} className="bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-foreground/80">Current Delay (min)</Label>
                  <Input type="number" min={0} value={formData.delay} onChange={(e) => setFormData({ ...formData, delay: Number(e.target.value) })} className="bg-secondary/50 border-border/50" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editId ? "Update Train" : "Add Train"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <TrainIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No trains found. Add your first train!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {["Number", "Name", "Route", "Departure", "Arrival", "Status", "Priority", "Delay", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {trains.map((train) => (
                  <tr key={train._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-foreground">{train.trainNumber}</td>
                    <td className="px-4 py-3 text-foreground">{train.trainName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{train.source} → {train.destination}</td>
                    <td className="px-4 py-3 text-muted-foreground">{train.departureTime}</td>
                    <td className="px-4 py-3 text-muted-foreground">{train.arrivalTime}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColors[train.status] || ""}>{train.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground">{train.priority}</td>
                    <td className="px-4 py-3 text-foreground">{train.delay}m</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(train)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(train._id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
};

export default TrainsPage;
