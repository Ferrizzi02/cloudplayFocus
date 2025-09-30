import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddFriendDialogProps {
  userId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFriendAdded: () => void;
}

const AddFriendDialog = ({ userId, open, onOpenChange, onFriendAdded }: AddFriendDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    try {
      // Find user by email (we need to query profiles since we can't access auth.users directly)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      // For now, we'll just show a message since we can't query by email directly
      // In a real app, you'd have a separate friends request system
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Em breve você poderá adicionar amigos pelo email!",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setEmail("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl text-card-foreground">
            Adicionar Amigo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddFriend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="friend-email" className="text-card-foreground">
              E-mail do amigo
            </Label>
            <Input
              id="friend-email"
              type="email"
              placeholder="amigo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary border-none text-secondary-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;
