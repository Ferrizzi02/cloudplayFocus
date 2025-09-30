import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";

interface AddTaskDialogProps {
  userId?: string;
}

const AddTaskDialog = ({ userId }: AddTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setAiLoading(true);

    try {
      // Create task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title,
          description,
          total_estimated_minutes: parseInt(availableHours) * 60,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Call AI to break down task
      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "break-down-task",
        {
          body: {
            taskTitle: title,
            taskDescription: description,
            availableHours: parseInt(availableHours),
            taskId: task.id,
          },
        }
      );

      if (aiError) {
        console.error("AI Error:", aiError);
        toast({
          title: "Tarefa criada!",
          description: "Mas não foi possível gerar subtarefas com IA.",
        });
      } else {
        toast({
          title: "Tarefa criada!",
          description: "Subtarefas geradas com IA ✨",
        });
      }

      setOpen(false);
      setTitle("");
      setDescription("");
      setAvailableHours("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-full">
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl text-card-foreground">
            Adicionar Nova Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-card-foreground">
              Título da Tarefa
            </Label>
            <Input
              id="title"
              placeholder="Ex: Estudar para prova de matemática"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-secondary border-none text-secondary-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-card-foreground">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre a tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-none text-secondary-foreground min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours" className="text-card-foreground">
              Horas Disponíveis
            </Label>
            <Input
              id="hours"
              type="number"
              min="1"
              placeholder="Ex: 5"
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              required
              className="bg-secondary border-none text-secondary-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                IA analisando tarefa...
              </>
            ) : loading ? (
              "Criando..."
            ) : (
              "Criar Tarefa"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
