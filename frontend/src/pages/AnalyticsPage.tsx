import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const delayTrends = [
  { name: "Mon", delay: 5 }, { name: "Tue", delay: 8 }, { name: "Wed", delay: 3 },
  { name: "Thu", delay: 12 }, { name: "Fri", delay: 6 }, { name: "Sat", delay: 4 },
  { name: "Sun", delay: 7 },
];

const priorityData = [
  { name: "Priority 1", value: 8 },
  { name: "Priority 2", value: 12 },
  { name: "Priority 3", value: 6 },
  { name: "Priority 4", value: 3 },
  { name: "Priority 5", value: 1 },
];

const conflictData = [
  { name: "Week 1", low: 12, medium: 5, high: 1 },
  { name: "Week 2", low: 15, medium: 3, high: 2 },
  { name: "Week 3", low: 10, medium: 7, high: 0 },
  { name: "Week 4", low: 18, medium: 4, high: 1 },
];

const PIE_COLORS = [
  "hsl(225, 80%, 56%)", "hsl(190, 90%, 50%)", "hsl(142, 70%, 45%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)",
];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(222, 25%, 10%)",
    border: "1px solid hsl(222, 20%, 18%)",
    borderRadius: "8px",
    color: "hsl(210, 40%, 93%)",
    fontSize: "12px",
  },
};

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Analytics & Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Network performance insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Delay Trends (Weekly)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={delayTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="delay" fill="hsl(225, 80%, 56%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Train Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} fontSize={11}>
                {priorityData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Conflict Risk */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Conflict Risk Statistics</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={conflictData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(215, 20%, 55%)" }} />
              <Line type="monotone" dataKey="low" stroke="hsl(142, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} name="Low Risk" />
              <Line type="monotone" dataKey="medium" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="Medium Risk" />
              <Line type="monotone" dataKey="high" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 4 }} name="High Risk" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
