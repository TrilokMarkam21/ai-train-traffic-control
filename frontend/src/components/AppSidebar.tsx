// ============================================================
// frontend/src/components/AppSidebar.tsx  — PRODUCTION UPGRADED
// FIXED: h-4.5 w-4.5 is NOT a valid Tailwind class — replaced with h-5 w-5
// ADDED: Role indicator at bottom
// ADDED: Tooltip on collapsed state
// IMPROVED: Smooth transition on collapse/expand
// ============================================================

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Train,
  Brain,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Calendar,
  Gauge,
  Wrench,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",       icon: LayoutDashboard, to: "/dashboard" },
  { label: "Trains",          icon: Train,            to: "/trains" },
  { label: "Live Tracking",   icon: Navigation,       to: "/tracking" },
  { label: "Schedules",       icon: Calendar,         to: "/schedules" },
  { label: "Traffic Control", icon: Gauge,            to: "/traffic-control" },
  { label: "Maintenance",     icon: Wrench,           to: "/maintenance" },
  { label: "AI Control",      icon: Brain,            to: "/ai-control" },
  { label: "Analytics",       icon: BarChart3,        to: "/analytics" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col glass-strong border-r border-border transition-all duration-300 z-40 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30 min-h-[60px]">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <Train className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <span className="text-sm font-bold text-foreground whitespace-nowrap block">
              TrainControl
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap block">
              Network System
            </span>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* FIXED: was h-4.5 w-4.5 (invalid Tailwind) */}
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {/* Active dot indicator when collapsed */}
                {collapsed && isActive && (
                  <span className="absolute left-1 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user role + logout + collapse toggle */}
      <div className="p-2 border-t border-border/30 space-y-1">
        {/* Role display when expanded */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
