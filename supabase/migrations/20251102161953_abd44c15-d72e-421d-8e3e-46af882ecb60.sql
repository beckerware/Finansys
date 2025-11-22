-- Adicionar política RLS para permitir que administradores deletem usuários
CREATE POLICY "Admins can delete usuarios"
ON public.usuario
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
