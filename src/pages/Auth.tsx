import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import rocketImg from "@/assets/rocket.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({ title: "Cadastro realizado! Redirecionando..." });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative rocket */}
      <img 
        src={rocketImg} 
        alt="" 
        className="absolute bottom-8 left-8 w-32 h-32 opacity-80 animate-pulse"
      />
      
      <div className="w-full max-w-md bg-card rounded-3xl p-8 shadow-card">
        <h1 className="text-3xl font-bold text-card-foreground mb-2">
          {isLogin ? "Login" : "Cadastro"}
        </h1>
        <p className="text-card-foreground/70 mb-6">
          {isLogin 
            ? "Insira suas credenciais para iniciar a missão!" 
            : "Registre-se para começar sua jornada espacial!"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-card-foreground">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-secondary border-none text-secondary-foreground placeholder:text-secondary-foreground/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary border-none text-secondary-foreground placeholder:text-secondary-foreground/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-secondary border-none text-secondary-foreground placeholder:text-secondary-foreground/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-full shadow-glow transition-all"
          >
            {loading ? "Aguarde..." : isLogin ? "Decolar!" : "Registrar!"}
          </Button>
        </form>

        <p className="text-center text-card-foreground/70 mt-6 text-sm">
          {isLogin ? "Ainda não se cadastrou?" : "Já tem uma conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Registre-se agora!" : "Faça login!"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
