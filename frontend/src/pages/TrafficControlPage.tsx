// ============================================================
// frontend/src/pages/TrafficControlPage.tsx  — PRODUCTION UPGRADED
// FIX 1: Import from '@/api/trafficControlApi' (not '../api/trafficControlApi')
//        for consistency with the rest of the codebase
// FIX 2: Added proper error handling with toast notifications
// FIX 3: Loading skeleton states instead of bare "Loading..." text
// FIX 4: Added real-time auto-refresh toggle
// FIX 5: Better empty states
// ============================================================

import { useState, useEffect, useRef } from "react";
import trafficControlApi from "@/api/trafficControlApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Train, Activity, Clock, TrendingUp,
  Shield, RefreshCw, Brain, CheckCircle, Loader2, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const TrafficControlPage = () => {
  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<any[]>([]);
  const [delayImpact, setDelayImpact] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [advancedConflicts, setAdvancedConflicts] = useState<any>(null);
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await trafficControlApi.getDashboard();
      setOccupancy(data.occupancy || []);
      setConflicts(data.conflicts || []);
      setAdherence(data.adherence || []);
      setDelayImpact(data.delayImpact || []);
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || {});
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!silent) {
        toast({
          title: "Traffic dashboard error",
          description: err.response?.data?.message || "Failed to load traffic data. Check backend.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancedConflicts = async () => {
    setLoadingAdvanced(true);
    try {
      const data = await trafficControlApi.getAdvancedConflicts();
      setAdvancedConflicts(data);
    } catch (err: any) {
      toast({
        title: "AI analysis failed",
        description: err.response?.data?.message || "Could not load AI conflict analysis.",
        variant: "destructive",
      });
    } finally {
      setLoadingAdvanced(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => loadDashboard(true), 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Clear": return "bg-success";
      case "Occupied": return "bg-warning";
      case "Congested": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 0) return "text-success";
    if (delay <= 5) return "text-warning";
    if (delay <= 15) return "text-orange-500";
    return "text-destructive";
  };

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-secondary/50 rounded animate-pulse ${className}`} />
  );

  const summaryCards = [
    {
      title: "Section Status",
      icon: Activity,
      value: loading ? null : `${summary.occupiedSections ?? 0}/${summary.totalSections ?? 0}`,
      sub: "sections occupied",
      color: "text-foreground",
    },
    {
      title: "Conflicts",
      icon: AlertTriangle,
      value: loading ? null : summary.totalConflicts ?? 0,
      sub: `${summary.criticalConflicts ?? 0} critical`,
      color: "text-warning",
    },
    {
      title: "On-Time Trains",
      icon: Train,
      value: loading ? null : summary.onTimeTrains ?? 0,
      sub: `${summary.delayedTrains ?? 0} delayed`,
      color: "text-success",
    },
    {
      title: "Average Delay",
      icon: Clock,
      value: loading ? null : `${summary.avgDelayMinutes ?? 0} min`,
      sub: "across all trains",
      color: "text-foreground",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Traffic Control Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdvancedConflicts}
            disabled={loadingAdvanced}
            className="gap-2"
          >
            {loadingAdvanced ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            AI Analysis
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <card.icon className="h-4 w-4" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20 mb-1" />
                ) : (
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-warning/40 glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg flex items-start gap-3 border ${
                  rec.priority === "High"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-warning/5 border-warning/20"
                }`}
              >
                <Shield className={`h-5 w-5 mt-0.5 shrink-0 ${rec.priority === "High" ? "text-destructive" : "text-warning"}`} />
                <div>
                  <p className="font-medium text-sm">{rec.type}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{rec.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Occupancy */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Section Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : occupancy.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No sections in database — run the seeder first
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {occupancy.map((section) => (
                  <div key={section.sectionId} className="border border-border/40 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{section.name}</span>
                      <Badge className={`${getStatusColor(section.status)} text-white text-xs`}>
                        {section.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {section.startStation} → {section.endStation}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getStatusColor(section.status)}`}
                          style={{ width: `${Math.min(section.occupancyPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{section.occupancyPercentage}%</span>
                    </div>
                    {section.trains?.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Trains: {section.trains.map((t: any) => t.trainNumber).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Conflict Detection</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : conflicts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-success gap-2">
                <CheckCircle className="h-10 w-10" />
                <p className="font-medium text-sm">No conflicts detected</p>
                <p className="text-xs text-muted-foreground">Traffic flow is optimal</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="border border-warning/30 bg-warning/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      <span className="font-medium text-sm">{conflict.type}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{conflict.severity}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Section: {conflict.section}
                    </div>
                    <div className="text-xs font-mono">
                      {conflict.trains?.map((t: any) => `${t.trainNumber} (${t.role})`).join(" → ")}
                    </div>
                    <div className="mt-2 text-xs text-warning/80">
                      {conflict.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Adherence Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Schedule Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : adherence.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No schedule data — seed the database and add trains first
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Train</TableHead>
                    <TableHead>Current Section</TableHead>
                    <TableHead>Next Station</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adherence.slice(0, 10).map((train: any) => (
                    <TableRow key={train.trainNumber}>
                      <TableCell className="font-mono font-medium">{train.trainNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{train.currentSection || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{train.nextStation || "—"}</TableCell>
                      <TableCell className={getDelayColor(train.delay)}>
                        {train.delay > 0 ? `+${train.delay}` : train.delay} min
                      </TableCell>
                      <TableCell>
                        <Badge variant={train.delayStatus === "On Time" ? "default" : "destructive"} className="text-xs">
                          {train.delayStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Advanced Conflict Analysis Panel */}
      {advancedConflicts && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-accent/40 glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                AI-Powered Conflict Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Severity summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Critical", key: "critical", color: "text-destructive bg-destructive/5 border-destructive/20" },
                  { label: "High", key: "high", color: "text-orange-500 bg-orange-500/5 border-orange-500/20" },
                  { label: "Medium", key: "medium", color: "text-warning bg-warning/5 border-warning/20" },
                  { label: "Low", key: "low", color: "text-success bg-success/5 border-success/20" },
                ].map(({ label, key, color }) => (
                  <div key={key} className={`text-center p-3 rounded-lg border ${color}`}>
                    <div className="text-2xl font-bold">{advancedConflicts.summary?.[key] ?? 0}</div>
                    <div className="text-xs mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Conflict list */}
              {advancedConflicts.conflicts?.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-foreground">Detected Conflicts</h4>
                  {advancedConflicts.conflicts.map((conflict: any, idx: number) => (
                    <div key={idx} className="p-3 border border-border/40 rounded-lg glass">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{conflict.type} Conflict</span>
                        <Badge variant="outline" className="text-xs">{conflict.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{conflict.description}</p>
                      {conflict.resolution?.recommendation && (
                        <p className="text-xs text-accent mt-2">
                          📋 {conflict.resolution.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-success">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium text-sm">System operating normally</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default TrafficControlPage;
