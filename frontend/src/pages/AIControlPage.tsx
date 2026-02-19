import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trainService } from "@/services/trainService";
import { aiService } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Loader2, AlertTriangle, Clock, Shield, Lightbulb } from "lucide-react";

const riskColors = {
  Low: "bg-success/10 text-success border-success/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  High: "bg-destructive/10 text-destructive border-destructive/20",
};

const AIControlPage = () => {
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [currentDelay, setCurrentDelay] = useState(0);
  const [trackStatus, setTrackStatus] = useState("Clear");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    trainService.getAll().then(setTrains).catch(() => {});
  }, []);

  const selectedTrainData = trains.find((t) => t.trainNumber === selectedTrain);

  const handleAnalyze = async () => {
    if (!selectedTrain) {
      toast({ title: "Select a train", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await aiService.predict({
        trainNumber: selectedTrain,
        currentDelay,
        priority: selectedTrainData?.priority || 1,
        trackStatus,
      });
      setResult(res);
    } catch {
      toast({ title: "Prediction Failed", description: "AI engine error.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-accent" />
          AI Control Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered delay prediction & conflict analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Analysis Parameters</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/80">Select Train</Label>
              <Select value={selectedTrain} onValueChange={setSelectedTrain}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Choose a train" /></SelectTrigger>
                <SelectContent>
                  {trains.map((t) => (
                    <SelectItem key={t._id} value={t.trainNumber}>
                      {t.trainNumber} - {t.trainName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/80">Current Delay (minutes)</Label>
              <Input type="number" min={0} value={currentDelay} onChange={(e) => setCurrentDelay(Number(e.target.value))} className="bg-secondary/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/80">Track Status</Label>
              <Select value={trackStatus} onValueChange={setTrackStatus}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear">Clear</SelectItem>
                  <SelectItem value="Congested">Congested</SelectItem>
                  <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAnalyze} className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">AI Prediction Results</h3>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <Brain className="h-5 w-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">AI engine processing...</p>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="glass rounded-lg p-4 glow-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Predicted Delay</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground glow-text">{result.predictedDelay} <span className="text-sm font-normal text-muted-foreground">minutes</span></p>
                </div>

                <div className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium text-muted-foreground">Conflict Risk</span>
                    </div>
                    <Badge variant="outline" className={riskColors[result.conflictRisk] || ""}>
                      {result.conflictRisk}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg p-4 bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-primary">AI Recommendation</span>
                      <p className="text-sm text-foreground/80 mt-1">{result.recommendation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Select a train and run analysis</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AIControlPage;
