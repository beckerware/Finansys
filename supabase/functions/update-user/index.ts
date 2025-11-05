import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId, nome, login, email, perfil, newPassword } = await req.json();

    if (!userId || !nome || !login || !email || !perfil) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: userId, nome, login, email, perfil' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Atualizar dados na tabela usuario
    const { error: updateUsuarioError } = await supabaseAdmin
      .from('usuario')
      .update({
        nome,
        login,
        email,
        perfil,
        updated_at: new Date().toISOString()
      })
      .eq('id_usuario', userId);

    if (updateUsuarioError) {
      console.error('Erro ao atualizar usuario:', updateUsuarioError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar dados do usuário' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buscar auth_id do usuário
    const { data: usuarioData, error: fetchError } = await supabaseAdmin
      .from('usuario')
      .select('auth_id')
      .eq('id_usuario', userId)
      .single();

    if (fetchError || !usuarioData?.auth_id) {
      console.error('Erro ao buscar auth_id:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado ou sem auth_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Atualizar email no auth.users
    const { error: updateAuthEmailError } = await supabaseAdmin.auth.admin.updateUserById(
      usuarioData.auth_id,
      { email }
    );

    if (updateAuthEmailError) {
      console.error('Erro ao atualizar email no auth:', updateAuthEmailError);
    }

    // Se fornecida nova senha, atualizar no auth
    if (newPassword && newPassword.trim() !== '') {
      const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
        usuarioData.auth_id,
        { password: newPassword }
      );

      if (updatePasswordError) {
        console.error('Erro ao atualizar senha:', updatePasswordError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar senha do usuário' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
