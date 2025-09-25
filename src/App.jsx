import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EntradasSaidas from './pages/EntradasSaidas';
import NFe from './pages/NFe';
import Lancamentos from './pages/Lancamentos';
import './App.css';

// Componente para redirecionar usuários autenticados
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Rota pública - Login */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Rotas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/entradas-saidas" 
          element={
            <ProtectedRoute>
              <Layout>
                <EntradasSaidas />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/nfe" 
          element={
            <ProtectedRoute>
              <Layout>
                <NFe />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lancamentos" 
          element={
            <ProtectedRoute>
              <Layout>
                <Lancamentos />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Rota raiz - redireciona para dashboard se autenticado, senão para login */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        
        {/* Rota 404 - redireciona para dashboard */}
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


