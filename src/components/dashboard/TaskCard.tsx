import { useState } from "react";
import planetImg from "@/assets/planet.png";
import TaskTimerDialog from "./TaskTimerDialog";

interface Task {
  id: string;
  title: string;
  total_estimated_minutes: number;
  total_spent_minutes: number;
  is_completed: boolean;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const [showTimer, setShowTimer] = useState(false);
  
  const hours = Math.floor(task.total_estimated_minutes / 60);
  const minutes = task.total_estimated_minutes % 60;
  const timeText = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')} hora${hours > 1 ? 's' : ''}`
    : `${minutes} min`;

  return (
    <>
      <button
        onClick={() => setShowTimer(true)}
        className="flex flex-col items-center gap-3 hover:scale-105 transition-transform"
      >
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-glow">
          <img src={planetImg} alt={task.title} className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <p className="text-card-foreground font-semibold">{task.title}</p>
          <p className="text-card-foreground/60 text-sm">{timeText}</p>
        </div>
      </button>

      <TaskTimerDialog 
        task={task}
        open={showTimer}
        onOpenChange={setShowTimer}
      />
    </>
  );
};

export default TaskCard;
