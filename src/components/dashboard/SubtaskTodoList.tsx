import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  estimated_minutes: number;
  spent_minutes: number;
}

interface SubtaskTodoListProps {
  taskId: string;
}

const SubtaskTodoList = ({ taskId }: SubtaskTodoListProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubtasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("subtasks")
        .select("*")
        .eq("task_id", taskId)
        .order("order_index", { ascending: true });
      if (!error && data) setSubtasks(data);
      setLoading(false);
    };
    fetchSubtasks();
  }, [taskId]);

  const toggleComplete = async (subtaskId: string, isCompleted: boolean) => {
    await supabase
      .from("subtasks")
      .update({ is_completed: !isCompleted })
      .eq("id", subtaskId);
    setSubtasks(subtasks =>
      subtasks.map(st =>
        st.id === subtaskId ? { ...st, is_completed: !isCompleted } : st
      )
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Subtasks</h3>
      {loading ? (
        <div>Loading...</div>
      ) : subtasks.length === 0 ? (
        <div>No subtasks found.</div>
      ) : (
        <ul className="space-y-2 text-card-foreground">
          {subtasks.map(subtask => (
            <li key={subtask.id} className="flex items-center gap-2">
              <Checkbox
                checked={!!subtask.is_completed}
                onCheckedChange={() => toggleComplete(subtask.id, !!subtask.is_completed)}
              />
              <span className={subtask.is_completed ? "line-through text-card-foreground" : ""}>
                {subtask.title}
              </span>
              <span className="ml-auto text-xs text-card-foreground">
                {subtask.estimated_minutes} min
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubtaskTodoList;
