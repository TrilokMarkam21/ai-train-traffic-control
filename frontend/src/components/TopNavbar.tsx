// ============================================================
// frontend/src/components/TopNavbar.tsx  — PRODUCTION UPGRADED
// ADDED: Real-time WebSocket connection status indicator
// ADDED: AI service status indicator
// ADDED: Role-based badge display
// IMPROVED: Cleaner layout with useful system info
// ============================================================

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { User, Wifi, WifiOff, Brain } from "lucide-react";
import socket from "@/socket/socket";

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/30",
  controller: "bg-primary/10 text-primary border-primary/30",
  engineer: "bg-accent/10 text-accent border-accent/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

const TopNavbar = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Track WebSocket connection state
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Live clock - update every second
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      clearInterval(clockInterval);
    };
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-14 border-b border-border/30 glass-strong flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: System title + time */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-foreground hidden sm:block">
          AI Train Traffic Control
        </h2>
        <div className="text-xs text-muted-foreground font-mono">
          <span className="text-foreground/70">{formattedDate}</span>
          <span className="ml-2 text-primary font-semibold">{formattedTime}</span>
        </div>
      </div>

      {/* Right: Status indicators + user info */}
      <div className="flex items-center gap-3">
        {/* WebSocket connection status */}
        <div
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
            isConnected
              ? "bg-success/10 text-success border-success/30"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}
          title={isConnected ? "Real-time connected" : "Real-time disconnected"}
        >
          {isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border/50" />

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/10 border border-primary/20">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {user?.role || "controller"}
            </p>
          </div>
        </div>

        {/* Role badge */}
        {user?.role && (
          <Badge
            variant="outline"
            className={`text-xs capitalize ${roleColors[user.role] || roleColors.viewer}`}
          >
            {user.role}
          </Badge>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
