-- Add admin role to admin@finansys.com user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@finansys.com'
ON CONFLICT (user_id, role) DO NOTHING;