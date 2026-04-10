// ============================================================
// frontend/src/pages/AIControlPage.tsx  — PRODUCTION UPGRADED
// FIX 1: Now displays "factors" from AI response (was silently ignored)
// FIX 2: Shows confidence score as visual progress bar
// FIX 3: Shows source (AI model vs fallback)
// FIX 4: Better error messages from server response
// FIX 5: Added AI service health status badge
// ============================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trainService } from "@/services/trainService";
import { aiService, AIPrediction } from "@/services/aiService";
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
import {
  Brain,
  Loader2,
  AlertTriangle,
  Clock,
  Shield,
  Lightbulb,
  CheckCircle,
  List,
  Activity,
  Cpu,
} from "lucide-react";

const riskConfig: Record<string, { color: string; icon: string }> = {
  Low: { color: "bg-success/10 text-success border-success/20", icon: "✅" },
  Medium: { color: "bg-warning/10 text-warning border-warning/20", icon: "⚠️" },
  High: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: "🔴" },
  Critical: { color: "bg-destructive/20 text-destructive border-destructive/40", icon: "🚨" },
};

const AIControlPage = () => {
  const [trains, setTrains] = useState<any[]>([]);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [currentDelay, setCurrentDelay] = useState(0);
  const [trackStatus, setTrackStatus] = useState("Clear");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIPrediction | null>(null);
  const [aiStatus, setAiStatus] = useState<"unknown" | "healthy" | "fallback">("unknown");
  const { toast } = useToast();

  useEffect(() => {
    trainService.getAll().then(setTrains).catch(() => {});
    // Check AI service status
    aiService.getServiceStatus().then((status) => {
      setAiStatus(status.status === "healthy" ? "healthy" : "fallback");
    }).catch(() => setAiStatus("fallback"));
  }, []);

  const selectedTrainData = trains.find((t) => t.trainNumber === selectedTrain);

  const handleAnalyze = async () => {
    if (!selectedTrain) {
      toast({ title: "Select a train first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await aiService.predict({
        trainNumber: selectedTrain,
        currentDelay: Number(currentDelay) || 0,
        priority: selectedTrainData?.priority || 1,
        trackStatus: trackStatus as any,
      });
      setResult(res);
    } catch (err: any) {
      toast({
        title: "Prediction Failed",
        description: err.response?.data?.message || "AI engine error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const riskStyle = result ? riskConfig[result.conflictRisk] || riskConfig.Low : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            AI Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered delay prediction & conflict analysis
          </p>
        </div>
        {/* AI Service Status Badge */}
        <Badge
          variant="outline"
          className={
            aiStatus === "healthy"
              ? "border-success/40 text-success bg-success/10"
              : aiStatus === "fallback"
              ? "border-warning/40 text-warning bg-warning/10"
              : "border-border text-muted-foreground"
          }
        >
          <Cpu className="h-3 w-3 mr-1" />
          {aiStatus === "healthy"
            ? "AI Model Active"
            : aiStatus === "fallback"
            ? "Fallback Mode"
            : "Checking..."}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="stat-card p-6"
        >
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Analysis Parameters
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Select Train</Label>
              <Select value={selectedTrain} onValueChange={setSelectedTrain}>
                <SelectTrigger className="border-border bg-blue-50/30 hover:bg-blue-50 transition-colors">
                  <SelectValue placeholder="Choose a train" />
                </SelectTrigger>
                <SelectContent>
                  {trains.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      No trains — add trains first
                    </SelectItem>
                  )}
                  {trains.map((t) => (
                    <SelectItem key={t._id} value={t.trainNumber}>
                      {t.trainNumber} — {t.trainName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Delay (minutes)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={currentDelay}
                onChange={(e) => setCurrentDelay(Number(e.target.value))}
                className="border-border bg-blue-50/30 hover:bg-blue-50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Track Status</Label>
              <Select value={trackStatus} onValueChange={setTrackStatus}>
                <SelectTrigger className="border-border bg-blue-50/30 hover:bg-blue-50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear">🟢 Clear</SelectItem>
                  <SelectItem value="Occupied">🟡 Occupied</SelectItem>
                  <SelectItem value="Congested">🟠 Congested</SelectItem>
                  <SelectItem value="Under Maintenance">🔧 Under Maintenance</SelectItem>
                  <SelectItem value="Blocked">🔴 Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTrainData && (
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50/40 p-4 text-xs text-muted-foreground border border-blue-200/50">
                <span className="font-bold text-foreground">Train Details: </span>
                {selectedTrainData.source} → {selectedTrainData.destination}
                {" · "}Priority {selectedTrainData.priority}
                {selectedTrainData.delay > 0 && (
                  <span className="text-warning ml-1 font-semibold">
                    · Already {selectedTrainData.delay}min late
                  </span>
                )}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-semibold h-11 rounded-lg"
              disabled={loading || !selectedTrain}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </Button>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="stat-card p-6"
        >
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-600" />
            AI Prediction Results
          </h3>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <Brain className="h-5 w-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground mt-4 font-medium">
                  AI engine processing...
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 fade-in-scale"
              >
                {/* Delay */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/40 border border-blue-200/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Predicted Delay
                    </span>
                    {result.source === "fallback" && (
                      <Badge variant="outline" className="text-xs ml-auto opacity-60">
                        Fallback
                      </Badge>
                    )}
                  </div>
                  <p className="text-4xl font-bold text-foreground">
                    {result.predictedDelay}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      min
                    </span>
                  </p>
                </div>

                {/* Risk + Confidence */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50/40 border border-orange-200/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Risk Level
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${riskStyle?.color || ""} rounded-full`}
                    >
                      {riskStyle?.icon} {result.conflictRisk}
                    </Badge>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50/40 border border-green-200/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Confidence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar flex-1">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground min-w-fit">
                        {confidencePct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Factors — FIX: was never displayed before */}
                {result.factors && result.factors.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50/40 border border-purple-200/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <List className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Contributing Factors
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {result.factors.map((factor, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-foreground/80"
                        >
                          <span className="text-purple-600 font-bold mt-0.5">›</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <div className="rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-amber-50/40 border border-amber-200/50">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        AI Recommendation
                      </span>
                      <p className="text-sm text-foreground mt-2 font-medium">
                        {result.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
              >
                <AlertTriangle className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Select a train and run analysis</p>
                <p className="text-xs mt-1 opacity-60">
                  AI will predict delay, risk level, and provide recommendations
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AIControlPage;
