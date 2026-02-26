import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Major Indian Railway Stations with coordinates
export const indianRailwayStations = [
  { name: "New Delhi", code: "NDLS", lat: 28.6418, lng: 77.2194 },
  { name: "Mumbai CST", code: "CSTM", lat: 18.9398, lng: 72.8355 },
  { name: "Howrah", code: "HWH", lat: 22.5858, lng: 88.3442 },
  { name: "Chennai Central", code: "MAS", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata Sealdah", code: "SDAH", lat: 22.5674, lng: 88.3475 },
  { name: "Secunderabad", code: "SC", lat: 17.4426, lng: 78.5014 },
  { name: "Ahmedabad", code: "ADI", lat: 22.9905, lng: 72.5919 },
  { name: "Pune", code: "PUNE", lat: 18.5278, lng: 73.8548 },
  { name: "Jaipur", code: "JP", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", code: "LKO", lat: 26.8467, lng: 80.9462 },
  { name: "Bengaluru", code: "SBC", lat: 12.9719, lng: 77.5909 },
  { name: "Hyderabad", code: "HYB", lat: 17.2403, lng: 78.4294 },
  { name: "Nagpur", code: "NGP", lat: 21.1458, lng: 79.0882 },
  { name: "Patna", code: "PNBE", lat: 25.5941, lng: 85.1376 },
  { name: "Bhopal", code: "BPL", lat: 23.2599, lng: 77.4126 },
  { name: "Mumbai Central", code: "BCT", lat: 18.9713, lng: 72.8188 },
  { name: "Surat", code: "ST", lat: 21.1702, lng: 72.8311 },
  { name: "Indore", code: "INDB", lat: 22.7196, lng: 75.8577 },
  { name: "Kanpur", code: "CNB", lat: 26.4499, lng: 80.3319 },
  { name: "Ludhiana", code: "LDH", lat: 30.9010, lng: 75.8573 },
  { name: "Kochi", code: "ERS", lat: 9.9312, lng: 76.2673 },
  { name: "Visakhapatnam", code: "VSKP", lat: 17.6868, lng: 83.2185 },
  { name: "Varanasi", code: "BSB", lat: 25.3176, lng: 82.9739 },
  { name: "Amritsar", code: "ASR", lat: 31.6340, lng: 74.8723 },
  { name: "Jammu", code: "JAT", lat: 32.7266, lng: 74.8570 },
  { name: "Guwahati", code: "GHY", lat: 26.1445, lng: 91.7362 },
  { name: "Bhubaneswar", code: "BBS", lat: 20.2961, lng: 85.8245 },
  { name: "Ranchi", code: "RNC", lat: 23.3441, lng: 85.3095 },
  { name: "Goa", code: "MAO", lat: 15.4907, lng: 73.8278 },
  { name: "Shimla", code: "SML", lat: 31.1048, lng: 77.1734 },
];

// Major railway routes between stations
export const railwayRoutes = [
  // Delhi - Mumbai route
  { from: "New Delhi", to: "Ahmedabad", color: "#e74c3c" },
  { from: "Ahmedabad", to: "Mumbai Central", color: "#e74c3c" },
  // Delhi - Howrah route
  { from: "New Delhi", to: "Kanpur", color: "#3498db" },
  { from: "Kanpur", to: "Patna", color: "#3498db" },
  { from: "Patna", to: "Howrah", color: "#3498db" },
  // Delhi - Chennai route
  { from: "New Delhi", to: "Bhopal", color: "#9b59b6" },
  { from: "Bhopal", to: "Nagpur", color: "#9b59b6" },
  { from: "Nagpur", to: "Secunderabad", color: "#9b59b6" },
  { from: "Secunderabad", to: "Chennai Central", color: "#9b59b6" },
  // Mumbai - Bengaluru route
  { from: "Mumbai Central", to: "Pune", color: "#2ecc71" },
  { from: "Pune", to: "Bengaluru", color: "#2ecc71" },
  // Howrah - Chennai route
  { from: "Howrah", to: "Bhubaneswar", color: "#f39c12" },
  { from: "Bhubaneswar", to: "Visakhapatnam", color: "#f39c12" },
  { from: "Visakhapatnam", to: "Chennai Central", color: "#f39c12" },
  // Delhi - Jammu route
  { from: "New Delhi", to: "Jammu", color: "#1abc9c" },
  // Kolkata - Guwahati
  { from: "Howrah", to: "Guwahati", color: "#e67e22" },
  // Bengaluru - Kochi
  { from: "Bengaluru", to: "Kochi", color: "#16a085" },
];

// Create custom train icon
const trainIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1042/1042263.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Create station icon
const stationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Component to center map on India
function MapCenter() {
  const map = useMap();
  useEffect(() => {
    map.setView([22.5937, 82.9629], 5);
  }, [map]);
  return null;
}

interface IndiaRailwayMapProps {
  trains?: Array<{
    trainNumber: string;
    trainName: string;
    lat: number;
    lng: number;
    status?: string;
  }>;
}

const IndiaRailwayMap: React.FC<IndiaRailwayMapProps> = ({ trains = [] }) => {
  // Get station coordinates by name
  const getStationCoords = (name: string) => {
    const station = indianRailwayStations.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );
    return station ? [station.lat, station.lng] as [number, number] : null;
  };

  return (
    <MapContainer
      center={[22.5937, 82.9629]}
      zoom={5}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenter />
      
      {/* Draw railway routes */}
      {railwayRoutes.map((route, idx) => {
        const fromCoords = getStationCoords(route.from);
        const toCoords = getStationCoords(route.to);
        if (!fromCoords || !toCoords) return null;
        
        return (
          <Polyline
            key={idx}
            positions={[fromCoords, toCoords]}
            pathOptions={{ color: route.color, weight: 3, opacity: 0.7, dashArray: "10, 10" }}
          />
        );
      })}
      
      {/* Station markers */}
      {indianRailwayStations.map((station) => (
        <Marker key={station.code} position={[station.lat, station.lng]} icon={stationIcon}>
          <Popup>
            <div style={{ minWidth: 150 }}>
              <strong>{station.name}</strong><br />
              <span style={{ fontSize: "12px", color: "#666" }}>Code: {station.code}</span>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Train markers */}
      {trains.map((train) => (
        <Marker
          key={train.trainNumber}
          position={[train.lat, train.lng]}
          icon={trainIcon}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{train.trainNumber}</strong><br />
              <span>{train.trainName}</span><br />
              {train.status && (
                <span style={{ 
                  color: train.status === "On Time" ? "green" : "red",
                  fontSize: "12px"
                }}>
                  Status: {train.status}
                </span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default IndiaRailwayMap;
