import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation, Clock, MapPin, Loader2, Train } from "lucide-react";
import socket from "@/socket/socket";
import IndiaRailwayMap from "@/components/IndiaRailwayMap";

const TrackingPage = () => {
  const [trains, setTrains] = useState<any[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  useEffect(() => {
    // Listen for real-time train updates
    socket.on("trainUpdate", (updatedTrains: any[]) => {
      setTrains(updatedTrains);
      setLoading(false);
    });

    socket.on("snapshot", (updatedTrains: any[]) => {
      setTrains(updatedTrains);
      setLoading(false);
    });

    return () => {
      socket.off("trainUpdate");
      socket.off("snapshot");
    };
  }, []);

  // Transform trains data for map
  const mapTrains = trains.map(train => ({
    trainNumber: train.trainNumber || train.train_no || "Unknown",
    trainName: train.trainName || train.train_name || "Express",
    lat: train.latitude || train.currentLat || 22.5937,
    lng: train.longitude || train.currentLng || 82.9629,
    status: train.delay > 5 ? "Delayed" : "On Time"
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Navigation className="h-6 w-6 text-primary" />
            Live Train Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time train positions across India
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === "map" 
                ? "bg-primary text-white" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === "list" 
                ? "bg-primary text-white" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            List View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white card-hover p-4 h-[500px] relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2 font-medium">Loading trains...</p>
              </div>
            </div>
          ) : viewMode === "map" ? (
            <IndiaRailwayMap trains={mapTrains} />
          ) : (
            <div className="h-full overflow-auto">
              <table className="w-full text-sm data-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase">Train No.</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase">Position</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trains.map((train, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-border hover:bg-secondary/30 cursor-pointer"
                      onClick={() => setSelectedTrain(train)}
                    >
                      <td className="p-3 font-mono">{train.trainNumber || train.train_no}</td>
                      <td className="p-3">{train.trainName || train.train_name}</td>
                      <td className="p-3 text-muted-foreground">
                        {train.latitude?.toFixed(2)}, {train.longitude?.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (train.delay || 0) > 5
                            ? "bg-destructive/15 text-destructive border border-destructive/20"
                            : "bg-success/15 text-success border border-success/20"
                        }`}>
                          {train.delay > 5 ? "Delayed" : "On Time"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Train List Sidebar */}
        <div className="rounded-xl border border-border bg-white card-hover p-4 h-[500px] overflow-auto">
          <h3 className="text-sm font-bold text-foreground mb-4">Active Trains ({trains.length})</h3>
          <div className="space-y-2">
            {trains.map((train, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg border transition cursor-pointer fade-in-scale ${
                  selectedTrain === train
                    ? "bg-blue-50 border-blue-300/50 shadow-md"
                    : "hover:bg-blue-50/40 border-border"
                }`}
                onClick={() => setSelectedTrain(train)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Train className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-mono font-bold text-sm text-foreground">{train.trainNumber || train.train_no}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 truncate">{train.trainName || train.train_name}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{train.latitude?.toFixed(2)}, {train.longitude?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className={`font-bold ${train.delay > 5 ? "text-red-600" : "text-green-600"}`}>
                      {train.delay || 0}m
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {trains.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No trains available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selected Train Details */}
      {selectedTrain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card p-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-5">
            Train Details: {selectedTrain.trainNumber || selectedTrain.train_no}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50/40 rounded-lg p-4 border border-blue-100/50">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Train Name</p>
              <p className="font-bold text-sm text-foreground">{selectedTrain.trainName || selectedTrain.train_name}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/40 rounded-lg p-4 border border-green-100/50">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Current Delay</p>
              <p className={`font-bold text-sm ${(selectedTrain.delay || 0) > 5 ? "text-red-600" : "text-green-600"}`}>
                {selectedTrain.delay || 0} min
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50/40 rounded-lg p-4 border border-purple-100/50">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Position</p>
              <p className="font-mono text-xs text-foreground">
                {selectedTrain.latitude?.toFixed(4)}, {selectedTrain.longitude?.toFixed(4)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50/40 rounded-lg p-4 border border-orange-100/50">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Speed</p>
              <p className="font-bold text-sm text-foreground">{selectedTrain.speedKmph?.toFixed(0) || 0} km/h</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TrackingPage;
