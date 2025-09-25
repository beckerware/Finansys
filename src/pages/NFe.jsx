import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Eye, Download, Search, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const NFe = () => {
  const { user } = useAuth();
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novaNFe, setNovaNFe] = useState({
    cliente: '',
    cnpj: '',
    produtos: [{ descricao: '', quantidade: 1, valorUnitario: 0 }]
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchNotasFiscais();
    }
  }, [user]);

  const fetchNotasFiscais = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nfe')
        .select('*')
        .eq('id_usuario', user.id)
        .order('data_emissao', { ascending: false });

      if (error) {
        throw error;
      }
      setNotasFiscais(data || []);
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      setError('Erro ao carregar notas fiscais.');
    } finally {
      setLoading(false);
    }
  };

  const notasFiltradas = notasFiscais.filter(nota => {
    const matchStatus = filtroStatus === 'todos' || nota.status === filtroStatus;
    const matchBusca = nota.cliente.toLowerCase().includes(busca.toLowerCase()) ||
                      nota.numero.includes(busca) ||
                      nota.cnpj.includes(busca);
    return matchStatus && matchBusca;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'emitida': return 'default';
      case 'cancelada': return 'destructive';
      case 'pendente': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'emitida': return 'Emitida';
      case 'cancelada': return 'Cancelada';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  const adicionarProduto = () => {
    setNovaNFe({
      ...novaNFe,
      produtos: [...novaNFe.produtos, { descricao: '', quantidade: 1, valorUnitario: 0 }]
    });
  };

  const removerProduto = (index) => {
    const novosProdutos = novaNFe.produtos.filter((_, i) => i !== index);
    setNovaNFe({ ...novaNFe, produtos: novosProdutos });
  };

  const atualizarProduto = (index, campo, valor) => {
    const novosProdutos = [...novaNFe.produtos];
    novosProdutos[index] = { ...novosProdutos[index], [campo]: valor };
    setNovaNFe({ ...novaNFe, produtos: novosProdutos });
  };

  const calcularValorTotal = () => {
    return novaNFe.produtos.reduce((total, produto) => {
      return total + (produto.quantidade * produto.valorUnitario);
    }, 0);
  };

  const handleSubmitNFe = async (e) => {
    e.preventDefault();
    if (!novaNFe.cliente || !novaNFe.cnpj || novaNFe.produtos.length === 0) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Primeiro, criar um lançamento associado à NFe
      const { data: lancamentoData, error: lancamentoError } = await supabase
        .from('lancamentos')
        .insert([
          {
            data: new Date().toISOString().split('T')[0],
            valor: calcularValorTotal(),
            tipo: 'entrada', // NFe geralmente é uma entrada
            categoria: 'Vendas',
            descricao: `NFe ${novaNFe.cliente}`,
            id_usuario: user.id
          }
        ])
        .select();

      if (lancamentoError) {
        throw lancamentoError;
      }

      const id_lancamento = lancamentoData[0].id_lancamento;

      // Em seguida, inserir a NFe
      const { data, error } = await supabase
        .from('nfe')
        .insert([
          {
            numero: String(notasFiscais.length + 1).padStart(6, '0'), // Gerar número simples
            serie: '1',
            data_emissao: new Date().toISOString().split('T')[0],
            valor: calcularValorTotal(),
            xml: JSON.stringify(novaNFe.produtos), // Armazenar produtos como JSON no campo XML
            status: 'emitida',
            cliente: novaNFe.cliente,
            cnpj: novaNFe.cnpj,
            id_lancamento: id_lancamento,
            id_usuario: user.id
          }
        ])
        .select();

      if (error) {
        throw error;
      }

        setNotasFiscais([data[0], ...notasFiscais]);
      setNovaNFe({
        cliente: '',
        cnpj: '',
        produtos: [{ descricao: '', quantidade: 1, valorUnitario: 0 }]
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Erro ao emitir NFe:', error);
      setError('Erro ao emitir NFe.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelarNFe = async (id_nfe) => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('nfe')
        .update({ status: 'cancelada' })
        .eq('id_nfe', id_nfe);

      if (error) {
        throw error;
      }

      setNotasFiscais(notasFiscais.map(n => 
        n.id_nfe === id_nfe ? { ...n, status: 'cancelada' } : n
      ));
    } catch (error) {
      console.error('Erro ao cancelar NFe:', error);
      setError('Erro ao cancelar NFe.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando notas fiscais...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notas Fiscais Eletrônicas</h1>
        <Button onClick={() => setMostrarFormulario(!mostrarFormulario)} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Nova NFe
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notasFiscais.filter(n => n.status === 'emitida').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {notasFiscais.filter(n => n.status === 'emitida').reduce((sum, n) => sum + Number(n.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notasFiscais.filter(n => n.status === 'cancelada').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário para Nova NFe */}
      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Emitir Nova NFe
            </CardTitle>
            <CardDescription>Preencha os dados para emitir uma nova nota fiscal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNFe} className="space-y-6">
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}
              {/* Dados do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={novaNFe.cliente}
                    onChange={(e) => setNovaNFe({...novaNFe, cliente: e.target.value})}
                    placeholder="Nome do cliente"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={novaNFe.cnpj}
                    onChange={(e) => setNovaNFe({...novaNFe, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Produtos/Serviços */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Produtos/Serviços</Label>
                  <Button type="button" variant="outline" size="sm" onClick={adicionarProduto} disabled={submitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {novaNFe.produtos.map((produto, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="md:col-span-2">
                        <Label>Descrição</Label>
                        <Input
                          value={produto.descricao}
                          onChange={(e) => atualizarProduto(index, 'descricao', e.target.value)}
                          placeholder="Descrição do produto/serviço"
                          required
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={produto.quantidade}
                          onChange={(e) => atualizarProduto(index, 'quantidade', parseInt(e.target.value))}
                          required
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <Label>Valor Unitário</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={produto.valorUnitario}
                            onChange={(e) => atualizarProduto(index, 'valorUnitario', parseFloat(e.target.value))}
                            required
                            disabled={submitting}
                          />
                          {novaNFe.produtos.length > 1 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => removerProduto(index)} disabled={submitting}>
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right mt-4">
                  <p className="text-lg font-bold">
                    Valor Total: R$ {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Emitir NFe
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
              <Label htmlFor="busca-nfe">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca-nfe"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por cliente, número ou CNPJ..."
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filtro-status-nfe">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus} disabled={loading}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="emitida">Emitidas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de NFe */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais</CardTitle>
          <CardDescription>Lista de todas as notas fiscais emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiltradas.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhuma nota fiscal encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                notasFiltradas.map((nota) => (
                  <TableRow key={nota.id_nfe}>
                    <TableCell className="font-medium">{nota.numero}</TableCell>
                    <TableCell>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{nota.cliente}</TableCell>
                    <TableCell>{nota.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(nota.status)}>
                        {getStatusLabel(nota.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {Number(nota.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" disabled={submitting}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={submitting}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {nota.status === 'emitida' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCancelarNFe(nota.id_nfe)}
                            disabled={submitting}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancelar
                          </Button>
                        )}
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

export default NFe;


