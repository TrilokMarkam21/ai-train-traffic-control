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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Trains", icon: Train, to: "/trains" },
  { label: "Tracking", icon: Navigation, to: "/tracking" },
  { label: "AI Control", icon: Brain, to: "/ai-control" },
  { label: "Analytics", icon: BarChart3, to: "/analytics" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col glass-strong border-r border-border/50 transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-3 p-4 border-b border-border/30">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <Train className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-foreground whitespace-nowrap">AI TrainControl</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border/30 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
