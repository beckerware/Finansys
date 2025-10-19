import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DividaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  divida?: {
    id_divida: number;
    descricao: string;
    valor_total: number;
    data_vencimento: string;
    status: string;
  } | null;
}

export function DividaDialog({ open, onOpenChange, onSuccess, divida }: DividaDialogProps) {
  const [descricao, setDescricao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [dataVencimento, setDataVencimento] = useState<Date>();
  const [status, setStatus] = useState("pendente");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (divida) {
      setDescricao(divida.descricao || "");
      setValorTotal(divida.valor_total?.toString() || "");
      setDataVencimento(divida.data_vencimento ? new Date(divida.data_vencimento) : undefined);
      setStatus(divida.status || "pendente");
    } else {
      setDescricao("");
      setValorTotal("");
      setDataVencimento(undefined);
      setStatus("pendente");
    }
  }, [divida, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 Limpeza de espaços antes de validar/enviar
    const descricaoLimpa = descricao.trim();

    if (!descricaoLimpa || !valorTotal || !dataVencimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios corretamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const dividaData = {
        descricao: descricaoLimpa, // valor limpo
        valor_total: parseFloat(valorTotal),
        data_vencimento: format(dataVencimento, "yyyy-MM-dd"),
        status,
        id_usuario: 1, // TODO: usar o ID do usuário logado
      };

      if (divida) {
        const { error } = await supabase
          .from('divida')
          .update(dividaData)
          .eq('id_divida', divida.id_divida);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Dívida atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('divida')
          .insert([dividaData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Dívida cadastrada com sucesso",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a dívida",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{divida ? "Editar Dívida" : "Nova Dívida"}</DialogTitle>
          <DialogDescription>
            {divida ? "Atualize as informações da dívida" : "Cadastre uma nova obrigação financeira"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 🔹 Campo com limpeza automática de espaços à esquerda */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.trimStart())}
                placeholder="Ex: Empréstimo bancário, Fatura cartão, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor Total *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataVencimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVencimento ? format(dataVencimento, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVencimento}
                    onSelect={setDataVencimento}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : divida ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
