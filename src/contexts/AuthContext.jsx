import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    const getSession = async () => {
      console.log("AuthContext: Tentando obter sessão inicial...");
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("AuthContext: Erro ao obter sessão inicial:", error);
      } else if (session) {
        console.log("AuthContext: Sessão inicial encontrada:", session);
        const userData = await getUserData(session.user.id);
        setUser(userData);
      } else {
        console.log("AuthContext: Nenhuma sessão inicial encontrada.");
      }
      setLoading(false);
      console.log("AuthContext: getSession finalizado, loading set to false.");
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const userData = await getUserData(session.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar dados adicionais do usuário:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro inesperado ao buscar dados adicionais do usuário:", error);
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Supabase signInWithPassword data:", data);
      console.log("Supabase signInWithPassword error:", error);

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userData = await getUserData(data.user.id);
        setUser(userData);
      }

      return { success: true };
    } catch (error) {
      console.error("Erro interno no login:", error);
      return { success: false, error: "Erro interno do servidor" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const register = async (email, password, nome, login, perfil = 'analista') => {
    try {
      setLoading(true);
      
      // Registrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Criar registro na tabela usuarios
      if (authData.user) {
        const { error: userError } = await supabase
          .from('usuarios')
          .insert([
            {
              id: authData.user.id,
              nome,
              login,
              email,
              perfil,
            },
          ]);

        if (userError) {
          return { success: false, error: userError.message };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

