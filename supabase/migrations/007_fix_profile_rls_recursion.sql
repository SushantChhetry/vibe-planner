-- profile_owned_by_jwt was SECURITY INVOKER, so reads on profiles inside the function
-- still applied RLS on profiles — whose policies call this function → infinite recursion
-- ("stack depth limit exceeded"). Run as definer with row_security disabled for the lookup only.

CREATE OR REPLACE FUNCTION public.profile_owned_by_jwt(profile_pk uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = profile_pk
      AND p.clerk_user_id IS NOT NULL
      AND (SELECT auth.jwt()->>'sub') = p.clerk_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.profile_owned_by_jwt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_owned_by_jwt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.profile_owned_by_jwt(uuid) TO service_role;
