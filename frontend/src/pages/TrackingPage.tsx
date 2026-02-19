import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Train, Navigation, Zap, Clock, MapPin, Loader2 } from "lucide-react";
import socket from "@/socket/socket";

const TrackingPage = () => {
  const [trains, setTrains] = useState<any[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // Get map bounds (India region)
  const minLat = 20;
  const maxLat = 35;
  const minLng = 68;
  const maxLng = 98;

  const latToY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * 100;
  const lngToX = ((lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Navigation className="h-6 w-6 text-primary" />
          Live Train Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time train positions and movement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 glass rounded-xl p-4 h-[500px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Grid lines for map effect */}
            <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: 'linear-gradient(#4a5568 1px, transparent 1px), linear-gradient(90deg, #4a5568 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} 
            />
            
            {/* Map region outline (India approximate) */}
            <svg className="absolute inset-0 w-full h-full opacity-30">
              <path 
                d="M70 80 L85 70 L95 55 L90 40 L75 35 L65 45 L60 60 L70 80 Z" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>

            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Train markers */}
                {trains.map((train, idx) => {
                  const x = train.longitude ? lngToX(train.longitude) : 50 + idx * 10;
                  const y = train.latitude ? latToY(train.latitude) : 50;
                  
                  return (
                    <motion.div
                      key={train._id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                        selectedTrain?._id === train._id ? 'z-20' : 'z-10'
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => setSelectedTrain(train)}
                    >
                      <div className={`relative ${selectedTrain?._id === train._id ? 'scale-125' : ''}`}>
                        <Train 
                          className={`h-6 w-6 ${
                            train.status === 'Delayed' ? 'text-yellow-500' : 
                            train.status === 'In Transit' ? 'text-blue-500' : 'text-green-500'
                          }`} 
                        />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {train.trainNumber}
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </div>
          
          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-white">On Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-white">Delayed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-white">In Transit</span>
            </div>
          </div>
        </div>

        {/* Train Details Panel */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Train Details
            </h3>
            
            {selectedTrain ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{selectedTrain.trainNumber}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedTrain.status === 'Delayed' ? 'bg-yellow-500/20 text-yellow-500' : 
                    selectedTrain.status === 'In Transit' ? 'bg-blue-500/20 text-blue-500' : 
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {selectedTrain.status}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {selectedTrain.trainName}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      Speed
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {selectedTrain.speedKmph || 0} <span className="text-xs">km/h</span>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Delay
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {selectedTrain.delay || 0} <span className="text-xs">min</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Position
                  </div>
                  <div className="text-sm font-mono text-foreground">
                    {selectedTrain.latitude?.toFixed(4)}, {selectedTrain.longitude?.toFixed(4)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  <div>From: {selectedTrain.source}</div>
                  <div>To: {selectedTrain.destination}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Train className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click a train on the map to see details</p>
              </div>
            )}
          </div>

          {/* Train List */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              All Trains ({trains.length})
            </h3>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {trains.map((train) => (
                <div
                  key={train._id}
                  onClick={() => setSelectedTrain(train)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTrain?._id === train._id 
                      ? 'bg-primary/20 border border-primary/50' 
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">{train.trainNumber}</span>
                    <span className={`text-xs ${
                      train.status === 'Delayed' ? 'text-yellow-500' : 
                      train.status === 'In Transit' ? 'text-blue-500' : 'text-green-500'
                    }`}>
                      {train.speedKmph || 0} km/h
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {train.source} → {train.destination}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
