import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, AlertTriangle, Calendar, Filter, CheckCircle2, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DividaDialog } from "@/components/dividas/DividaDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Divida {
  id_divida: number;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  status: string;
}

export default function Dividas() {
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [filteredDividas, setFilteredDividas] = useState<Divida[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dividaToDelete, setDividaToDelete] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDividas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [dividas, filterStatus]);

  const applyFilters = () => {
    let filtered = [...dividas];
    const hoje = new Date().toISOString().split('T')[0];

    if (filterStatus === "paga") {
      filtered = filtered.filter(d => d.status === 'paga');
    } else if (filterStatus === "pendente") {
      filtered = filtered.filter(d => d.status !== 'paga' && d.data_vencimento >= hoje);
    } else if (filterStatus === "vencida") {
      filtered = filtered.filter(d => d.status !== 'paga' && d.data_vencimento < hoje);
    }

    setFilteredDividas(filtered);
  };

  const fetchDividas = async () => {
    try {
      const { data, error } = await supabase
        .from('divida')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      setDividas(data || []);
      setFilteredDividas(data || []);
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as dívidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, dataVencimento: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (status === 'paga') return 'bg-success text-success-foreground';
    if (dataVencimento < hoje) return 'bg-destructive text-destructive-foreground';
    return 'bg-warning text-warning-foreground';
  };

  const getStatusText = (status: string, dataVencimento: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (status === 'paga') return 'Paga';
    if (dataVencimento < hoje) return 'Vencida';
    return 'Pendente';
  };

  const handleEdit = (divida: Divida) => {
    setSelectedDivida(divida);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!dividaToDelete) return;

    try {
      const { error } = await supabase
        .from('divida')
        .delete()
        .eq('id_divida', dividaToDelete);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dívida excluída com sucesso",
      });

      fetchDividas();
    } catch (error) {
      console.error('Erro ao excluir dívida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a dívida",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDividaToDelete(null);
    }
  };

  const handleMarcarPaga = async (dividaId: number) => {
    try {
      const { error } = await supabase
        .from('divida')
        .update({ status: 'paga' })
        .eq('id_divida', dividaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dívida marcada como paga",
      });

      fetchDividas();
    } catch (error) {
      console.error('Erro ao atualizar dívida:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a dívida",
        variant: "destructive",
      });
    }
  };

  const dividasPendentes = dividas.filter(d => d.status !== 'paga');
  const dividasVencidas = dividas.filter(d => {
    const hoje = new Date().toISOString().split('T')[0];
    return d.data_vencimento < hoje && d.status !== 'paga';
  });
  const totalDividas = dividas.reduce((sum, d) => sum + Number(d.valor_total || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dívidas</h1>
            <p className="text-muted-foreground">Controle suas obrigações financeiras</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dívidas</h1>
          <p className="text-muted-foreground">
            Controle suas obrigações financeiras
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label>Filtrar:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
                <SelectItem value="paga">Pagas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="bg-gradient-primary"
            onClick={() => {
              setSelectedDivida(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Dívida
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totalDividas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dividas.length} dívida(s) registrada(s)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {dividasPendentes.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(dividasPendentes.reduce((sum, d) => sum + Number(d.valor_total || 0), 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {dividasVencidas.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(dividasVencidas.reduce((sum, d) => sum + Number(d.valor_total || 0), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dívidas List */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>Lista de Dívidas</CardTitle>
          <CardDescription>
            Todas as suas obrigações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDividas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {dividas.length === 0 ? "Nenhuma dívida encontrada" : "Nenhuma dívida encontrada com os filtros aplicados"}
                </p>
                {dividas.length === 0 && (
                  <Button 
                    className="bg-gradient-primary"
                    onClick={() => {
                      setSelectedDivida(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primeira Dívida
                  </Button>
                )}
              </div>
            ) : (
              filteredDividas.map((divida) => (
                <div
                  key={divida.id_divida}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      divida.status === 'paga' ? 'bg-success' : 
                      new Date(divida.data_vencimento) < new Date() ? 'bg-destructive' : 'bg-warning'
                    }`} />
                    <div>
                      <div className="font-medium">{divida.descricao || 'Sem descrição'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Vencimento: {new Date(divida.data_vencimento).toLocaleDateString('pt-BR')}</span>
                        {new Date(divida.data_vencimento) < new Date() && divida.status !== 'paga' && (
                          <>
                            <span>•</span>
                            <span className="text-destructive font-medium">VENCIDA</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(Number(divida.valor_total))}
                      </div>
                    </div>
                    <Badge className={getStatusColor(divida.status, divida.data_vencimento)}>
                      {getStatusText(divida.status, divida.data_vencimento)}
                    </Badge>
                    <div className="flex gap-1">
                      {divida.status !== 'paga' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarcarPaga(divida.id_divida)}
                          title="Marcar como paga"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(divida)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDividaToDelete(divida.id_divida);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setHelpDialogOpen(true)}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <DividaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchDividas}
        divida={selectedDivida}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajuda - Ações Disponíveis</DialogTitle>
            <DialogDescription>
              Entenda as ações disponíveis e seus riscos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-l-4 border-success pl-4">
              <h4 className="font-semibold mb-2">✓ Marcar como Paga</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Marca a dívida como paga, alterando seu status e removendo-a da lista de pendências.
              </p>
              <p className="text-sm font-medium">
                Risco: <span className="text-warning">Baixo - pode ser revertido editando a dívida</span>
              </p>
              <div className="mt-2 p-2 bg-success/10 rounded-md">
                <p className="text-xs text-success">
                  💡 Esta ação atualiza os totais e estatísticas, mas pode ser desfeita editando a dívida.
                </p>
              </div>
            </div>

            <div className="border-l-4 border-warning pl-4">
              <h4 className="font-semibold mb-2">✏️ Editar</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Permite modificar as informações da dívida como descrição, valor, data de vencimento e status.
              </p>
              <p className="text-sm font-medium">
                Risco: <span className="text-warning">Médio - pode afetar relatórios e totais</span>
              </p>
              <div className="mt-2 p-2 bg-warning/10 rounded-md">
                <p className="text-xs text-warning">
                  ⚠️ ATENÇÃO: Alterações nos valores e datas podem impactar seus relatórios financeiros e cálculos de total de dívidas.
                </p>
              </div>
            </div>

            <div className="border-l-4 border-destructive pl-4">
              <h4 className="font-semibold mb-2">🗑️ Excluir</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Remove permanentemente a dívida do sistema.
              </p>
              <p className="text-sm font-medium">
                Risco: <span className="text-destructive">Alto - esta ação é irreversível!</span>
              </p>
              <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                <p className="text-xs text-destructive">
                  ⚠️ ATENÇÃO: Ao excluir uma dívida, todos os dados serão perdidos permanentemente e não será possível recuperá-los.
                </p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">💡 Dicas Importantes</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>Sempre revise os dados antes de editar ou excluir uma dívida</li>
                <li>Mantenha backups regulares dos seus dados financeiros</li>
                <li>Use os filtros para encontrar dívidas específicas mais facilmente</li>
                <li>Verifique os totais após marcar dívidas como pagas</li>
                <li>Em caso de dúvida, consulte os relatórios antes de fazer alterações</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHelpDialogOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}