DROP FUNCTION IF EXISTS dash_get_home_data(text);

CREATE OR REPLACE FUNCTION dash_get_home_data(time_period text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    start_date timestamp;
    prev_start_date timestamp;
    end_date timestamp := now();
    kpis_data json;
    charts_data json;
    tables_data json;
    result_data json;
BEGIN
    -- Determine time range
    IF time_period = '24h' THEN
        start_date := end_date - interval '24 hours';
        prev_start_date := start_date - interval '24 hours';
    ELSIF time_period = '7d' THEN
        start_date := end_date - interval '7 days';
        prev_start_date := start_date - interval '7 days';
    ELSIF time_period = '30d' THEN
        start_date := end_date - interval '30 days';
        prev_start_date := start_date - interval '30 days';
    ELSIF time_period = '90d' THEN
        start_date := end_date - interval '90 days';
        prev_start_date := start_date - interval '90 days';
    ELSIF time_period = '12m' THEN
        start_date := end_date - interval '12 months';
        prev_start_date := start_date - interval '12 months';
    ELSE -- 'All' or default
        start_date := '1970-01-01'; -- effectively all time
        prev_start_date := '1970-01-01';
    END IF;

    -- KPIs
    WITH current_period AS (
        SELECT
            count(*) filter (where created_at >= start_date) as new_users,
            count(*) filter (where last_sign_in_at >= start_date) as active_users
        FROM auth.users
    ),
    previous_period AS (
        SELECT
            count(*) filter (where created_at >= prev_start_date AND created_at < start_date) as new_users,
            count(*) filter (where last_sign_in_at >= prev_start_date AND last_sign_in_at < start_date) as active_users
        FROM auth.users
    ),
    ratings_stats AS (
        SELECT
            count(*) as total_ratings,
            count(*) filter (where created_at >= start_date) as new_ratings,
            count(*) filter (where created_at >= prev_start_date AND created_at < start_date) as prev_new_ratings,
            count(*) filter (where image_url is not null) as total_images
        FROM ratings
    ),
    pubs_stats AS (
        SELECT count(*) as total_pubs FROM pubs
    ),
    comments_stats AS (
        SELECT count(*) as total_comments FROM comments
    ),
    pub_crawls_stats AS (
        SELECT count(*) as total_pub_crawls FROM pub_crawls
    )
    SELECT json_build_object(
        'totalUsers', (SELECT count(*) FROM auth.users),
        'newUsers', (SELECT new_users FROM current_period),
        'newUsersChange', (SELECT new_users FROM current_period) - (SELECT new_users FROM previous_period),
        'activeUsers', (SELECT active_users FROM current_period),
        'activeUsersChange', (SELECT active_users FROM current_period) - (SELECT active_users FROM previous_period),
        'totalRatings', (SELECT total_ratings FROM ratings_stats),
        'newRatings', (SELECT new_ratings FROM ratings_stats),
        'newRatingsChange', (SELECT new_ratings FROM ratings_stats) - (SELECT prev_new_ratings FROM ratings_stats),
        'totalPubs', (SELECT total_pubs FROM pubs_stats),
        'totalUploadedImages', (SELECT total_images FROM ratings_stats),
        'totalComments', (SELECT total_comments FROM comments_stats),
        'totalPubCrawls', (SELECT total_pub_crawls FROM pub_crawls_stats)
    ) INTO kpis_data;

    -- Charts
    WITH users_over_time AS (
        SELECT date_trunc('day', created_at) as date, count(*) as value
        FROM auth.users
        WHERE created_at >= start_date
        GROUP BY 1
        ORDER BY 1
    ),
    ratings_over_time AS (
        SELECT date_trunc('day', created_at) as date, count(*) as value
        FROM ratings
        WHERE created_at >= start_date
        GROUP BY 1
        ORDER BY 1
    )
    SELECT json_build_object(
        'newUsersOverTime', (SELECT json_agg(row_to_json(t)) FROM users_over_time t),
        'newRatingsOverTime', (SELECT json_agg(row_to_json(t)) FROM ratings_over_time t)
    ) INTO charts_data;

    -- Tables (Avg Pint Price by Country)
    WITH base_stats AS (
        SELECT
            p.country_code,
            MAX(p.country_name) as db_name,
            COUNT(p.id) AS pubs_count,
            COUNT(r.id) AS ratings_count,
            SUM(r.price) FILTER (WHERE r.price IS NOT NULL AND r.price > 0) AS total_price,
            COUNT(r.price) FILTER (WHERE r.price IS NOT NULL AND r.price > 0) AS price_count
        FROM
            pubs p
        LEFT JOIN
            ratings r ON p.id = r.pub_id
        WHERE
            p.country_code IS NOT NULL
        GROUP BY
            p.country_code
    ),
    normalized_stats AS (
        SELECT
            COALESCE(
                db_name, 
                CASE UPPER(country_code)
                    WHEN 'GB' THEN 'United Kingdom'
                    WHEN 'UK' THEN 'United Kingdom'
                    WHEN 'US' THEN 'United States'
                    WHEN 'IE' THEN 'Ireland'
                    WHEN 'ES' THEN 'Spain'
                    WHEN 'FR' THEN 'France'
                    WHEN 'DE' THEN 'Germany'
                    WHEN 'IT' THEN 'Italy'
                    WHEN 'AU' THEN 'Australia'
                    WHEN 'NZ' THEN 'New Zealand'
                    WHEN 'CA' THEN 'Canada'
                    WHEN 'CZ' THEN 'Czech Republic'
                    ELSE country_code
                END
            ) AS final_name,
            CASE UPPER(country_code) WHEN 'UK' THEN 'GB' ELSE country_code END as normalized_code,
            pubs_count,
            ratings_count,
            total_price,
            price_count
        FROM base_stats
    )
    SELECT json_build_object(
        'avgPintPriceByCountry', (
            SELECT json_agg(t)
            FROM (
                SELECT
                    ns.final_name as country,
                    CASE WHEN SUM(ns.price_count) > 0 THEN SUM(ns.total_price) / SUM(ns.price_count) ELSE 0 END as price,
                    SUM(ns.pubs_count) as "pubsCount",
                    SUM(ns.ratings_count) as "priceRatingsCount",
                    MAX(ns.normalized_code) as "countryCode"
                FROM normalized_stats ns
                GROUP BY ns.final_name
            ) t
        )
    ) INTO tables_data;

    -- Combine
    result_data := json_build_object(
        'kpis', kpis_data,
        'charts', charts_data,
        'tables', tables_data
    );

    RETURN result_data;
END;
$$;
