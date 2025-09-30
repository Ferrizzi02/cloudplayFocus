import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
}

const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="bg-card rounded-3xl p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-card-foreground">Comando de Bordo</h1>
        <Button
          onClick={onLogout}
          variant="outline"
          className="gap-2 bg-transparent border-card-foreground/20 text-card-foreground hover:bg-card-foreground/10"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
