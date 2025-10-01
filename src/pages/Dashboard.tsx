import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsPanel from "@/components/dashboard/StatsPanel";
import TasksGrid from "@/components/dashboard/TasksGrid";
import FriendsPanel from "@/components/dashboard/FriendsPanel";
import AddTaskDialog from "@/components/dashboard/AddTaskDialog";
import rocketImg from "@/assets/rocket.png";
import astronautImg from "@/assets/astronaut.png";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Até logo! Missão encerrada." });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-space flex items-center justify-center">
        <p className="text-foreground text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-space relative overflow-hidden">
      {/* Decorative elements */}
      <img 
        src={rocketImg} 
        alt="" 
        className="absolute bottom-12 left-12 w-48 h-48 opacity-60 pointer-events-none"
      />
      <img 
        src={astronautImg} 
        alt="" 
        className="absolute bottom-12 right-12 w-48 h-48 opacity-60 pointer-events-none"
      />

      <div className="relative z-10 container mx-auto p-6 space-y-6">
        <DashboardHeader user={user} onLogout={handleLogout} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StatsPanel userId={user?.id} />
            
            <div className="bg-card rounded-3xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-card-foreground">
                  Bem-vindo(a)! Pronto(a) para decolar?
                </h2>
                <AddTaskDialog userId={user?.id} />
              </div>
              <TasksGrid userId={user?.id} />
            </div>
          </div>

          <div>
            <FriendsPanel userId={user?.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
