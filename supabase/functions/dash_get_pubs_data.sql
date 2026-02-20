CREATE OR REPLACE FUNCTION dash_get_pubs_data()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    analytics_data json;
    leaderboards_data json;
    result_data json;
BEGIN
    -- Analytics Data
    WITH country_stats AS (
        SELECT
            p.country_code,
            c.name AS country_name,
            COUNT(DISTINCT p.id) AS total_pubs,
            COUNT(r.id) FILTER (WHERE r.price IS NOT NULL AND r.price > 0) as price_ratings_count,
            AVG(r.price) FILTER (WHERE r.price IS NOT NULL AND r.price > 0) AS avg_price
        FROM
            pubs p
        LEFT JOIN
            ratings r ON p.id = r.pub_id
        LEFT JOIN
            countries c ON p.country_code = c.iso2
        WHERE
            p.country_code IS NOT NULL
        GROUP BY
            p.country_code, c.name
    ),
    pint_prices AS (
        SELECT
            json_agg(json_build_object(
                'country', cs.country_name,
                'price', COALESCE(cs.avg_price, 0),
                'pubsCount', cs.total_pubs,
                'priceRatingsCount', cs.price_ratings_count,
                'countryCode', cs.country_code
            )) AS pint_price_by_country
        FROM
            country_stats cs
    ),
    global_stats AS (
        SELECT
            COUNT(DISTINCT p.id) AS total_pubs,
            COUNT(DISTINCT r.pub_id) AS total_rated_pubs,
            AVG( (r.quality + r.price) / 2.0 ) AS average_overall_rating,
            COUNT(r.id) AS total_ratings_submitted
        FROM
            pubs p
        LEFT JOIN
            ratings r ON p.id = r.pub_id
    )
    SELECT
        json_build_object(
            'totalPubs', gs.total_pubs,
            'totalRatedPubs', gs.total_rated_pubs,
            'averageOverallRating', COALESCE(gs.average_overall_rating, 0),
            'totalRatingsSubmitted', gs.total_ratings_submitted,
            'pintPriceByCountry', pp.pint_price_by_country
        )
    INTO
        analytics_data
    FROM
        global_stats gs, pint_prices pp;

    -- Leaderboards Data
    WITH pub_scores AS (
        SELECT
            p.id,
            p.name,
            p.location,
            AVG( (r.quality + r.price) / 2.0 ) * 10 AS average_score,
            COUNT(r.id) AS total_ratings
        FROM
            pubs p
        JOIN
            ratings r ON p.id = r.pub_id
        GROUP BY
            p.id, p.name, p.location
    )
    SELECT
        json_build_object(
            'topRated', (
                SELECT json_agg(t)
                FROM (
                    SELECT id, name, location, average_score AS "averageScore", total_ratings AS "totalRatings"
                    FROM pub_scores
                    ORDER BY average_score DESC, total_ratings DESC
                    LIMIT 10
                ) t
            ),
            'mostReviewed', (
                SELECT json_agg(t)
                FROM (
                    SELECT id, name, location, average_score AS "averageScore", total_ratings AS "totalRatings"
                    FROM pub_scores
                    ORDER BY total_ratings DESC, average_score DESC
                    LIMIT 10
                ) t
            )
        )
    INTO
        leaderboards_data;

    -- Combine into final JSON object
    result_data := json_build_object(
        'analytics', analytics_data,
        'leaderboards', leaderboards_data
    );

    RETURN result_data;
END;
$$;
