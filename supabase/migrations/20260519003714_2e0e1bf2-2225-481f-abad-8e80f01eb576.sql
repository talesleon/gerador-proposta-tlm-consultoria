
-- Fix search_path em set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoga EXECUTE público nas funções SECURITY DEFINER que só devem ser chamadas internamente (triggers)
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;

-- has_role é chamada por policies; mantém apenas para authenticated
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
