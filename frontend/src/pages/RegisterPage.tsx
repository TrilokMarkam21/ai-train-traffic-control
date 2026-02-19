import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Train, Loader2 } from "lucide-react";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      login(res.token, res.user);
      toast({ title: "Account created!", description: `Welcome, ${res.user.name}` });
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full bg-accent/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl p-8 glow-primary">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Train className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI TrainControl</h1>
              <p className="text-xs text-muted-foreground">Traffic Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Create Account</h2>
          <p className="text-muted-foreground text-center mb-6 text-sm">Join the AI Train Control network</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/80">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50 border-border/50 focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/50 border-border/50 focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/50 border-border/50 focus:border-primary" />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
