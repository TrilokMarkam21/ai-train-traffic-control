import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

const TopNavbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-14 border-b border-border/30 glass-strong flex items-center justify-between px-6 sticky top-0 z-30">
      <h2 className="text-sm font-semibold text-foreground">
        AI Train Traffic Control System
      </h2>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/10 border border-primary/20">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground leading-none">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || "operator"}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          Online
        </Badge>
      </div>
    </header>
  );
};

export default TopNavbar;
