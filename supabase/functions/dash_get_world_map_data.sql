-- Create an RPC to fetch all rated pubs for the world map
CREATE OR REPLACE FUNCTION dash_get_world_map_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    result_data json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'name', p.name,
            'lat', p.lat,
            'lng', p.lng,
            'area_identifier', p.area_identifier,
            'country_code', p.country_code,
            'ratings_count', (SELECT COUNT(*) FROM ratings r WHERE r.pub_id = p.id),
            'avg_score', (SELECT AVG(r.quality) FROM ratings r WHERE r.pub_id = p.id AND r.quality IS NOT NULL),
            'min_price', (SELECT MIN(NULLIF(r.exact_price, 0)) FROM ratings r WHERE r.pub_id = p.id AND r.exact_price IS NOT NULL),
            'max_price', (SELECT MAX(NULLIF(r.exact_price, 0)) FROM ratings r WHERE r.pub_id = p.id AND r.exact_price IS NOT NULL)
        )
    )
    INTO result_data
    FROM pubs p
    WHERE EXISTS (SELECT 1 FROM ratings r WHERE r.pub_id = p.id);

    RETURN result_data;
END;
$$;
