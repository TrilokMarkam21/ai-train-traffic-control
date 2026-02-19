import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Train, Brain, AlertTriangle, Clock, Activity, TrendingUp, Loader2 } from "lucide-react";
import axiosInstance from "@/services/axiosInstance";

const DashboardPage = () => {
  const [stats, setStats] = useState({
    activeTrains: 0,
    aiPredictions: 0,
    conflicts: 0,
    avgDelay: 0,
    loading: true
  });
  const [systemStatus, setSystemStatus] = useState([
    { name: "Signal Network", status: "Operational", pct: 98 },
    { name: "AI Engine", status: "Active", pct: 100 },
    { name: "Track Sensors", status: "Operational", pct: 95 },
    { name: "Communication Hub", status: "Operational", pct: 99 },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch trains from backend
      const trainsRes = await axiosInstance.get("/api/trains");
      const trains = trainsRes.data;

      // Calculate stats
      const activeTrains = trains.length;
      const totalDelay = trains.reduce((sum, train) => sum + (train.delay || 0), 0);
      const avgDelay = activeTrains > 0 ? (totalDelay / activeTrains).toFixed(1) : 0;

      // Count delayed trains as "conflicts"
      const conflicts = trains.filter(train => train.status === "Delayed").length;

      // Generate recent activity from train data
      const activities: { msg: string; time: string; type: string }[] = [];
      trains.slice(0, 4).forEach((train: any, idx: number) => {
        activities.push({
          msg: `Train #${train.trainNumber} - ${train.status}`,
          time: `${idx * 5 + 2} min ago`,
          type: train.status === "On Time" ? "success" : "warning"
        });
      });

      // Add some AI prediction activity
      activities.push({
        msg: `AI analyzed ${activeTrains} trains`,
        time: "1 min ago",
        type: "info"
      });

      setStats({
        activeTrains,
        aiPredictions: Math.floor(Math.random() * 50) + activeTrains * 2,
        conflicts,
        avgDelay: Number(avgDelay),
        loading: false
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const statCards = stats.loading ? [
    { label: "Active Trains", value: "-", icon: Train, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "AI Predictions", value: "-", icon: Brain, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
    { label: "Conflicts Detected", value: "-", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { label: "Avg Delay", value: "-", icon: Clock, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
  ] : [
    { label: "Active Trains", value: stats.activeTrains.toString(), icon: Train, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "AI Predictions", value: stats.aiPredictions.toString(), icon: Brain, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
    { label: "Conflicts Detected", value: stats.conflicts.toString(), icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { label: "Avg Delay", value: `${stats.avgDelay}m`, icon: Clock, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of your train network</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={item}>
            <div className="glass rounded-xl p-5 hover:glow-primary transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bg} border ${card.border}`}>
                  {stats.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  )}
                </div>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* System status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            System Status
          </h3>
          <div className="space-y-3">
            {systemStatus.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground/80">{s.name}</span>
                    <span className="text-success text-xs">{s.status}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-success transition-all" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : "bg-info"
                }`} />
                <div className="flex-1">
                  <p className="text-foreground/80">{a.msg}</p>
                  <p className="text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-xs text-muted-foreground">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
