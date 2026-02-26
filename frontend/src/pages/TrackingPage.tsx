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
        <div className="lg:col-span-2 glass rounded-xl p-4 h-[500px] relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Loading trains...</p>
              </div>
            </div>
          ) : viewMode === "map" ? (
            <IndiaRailwayMap trains={mapTrains} />
          ) : (
            <div className="h-full overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr>
                    <th className="text-left p-3">Train No.</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Position</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
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
                            ? "bg-red-500/20 text-red-400" 
                            : "bg-green-500/20 text-green-400"
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
        <div className="glass rounded-xl p-4 h-[500px] overflow-auto">
          <h3 className="text-sm font-semibold text-foreground mb-4">Active Trains</h3>
          <div className="space-y-3">
            {trains.map((train, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition ${
                  selectedTrain === train ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedTrain(train)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Train className="h-4 w-4 text-primary" />
                  <span className="font-mono font-medium">{train.trainNumber || train.train_no}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{train.trainName || train.train_name}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {train.latitude?.toFixed(2)}, {train.longitude?.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={train.delay > 5 ? "text-red-400" : "text-green-400"}>
                      {train.delay || 0} min
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {trains.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">
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
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Train Details: {selectedTrain.trainNumber || selectedTrain.train_no}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Train Name</p>
              <p className="font-medium">{selectedTrain.trainName || selectedTrain.train_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Delay</p>
              <p className={`font-medium ${(selectedTrain.delay || 0) > 5 ? "text-red-400" : "text-green-400"}`}>
                {selectedTrain.delay || 0} minutes
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="font-medium">
                {selectedTrain.latitude?.toFixed(4)}, {selectedTrain.longitude?.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="font-medium">{selectedTrain.speed || 0} km/h</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TrackingPage;
