DROP FUNCTION IF EXISTS dash_get_crawls_data();

CREATE OR REPLACE FUNCTION dash_get_crawls_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    result_data json;
BEGIN
    WITH crawls_with_users AS (
        SELECT 
            c.id,
            c.name,
            c.start_location_text as "startLocation",
            c.user_id as "userId",
            p.username as "userName",
            p.avatar_id as "userAvatarId",
            c.created_at as "createdAt",
            (SELECT count(*) FROM pub_crawl_stops s WHERE s.crawl_id = c.id) as "stopsCount"
        FROM pub_crawls c
        LEFT JOIN profiles p ON c.user_id = p.id
        ORDER BY c.created_at DESC
    ),
    crawls_with_stops AS (
        SELECT 
            c.*,
            (
                SELECT json_agg(stops_data)
                FROM (
                    SELECT 
                        s.id,
                        s.crawl_id as "crawlId",
                        s.pub_id as "pubId",
                        pb.name as "pubName",
                        s.stop_order as "stopOrder"
                    FROM pub_crawl_stops s
                    LEFT JOIN pubs pb ON s.pub_id = pb.id
                    WHERE s.crawl_id = c.id
                    ORDER BY s.stop_order ASC
                ) stops_data
            ) as stops
        FROM crawls_with_users c
    )
    SELECT json_build_object(
        'allCrawls', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM crawls_with_stops) t)
    ) INTO result_data;

    RETURN result_data;
END;
$$;
