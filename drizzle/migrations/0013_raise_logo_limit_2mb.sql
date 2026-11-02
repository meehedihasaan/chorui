CREATE OR REPLACE FUNCTION public.admin_update_settings(p_app_name text, p_logo_url text, p_brand_color text, p_button_style text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  IF length(trim(coalesce(p_app_name,''))) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'App name must be 1-40 characters'; END IF;
  IF p_brand_color IS NOT NULL AND p_brand_color !~ '^#[0-9a-fA-F]{6}$' THEN RAISE EXCEPTION 'Invalid colour'; END IF;
  IF p_button_style NOT IN ('pill','rounded','square') THEN RAISE EXCEPTION 'Invalid button style'; END IF;
  IF p_logo_url IS NOT NULL AND (length(p_logo_url) > 2800000 OR p_logo_url !~ '^(data:image/(png|jpeg|webp|gif|svg\+xml);base64,|https://)') THEN RAISE EXCEPTION 'Invalid logo'; END IF;
  UPDATE app_settings SET app_name = trim(p_app_name), logo_url = p_logo_url, brand_color = p_brand_color,
    button_style = p_button_style, updated_at = now() WHERE id = 1;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_settings(text,text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_settings(text,text,text,text) TO authenticated;