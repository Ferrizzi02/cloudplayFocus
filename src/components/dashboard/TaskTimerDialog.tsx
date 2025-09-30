import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import SubtaskTodoList from "./SubtaskTodoList";

interface Task {
  id: string;
  title: string;
  total_estimated_minutes: number;
  total_spent_minutes: number;
  is_completed: boolean;
}

interface TaskTimerDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskTimerDialog = ({ task, open, onOpenChange }: TaskTimerDialogProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        task_id: task.id,
        user_id: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao iniciar timer", variant: "destructive" });
      return;
    }

    setTimeEntryId(data.id);
    setIsRunning(true);
  };

  const stopTimer = async () => {
    if (!timeEntryId) return;

    const durationMinutes = Math.round(seconds / 60);
    
    const { error } = await supabase
      .from("time_entries")
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq("id", timeEntryId);

    if (error) {
      toast({ title: "Erro ao parar timer", variant: "destructive" });
      return;
    }

    // Update task spent time
    await supabase
      .from("tasks")
      .update({
        total_spent_minutes: task.total_spent_minutes + durationMinutes,
      })
      .eq("id", task.id);

    setIsRunning(false);
    setSeconds(0);
    setTimeEntryId(null);
    toast({ title: "Tempo registrado!" });
  };

  const completeTask = async () => {
    if (isRunning) {
      await stopTimer();
    }

    await supabase
      .from("tasks")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    toast({ title: "Tarefa concluída! 🎉" });
    onOpenChange(false);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl text-card-foreground">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="text-6xl font-bold text-card-foreground mb-4 font-mono">
              {formatTime(seconds)}
            </div>
            <p className="text-card-foreground/60">
              Tempo gasto: {task.total_spent_minutes} min / {task.total_estimated_minutes} min estimado
            </p>
          </div>

          <SubtaskTodoList taskId={task.id} />

          <div className="flex gap-3">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Play className="w-5 h-5" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={stopTimer}
                variant="destructive"
                className="flex-1 gap-2"
              >
                <Pause className="w-5 h-5" />
                Parar
              </Button>
            )}

            <Button
              onClick={completeTask}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskTimerDialog;
