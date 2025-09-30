import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StatsPanelProps {
  userId?: string;
}

interface Stats {
  totalTasks: number;
  hoursRemaining: number;
  hoursUsed: number;
}

const StatsPanel = ({ userId }: StatsPanelProps) => {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    hoursRemaining: 0,
    hoursUsed: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("total_estimated_minutes, total_spent_minutes, is_completed")
        .eq("user_id", userId);

      if (tasks) {
        const totalTasks = tasks.length;
        const totalEstimated = tasks.reduce((sum, t) => sum + t.total_estimated_minutes, 0);
        const totalSpent = tasks.reduce((sum, t) => sum + t.total_spent_minutes, 0);
        
        setStats({
          totalTasks,
          hoursRemaining: Math.round((totalEstimated - totalSpent) / 60 * 10) / 10,
          hoursUsed: Math.round(totalSpent / 60 * 10) / 10,
        });
      }
    };

    fetchStats();

    // Subscribe to changes
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="bg-card rounded-3xl p-6 shadow-card">
      <h2 className="text-xl font-bold text-card-foreground mb-4">
        Estatísticas da Missão de Hoje
      </h2>
      <div className="grid grid-cols-3 gap-6">
        <StatCircle value={stats.totalTasks} label="Tarefas" />
        <StatCircle value={stats.hoursRemaining} label="Horas Restantes" />
        <StatCircle value={stats.hoursUsed} label="Horas Utilizadas" />
      </div>
    </div>
  );
};

const StatCircle = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-20 h-20 rounded-full bg-gradient-planet flex items-center justify-center shadow-glow mb-2">
      <span className="text-3xl font-bold text-foreground">{value}</span>
    </div>
    <p className="text-sm text-card-foreground text-center">{label}</p>
  </div>
);

export default StatsPanel;
