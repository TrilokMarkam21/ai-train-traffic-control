// ============================================================
// frontend/src/pages/AnalyticsPage.tsx  — PRODUCTION UPGRADED
// FIX 1: analyticsService.getAnalytics() now properly unwraps data
// FIX 2: Stats cards now show actual DB values, not zeros
// FIX 3: Added AI prediction history table
// FIX 4: Better empty-state handling with seed instructions
// FIX 5: Added error toast instead of just console.error
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Trash2, Brain, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { analyticsService, AnalyticsData } from "@/services/analyticsService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PIE_COLORS = [
  "hsl(217, 92%, 48%)",
  "hsl(168, 83%, 42%)",
  "hsl(142, 72%, 48%)",
  "hsl(39, 88%, 52%)",
  "hsl(0, 84%, 60%)",
];

const FALLBACK_DATA: AnalyticsData = {
  delayTrends: [
    { name: "06:00", delay: 3 }, { name: "08:00", delay: 12 }, { name: "10:00", delay: 7 },
    { name: "12:00", delay: 4 }, { name: "14:00", delay: 5 }, { name: "16:00", delay: 8 },
    { name: "18:00", delay: 15 }, { name: "20:00", delay: 9 }, { name: "22:00", delay: 2 },
  ],
  priorityData: [
    { name: "Priority 1", value: 8 },
    { name: "Priority 2", value: 14 },
    { name: "Priority 3", value: 6 },
  ],
  conflictData: [
    { name: "Mon", low: 12, medium: 5, high: 1 },
    { name: "Tue", low: 15, medium: 3, high: 2 },
    { name: "Wed", low: 10, medium: 7, high: 0 },
    { name: "Thu", low: 18, medium: 4, high: 1 },
    { name: "Fri", low: 14, medium: 6, high: 3 },
  ],
  stats: { totalPredictions: 0, avgDelay: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 },
};

const tooltipStyle = {
  contentStyle: {
    background: "hsl(0 0% 100%)",
    border: "1px solid hsl(220 13% 91%)",
    borderRadius: "8px",
    color: "hsl(220 13% 15%)",
    fontSize: "12px",
  },
};

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, predictions] = await Promise.allSettled([
        analyticsService.getAnalytics(),
        analyticsService.getRecentPredictions(),
      ]);

      if (analyticsData.status === "fulfilled") {
        const d = analyticsData.value;
        if (d.stats.totalPredictions > 0) {
          setData(d);
          setIsRealData(true);
        } else {
          setData(FALLBACK_DATA);
          setIsRealData(false);
        }
      }

      if (predictions.status === "fulfilled") {
        setRecentPredictions(predictions.value.slice(0, 8));
      }
    } catch (err) {
      toast({
        title: "Failed to load analytics",
        description: "Using demo data. Check backend connection.",
        variant: "destructive",
      });
      setData(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClearData = async () => {
    if (!confirm("Clear all AI prediction history? This cannot be undone.")) return;
    try {
      await analyticsService.clearPredictions();
      setData(FALLBACK_DATA);
      setIsRealData(false);
      setRecentPredictions([]);
      toast({ title: "Cleared", description: "All prediction history removed." });
    } catch {
      toast({ title: "Error", description: "Failed to clear data.", variant: "destructive" });
    }
  };

  const statCards = [
    { label: "Total Predictions", value: data.stats.totalPredictions, color: "text-primary" },
    { label: "Avg Delay (min)", value: data.stats.avgDelay, color: "text-foreground" },
    { label: "High Risk Count", value: data.stats.highRiskCount, color: "text-destructive" },
    { label: "Low Risk Count", value: data.stats.lowRiskCount, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Network performance insights from AI predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isRealData && (
            <Button variant="outline" size="sm" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          )}
        </div>
      </div>

      {/* Demo data banner */}
      {!isRealData && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            Showing <strong>demo data</strong> — no AI predictions made yet. Go to{" "}
            <strong>AI Control</strong> and run some analyses to see real data here.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card group"
          >
            <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">{card.label}</p>
            {loading ? (
              <div className="h-8 w-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg animate-shimmer" />
            ) : (
              <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                {typeof card.value === "number" ? card.value.toFixed(card.label.includes("Avg") ? 1 : 0) : card.value}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Delay Trends (Hourly)
          </h3>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.delayTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" stroke="hsl(220 8% 45%)" fontSize={11} />
                <YAxis stroke="hsl(220 8% 45%)" fontSize={11} unit="m" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="delay" fill="hsl(210 98% 42%)" radius={[6, 6, 0, 0]} name="Avg Delay (min)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Priority Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-600" />
            Priority Distribution
          </h3>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                  fontSize={11}
                >
                  {data.priorityData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Conflict Risk Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card p-6 lg:col-span-2"
        >
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Conflict Risk Over Time
          </h3>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.conflictData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" stroke="hsl(220 8% 45%)" fontSize={11} />
                <YAxis stroke="hsl(220 8% 45%)" fontSize={11} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(220 8% 45%)" }} />
                <Line type="monotone" dataKey="low" stroke="hsl(142, 72%, 48%)" strokeWidth={2.5} dot={{ r: 4 }} name="Low Risk" />
                <Line type="monotone" dataKey="medium" stroke="hsl(39, 88%, 52%)" strokeWidth={2.5} dot={{ r: 4 }} name="Medium Risk" />
                <Line type="monotone" dataKey="high" stroke="hsl(0, 84%, 60%)" strokeWidth={2.5} dot={{ r: 4 }} name="High Risk" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Recent AI Predictions Table */}
      {recentPredictions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="border border-border bg-white rounded-lg card-hover p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" />
            Recent AI Predictions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Train", "Track Status", "Pred. Delay", "Risk", "Confidence", "Time"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentPredictions.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-mono text-foreground font-medium">{p.trainNumber}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.trackStatus}</td>
                    <td className="px-3 py-2 text-foreground font-medium">{p.predictedDelay} min</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={
                          p.congestionRisk === "High"
                            ? "border-destructive/40 text-destructive bg-destructive/10"
                            : p.congestionRisk === "Medium"
                            ? "border-warning/40 text-warning bg-warning/10"
                            : "border-success/40 text-success bg-success/10"
                        }
                      >
                        {p.congestionRisk}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {p.confidenceScore ? `${Math.round(p.confidenceScore * 100)}%` : "-"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {new Date(p.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
