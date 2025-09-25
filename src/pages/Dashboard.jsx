import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const { user } = useAuth();
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos baseados nos dados do Supabase
  const calcularTotais = () => {
    const entradas = lancamentos
      .filter(l => l.tipo === 'entrada')
      .reduce((sum, l) => sum + Number(l.valor), 0);
    
    const saidas = lancamentos
      .filter(l => l.tipo === 'saida')
      .reduce((sum, l) => sum + Number(l.valor), 0);
    
    return {
      entradas,
      saidas,
      saldo: entradas - saidas
    };
  };

  const gerarDadosGrafico = () => {
    const meses = ["Jan", "Fev", "Mar", "Abr"]; // Exemplo de meses
    const dadosPorMes = meses.map(mes => {
      const entradasMes = lancamentos
        .filter(l => new Date(l.data).getMonth() === meses.indexOf(mes) && l.tipo === 'entrada')
        .reduce((sum, l) => sum + Number(l.valor), 0);
      const saidasMes = lancamentos
        .filter(l => new Date(l.data).getMonth() === meses.indexOf(mes) && l.tipo === 'saida')
        .reduce((sum, l) => sum + Number(l.valor), 0);
      return {
        mes,
        entradas: entradasMes,
        saidas: saidasMes
      };
    });
    return dadosPorMes;
  };

  const gerarDadosPizza = () => {
    const categorias = {};
    lancamentos
      .filter(l => l.tipo === 'entrada')
      .forEach(l => {
        categorias[l.categoria] = (categorias[l.categoria] || 0) + Number(l.valor);
      });

    const total = Object.values(categorias).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(categorias).map(([categoria, valor]) => ({
      name: categoria,
      value: Math.round((valor / total) * 100) || 0
    }));
  };

  const { entradas, saidas, saldo } = calcularTotais();
  const dadosGrafico = gerarDadosGrafico();
  const dadosPizza = gerarDadosPizza();

  const CORES_PIZZA = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchLancamentos}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral das finanças</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Receitas vs Despesas
            </CardTitle>
            <CardDescription>Comparativo mensal dos últimos 4 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Bar dataKey="entradas" fill="#10b981" name="Receitas" />
                <Bar dataKey="saidas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição de Receitas
            </CardTitle>
            <CardDescription>Por categoria de negócio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lancamentos.slice(0, 5).map((lancamento) => (
              <div key={lancamento.id_lancamento} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    lancamento.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {lancamento.tipo === 'entrada' ? (
                      <ArrowUpRight className={`h-4 w-4 ${
                        lancamento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    ) : (
                      <ArrowDownRight className={`h-4 w-4 ${
                        lancamento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{lancamento.descricao}</p>
                    <p className="text-sm text-gray-500">{new Date(lancamento.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    lancamento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lancamento.tipo === 'entrada' ? '+' : '-'}R$ {Number(lancamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {lancamento.categoria}
                  </Badge>
                </div>
              </div>
            ))}
            
            {lancamentos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma transação encontrada.</p>
                <p className="text-sm">Adicione lançamentos para ver o resumo aqui.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

