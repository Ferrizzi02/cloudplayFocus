import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TaskCard from "./TaskCard";

interface TasksGridProps {
  userId?: string;
}

interface Task {
  id: string;
  title: string;
  total_estimated_minutes: number;
  total_spent_minutes: number;
  is_completed: boolean;
}

const TasksGrid = ({ userId }: TasksGridProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (data) setTasks(data);
    };

    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (tasks.length === 0) {
    return (
      <p className="text-center text-card-foreground/60 py-8">
        Nenhuma tarefa ainda. Adicione sua primeira missão!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};

export default TasksGrid;
