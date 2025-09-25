import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const EntradasSaidas = () => {
  const { user } = useAuth();
  const [transacoes, setTransacoes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [novaTransacao, setNovaTransacao] = useState({
    descricao: '',
    valor: '',
    tipo: '',
    categoria: '',
    data: ''
  });
  const [editandoTransacao, setEditandoTransacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const categorias = {
    entrada: ['Vendas', 'Serviços', 'Investimentos', 'Outros'],
    saida: ['Fornecedores', 'Despesas Fixas', 'Marketing', 'Pessoal', 'Outros']
  };

  useEffect(() => {
    if (user) {
      fetchTransacoes();
    }
  }, [user]);

  const fetchTransacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('id_usuario', user.id)
        .order('data', { ascending: false });

      if (error) {
        throw error;
      }
      setTransacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setError('Erro ao carregar transações.');
    } finally {
      setLoading(false);
    }
  };

  const transacoesFiltradas = transacoes.filter(transacao => {
    const matchTipo = filtroTipo === 'todos' || transacao.tipo === filtroTipo;
    const matchBusca = transacao.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                      transacao.categoria.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchBusca;
  });

  const totalEntradas = transacoesFiltradas
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const totalSaidas = transacoesFiltradas
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const saldoTotal = totalEntradas - totalSaidas;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.tipo || !novaTransacao.categoria || !novaTransacao.data) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const { data, error } = await supabase
        .from('lancamentos')
        .insert([
          {
            descricao: novaTransacao.descricao,
            valor: parseFloat(novaTransacao.valor),
            tipo: novaTransacao.tipo,
            categoria: novaTransacao.categoria,
            data: novaTransacao.data,
            id_usuario: user.id
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      setTransacoes([data[0], ...transacoes]);
      setNovaTransacao({
        descricao: '',
        valor: '',
        tipo: '',
        categoria: '',
        data: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      setError('Erro ao adicionar transação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id_lancamento', id);

      if (error) {
        throw error;
      }
      setTransacoes(transacoes.filter(t => t.id_lancamento !== id));
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      setError('Erro ao deletar transação.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transacao) => {
    setEditandoTransacao(transacao);
    setNovaTransacao({
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      data: transacao.data
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.tipo || !novaTransacao.categoria || !novaTransacao.data) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const { data, error } = await supabase
        .from('lancamentos')
        .update({
          descricao: novaTransacao.descricao,
          valor: parseFloat(novaTransacao.valor),
          tipo: novaTransacao.tipo,
          categoria: novaTransacao.categoria,
          data: novaTransacao.data
        })
        .eq('id_lancamento', editandoTransacao.id_lancamento)
        .select();

      if (error) {
        throw error;
      }

      setTransacoes(transacoes.map(t => 
        t.id_lancamento === editandoTransacao.id_lancamento ? data[0] : t
      ));
      setEditandoTransacao(null);
      setNovaTransacao({
        descricao: '',
        valor: '',
        tipo: '',
        categoria: '',
        data: ''
      });
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      setError('Erro ao atualizar transação.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelarEdicao = () => {
    setEditandoTransacao(null);
    setNovaTransacao({
      descricao: '',
      valor: '',
      tipo: '',
      categoria: '',
      data: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando transações...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Entradas e Saídas</h1>
        <p className="text-muted-foreground">Gestão de transações financeiras</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário para Nova Transação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editandoTransacao ? 'Editar Transação' : 'Nova Transação'}
          </CardTitle>
          <CardDescription>
            {editandoTransacao ? 'Edite os dados da transação' : 'Adicione uma nova entrada ou saída'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={editandoTransacao ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={novaTransacao.descricao}
                onChange={(e) => setNovaTransacao({...novaTransacao, descricao: e.target.value})}
                placeholder="Descrição da transação"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={novaTransacao.valor}
                onChange={(e) => setNovaTransacao({...novaTransacao, valor: e.target.value})}
                placeholder="0,00"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select 
                value={novaTransacao.tipo}
                onValueChange={(value) => setNovaTransacao({...novaTransacao, tipo: value, categoria: ''})}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={novaTransacao.categoria}
                onValueChange={(value) => setNovaTransacao({...novaTransacao, categoria: value})}
                disabled={!novaTransacao.tipo || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {novaTransacao.tipo && categorias[novaTransacao.tipo]?.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={novaTransacao.data}
                onChange={(e) => setNovaTransacao({...novaTransacao, data: e.target.value})}
                required
                disabled={submitting}
              />
            </div>

            <div className="md:col-span-5 flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editandoTransacao ? 'Atualizar Transação' : 'Adicionar Transação'}
              </Button>
              {editandoTransacao && (
                <Button type="button" variant="outline" onClick={cancelarEdicao} disabled={submitting}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="busca">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por descrição ou categoria..."
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filtro-tipo">Filtrar por Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo} disabled={loading}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>Lista de todas as transações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoesFiltradas.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                transacoesFiltradas.map((transacao) => (
                  <TableRow key={transacao.id_lancamento}>
                    <TableCell>{new Date(transacao.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{transacao.descricao}</TableCell>
                    <TableCell>{transacao.categoria}</TableCell>
                    <TableCell>
                      <Badge variant={transacao.tipo === 'entrada' ? 'default' : 'destructive'}>
                        {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(transacao)} disabled={submitting}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(transacao.id_lancamento)} disabled={submitting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntradasSaidas;


