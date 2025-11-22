import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { UserPlus, Palette, Shield, Users, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserEditDialog } from "@/components/settings/UserEditDialog";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
  perfil: z.string(),
});

const perfilToRoleMap: Record<string, 'admin' | 'analista' | 'caixa' | 'contador'> = {
  'Administrador': 'admin',
  'Analista': 'analista',
  'Caixa': 'caixa',
  'Contador': 'contador',
};

interface Usuario {
  id_usuario: number;
  nome: string;
  login: string;
  email: string;
  perfil: string;
  created_at: string;
}

export default function Settings() {
  const { isAdmin, loading } = useAdmin();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    nome: "",
    login: "",
    perfil: "Analista",
  });

  // Color customization state
  const [colors, setColors] = useState({
    primary: "220 90% 56%",
    secondary: "210 40% 96%",
    accent: "220 90% 56%",
    success: "142 76% 36%",
    warning: "38 92% 50%",
    destructive: "0 84% 60%",
  });

  useEffect(() => {
    // Load saved colors from localStorage
    const savedColors = localStorage.getItem('finansys-colors');
    if (savedColors) {
      try {
        setColors(JSON.parse(savedColors));
      } catch (e) {
        console.error('Error loading saved colors:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios();
    }
  }, [isAdmin]);

  const fetchUsuarios = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = signupSchema.parse(signupData);
      const role = perfilToRoleMap[validated.perfil];
      
      // Call edge function to create user with auto-confirmed email
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: validated.email,
          password: validated.password,
          nome: validated.nome,
          login: validated.login,
          perfil: validated.perfil,
          role: role
        }
      });

      if (error || data?.error) {
        toast({
          title: "Erro no cadastro",
          description: data?.error || error?.message || "Erro ao criar usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário cadastrado!",
        description: "O novo usuário foi criado com sucesso e o email está confirmado.",
      });

      // Reset form
      setSignupData({
        email: "",
        password: "",
        nome: "",
        login: "",
        perfil: "Analista",
      });

      // Refresh user list
      fetchUsuarios();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveColors = () => {
    // Save to localStorage
    localStorage.setItem('finansys-colors', JSON.stringify(colors));
    
    // Apply to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--destructive', colors.destructive);

    toast({
      title: "Cores atualizadas!",
      description: "As cores do sistema foram salvas com sucesso.",
    });
  };

  const handleResetColors = () => {
    const defaultColors = {
      primary: "220 90% 56%",
      secondary: "210 40% 96%",
      accent: "220 90% 56%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      destructive: "0 84% 60%",
    };
    setColors(defaultColors);
    localStorage.removeItem('finansys-colors');
    
    // Reset CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', defaultColors.primary);
    root.style.setProperty('--secondary', defaultColors.secondary);
    root.style.setProperty('--accent', defaultColors.accent);
    root.style.setProperty('--success', defaultColors.success);
    root.style.setProperty('--warning', defaultColors.warning);
    root.style.setProperty('--destructive', defaultColors.destructive);

    toast({
      title: "Cores resetadas!",
      description: "As cores do sistema foram restauradas para o padrão.",
    });
  };

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: Usuario) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Buscar auth_id do usuário antes de deletar
      const { data: usuarioData, error: fetchError } = await supabase
        .from('usuario')
        .select('auth_id')
        .eq('id_usuario', userToDelete.id_usuario)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Deletar registro da tabela usuario
      const { error: deleteUsuarioError } = await supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', userToDelete.id_usuario);

      if (deleteUsuarioError) throw deleteUsuarioError;

      // Se houver auth_id, deletar do auth.users via edge function
      if (usuarioData?.auth_id) {
        await supabase.auth.admin.deleteUser(usuarioData.auth_id);
      }

      toast({
        title: "Usuário excluído!",
        description: "O usuário foi removido do sistema com sucesso.",
      });

      fetchUsuarios();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Não foi possível excluir o usuário. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const getPerfilBadgeVariant = (perfil: string) => {
    switch (perfil) {
      case 'Administrador':
        return 'default';
      case 'Contador':
        return 'secondary';
      case 'Analista':
        return 'outline';
      case 'Caixa':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Área exclusiva para administradores</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários Ativos
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Cadastrar Usuário
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Personalização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Visualize, edite e gerencie todos os usuários ativos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">Carregando usuários...</div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((usuario) => (
                        <TableRow key={usuario.id_usuario}>
                          <TableCell className="font-medium">{usuario.nome}</TableCell>
                          <TableCell>{usuario.login}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <Badge variant={getPerfilBadgeVariant(usuario.perfil)}>
                              {usuario.perfil}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUser(usuario)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(usuario)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Usuário</CardTitle>
              <CardDescription>
                Apenas administradores podem criar novos usuários no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Nome do usuário"
                      value={signupData.nome}
                      onChange={(e) => setSignupData(prev => ({ ...prev, nome: e.target.value }))}
                    />
                    {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login">Login</Label>
                    <Input
                      id="login"
                      type="text"
                      placeholder="login_usuario"
                      value={signupData.login}
                      onChange={(e) => setSignupData(prev => ({ ...prev, login: e.target.value }))}
                    />
                    {errors.login && <p className="text-sm text-destructive">{errors.login}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Senha mínima de 6 caracteres"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="perfil">Perfil / Tipo de Acesso</Label>
                    <select
                      id="perfil"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      value={signupData.perfil}
                      onChange={(e) => setSignupData(prev => ({ ...prev, perfil: e.target.value }))}
                    >
                      <option value="Administrador">Administrador - Acesso total ao sistema</option>
                      <option value="Analista">Analista - Dashboard, Lançamentos, Caixa, Dívidas, NFes, Comprovantes, Impostos, Relatórios, Metas</option>
                      <option value="Caixa">Caixa - Dashboard, Lançamentos, Caixa, Comprovantes</option>
                      <option value="Contador">Contador - Dashboard, NFes, Impostos, Relatórios</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Cadastrando..." : "Cadastrar Usuário"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Personalização de Cores</CardTitle>
              <CardDescription>
                Customize as cores principais do sistema (formato HSL: matiz saturação luminosidade)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Cor Primária</Label>
                  <Input
                    id="primary"
                    type="text"
                    placeholder="220 90% 56%"
                    value={colors.primary}
                    onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.primary})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Cor Secundária</Label>
                  <Input
                    id="secondary"
                    type="text"
                    placeholder="210 40% 96%"
                    value={colors.secondary}
                    onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.secondary})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Cor de Destaque</Label>
                  <Input
                    id="accent"
                    type="text"
                    placeholder="220 90% 56%"
                    value={colors.accent}
                    onChange={(e) => setColors(prev => ({ ...prev, accent: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.accent})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success">Cor de Sucesso</Label>
                  <Input
                    id="success"
                    type="text"
                    placeholder="142 76% 36%"
                    value={colors.success}
                    onChange={(e) => setColors(prev => ({ ...prev, success: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.success})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warning">Cor de Aviso</Label>
                  <Input
                    id="warning"
                    type="text"
                    placeholder="38 92% 50%"
                    value={colors.warning}
                    onChange={(e) => setColors(prev => ({ ...prev, warning: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.warning})` }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destructive">Cor de Erro</Label>
                  <Input
                    id="destructive"
                    type="text"
                    placeholder="0 84% 60%"
                    value={colors.destructive}
                    onChange={(e) => setColors(prev => ({ ...prev, destructive: e.target.value }))}
                  />
                  <div className="h-10 rounded-md border" style={{ backgroundColor: `hsl(${colors.destructive})` }} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveColors} className="flex-1">
                  Salvar Cores
                </Button>
                <Button onClick={handleResetColors} variant="outline">
                  Restaurar Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchUsuarios}
        user={selectedUser}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
