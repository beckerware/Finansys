import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen, Search, Filter, Edit, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Lancamentos = () => {
  const { user } = useAuth();
  const [lancamentos, setLancamentos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busca, setBusca] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novoLancamento, setNovoLancamento] = useState({
    data: '',
    descricao: '',
    conta: '',
    tipoLancamento: '',
    categoria: '',
    valor: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const contas = [
    'Caixa',
    'Banco',
    'Contas a Receber',
    'Contas a Pagar',
    'Fornecedores',
    'Clientes',
    'Receita de Vendas',
    'Receita de Serviços',
    'Despesas Operativas',
    'Despesas Administrativas',
    'Estoque',
    'Imobilizado'
  ];

  const categorias = [
    'Receitas',
    'Despesas',
    'Ativos',
    'Passivos',
    'Patrimônio Líquido'
  ];

  useEffect(() => {
    if (user) {
      fetchLancamentos();
    }
  }, [user]);

  const fetchLancamentos = async () => {
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
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      setError('Erro ao carregar lançamentos.');
    } finally {
      setLoading(false);
    }
  };

  const lancamentosFiltrados = lancamentos.filter(lancamento => {
    const matchTipo = filtroTipo === 'todos' || lancamento.tipo === filtroTipo;
    const matchCategoria = filtroCategoria === 'todas' || lancamento.categoria === filtroCategoria;
    const matchBusca = lancamento.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                      lancamento.conta.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchCategoria && matchBusca;
  });

  const totalDebitos = lancamentosFiltrados
    .filter(l => l.tipo === 'saida')
    .reduce((sum, l) => sum + Number(l.valor), 0);

  const totalCreditos = lancamentosFiltrados
    .filter(l => l.tipo === 'entrada')
    .reduce((sum, l) => sum + Number(l.valor), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novoLancamento.data || !novoLancamento.descricao || !novoLancamento.conta || 
        !novoLancamento.tipoLancamento || !novoLancamento.categoria || !novoLancamento.valor) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const { data, error } = await supabase
        .from('lancamentos')
        .insert([
          {
            data: novoLancamento.data,
            descricao: novoLancamento.descricao,
            conta: novoLancamento.conta,
            tipo: novoLancamento.tipoLancamento,
            categoria: novoLancamento.categoria,
            valor: parseFloat(novoLancamento.valor),
            observacoes: novoLancamento.observacoes,
            id_usuario: user.id
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      setLancamentos([data[0], ...lancamentos]);
      setNovoLancamento({
        data: '',
        descricao: '',
        conta: '',
        tipoLancamento: '',
        categoria: '',
        valor: '',
        observacoes: ''
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Erro ao adicionar lançamento:', error);
      setError('Erro ao adicionar lançamento.');
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
      setLancamentos(lancamentos.filter(l => l.id_lancamento !== id));
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      setError('Erro ao deletar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    return tipo === 'saida' ? 'destructive' : 'default';
  };

  const getTipoLabel = (tipo) => {
    return tipo === 'saida' ? 'Saída' : 'Entrada';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando lançamentos...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lançamentos Contábeis</h1>
        <Button onClick={() => setMostrarFormulario(!mostrarFormulario)} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDebitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalCreditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalCreditos - totalDebitos) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(totalCreditos - totalDebitos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {(totalCreditos - totalDebitos) >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário para Novo Lançamento */}
      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Novo Lançamento Contábil
            </CardTitle>
            <CardDescription>Registre um novo lançamento no sistema contábil</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data-lancamento">Data</Label>
                  <Input
                    id="data-lancamento"
                    type="date"
                    value={novoLancamento.data}
                    onChange={(e) => setNovoLancamento({...novoLancamento, data: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="valor-lancamento">Valor</Label>
                  <Input
                    id="valor-lancamento"
                    type="number"
                    step="0.01"
                    value={novoLancamento.valor}
                    onChange={(e) => setNovoLancamento({...novoLancamento, valor: e.target.value})}
                    placeholder="0,00"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao-lancamento">Descrição</Label>
                <Input
                  id="descricao-lancamento"
                  value={novoLancamento.descricao}
                  onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})}
                  placeholder="Descrição do lançamento"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="conta-lancamento">Conta</Label>
                  <Select 
                    value={novoLancamento.conta}
                    onValueChange={(value) => setNovoLancamento({...novoLancamento, conta: value})}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map(conta => (
                        <SelectItem key={conta} value={conta}>{conta}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo-lancamento">Tipo</Label>
                  <Select 
                    value={novoLancamento.tipoLancamento}
                    onValueChange={(value) => setNovoLancamento({...novoLancamento, tipoLancamento: value})}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Débito ou Crédito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria-lancamento">Categoria</Label>
                  <Select 
                    value={novoLancamento.categoria}
                    onValueChange={(value) => setNovoLancamento({...novoLancamento, categoria: value})}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(categoria => (
                        <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes-lancamento">Observações</Label>
                <Textarea
                  id="observacoes-lancamento"
                  value={novoLancamento.observacoes}
                  onChange={(e) => setNovoLancamento({...novoLancamento, observacoes: e.target.value})}
                  placeholder="Observações adicionais (opcional)"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="h-4 w-4 mr-2" />
                  )}
                  Registrar Lançamento
                </Button>
                <Button type="button" variant="outline" onClick={() => setMostrarFormulario(false)} disabled={submitting}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              <Label htmlFor="busca-lancamento">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca-lancamento"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por descrição ou conta..."
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filtro-tipo-lancamento">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo} disabled={loading}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-categoria-lancamento">Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria} disabled={loading}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Contábeis</CardTitle>
          <CardDescription>Registro de todos os lançamentos contábeis</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentosFiltrados.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                lancamentosFiltrados.map((lancamento) => (
                  <TableRow key={lancamento.id_lancamento}>
                    <TableCell>{new Date(lancamento.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                    <TableCell>{lancamento.conta}</TableCell>
                    <TableCell>{lancamento.categoria}</TableCell>
                    <TableCell>
                      <Badge variant={getTipoColor(lancamento.tipo)}>
                        {getTipoLabel(lancamento.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {Number(lancamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" disabled={submitting}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(lancamento.id_lancamento)} disabled={submitting}>
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

export default Lancamentos;


