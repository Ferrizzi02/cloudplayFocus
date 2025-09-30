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
      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        toast({
          title: "Usuário não encontrado",
          description: "Nenhum usuário com esse e-mail foi encontrado.",
          variant: "destructive",
        });
        return;
      }

      const friendId = profiles[0].id;
      if (friendId === userId) {
        toast({
          title: "Não é possível adicionar a si mesmo",
          variant: "destructive",
        });
        return;
      }

      // Check if already friends
      const { data: existing, error: existingError } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_id", userId)
        .eq("friend_id", friendId)
        .limit(1);
      if (existingError) throw existingError;
      if (existing && existing.length > 0) {
        toast({
          title: "Já é seu amigo",
          description: "Esse usuário já está na sua lista de amigos.",
        });
        return;
      }

      // Add friendship
      const { error: insertError } = await supabase
        .from("friendships")
        .insert({ user_id: userId, friend_id: friendId });
      if (insertError) throw insertError;

      toast({
        title: "Amigo adicionado!",
        description: "O usuário foi adicionado à sua lista de amigos.",
      });
      onFriendAdded();
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
