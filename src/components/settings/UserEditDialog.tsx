import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  perfil: z.string(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword || data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword.length >= 6;
  }
  return true;
}, {
  message: "Senha deve ter pelo menos 6 caracteres",
  path: ["newPassword"],
});

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: {
    id_usuario: number;
    nome: string;
    login: string;
    email: string;
    perfil: string;
  } | null;
}

export function UserEditDialog({ open, onOpenChange, onSuccess, user }: UserEditDialogProps) {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("Analista");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setLogin(user.login);
      setEmail(user.email);
      setPerfil(user.perfil);
    } else {
      setNome("");
      setLogin("");
      setEmail("");
      setPerfil("Analista");
    }
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (!user) return;

      userSchema.parse({ nome, login, email, perfil, newPassword, confirmPassword });
      
      // Chamar edge function para atualizar usuário
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          userId: user.id_usuario,
          nome,
          login,
          email,
          perfil,
          newPassword: newPassword.trim() !== "" ? newPassword : undefined
        }
      });

      if (error || data?.error) {
        toast({
          title: "Erro ao atualizar",
          description: data?.error || error?.message || "Erro ao atualizar usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário atualizado!",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao atualizar o usuário",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do usuário"
              />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-login">Login</Label>
              <Input
                id="edit-login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="login_usuario"
              />
              {errors.login && <p className="text-sm text-destructive">{errors.login}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-perfil">Perfil / Tipo de Acesso</Label>
              <select
                id="edit-perfil"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
              >
                <option value="Administrador">Administrador - Acesso total ao sistema</option>
                <option value="Analista">Analista - Dashboard, Lançamentos, Caixa, Dívidas, NFes, Comprovantes, Impostos, Relatórios, Metas</option>
                <option value="Caixa">Caixa - Dashboard, Lançamentos, Caixa, Comprovantes</option>
                <option value="Contador">Contador - Dashboard, NFes, Impostos, Relatórios</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-newPassword">Nova Senha (opcional)</Label>
              <Input
                id="edit-newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
              />
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="edit-confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
