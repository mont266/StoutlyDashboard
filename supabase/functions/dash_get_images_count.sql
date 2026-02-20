CREATE OR REPLACE FUNCTION dash_get_images_count()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM ratings WHERE image_url IS NOT NULL);
END;
$$;
