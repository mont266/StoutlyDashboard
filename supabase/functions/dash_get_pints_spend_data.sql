-- Create an RPC to compute pints drank and spend data bypassing RLS
CREATE OR REPLACE FUNCTION dash_get_pints_spend_data(exchange_rates jsonb DEFAULT '{}'::jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    result_data json;
    
    checkin_pints numeric := 0;
    checkin_spend numeric := 0;
    checkin_spend_dp int := 0;
    checkin_spend_pints numeric := 0;

    ratings_pints numeric := 0;
    ratings_spend numeric := 0;
    ratings_spend_dp int := 0;
    ratings_spend_pints numeric := 0;
    
    currency_map jsonb := '{
        "GB": "GBP", "UK": "GBP", "IE": "EUR", "US": "USD", "DE": "EUR", "FR": "EUR", 
        "ES": "EUR", "NL": "EUR", "AU": "AUD", "PT": "EUR", "DK": "DKK", "CA": "CAD", 
        "PL": "PLN", "TR": "TRY", "IT": "EUR", "IL": "ILS", "AT": "EUR", "BE": "EUR", 
        "LU": "EUR", "PE": "PEN", "CZ": "CZK", "SE": "SEK", "NO": "NOK", "CH": "CHF", 
        "JP": "JPY", "NZ": "NZD", "BR": "BRL", "IN": "INR", "ZA": "ZAR", "MX": "MXN", 
        "HU": "HUF", "RO": "RON", "ID": "IDR", "VN": "VND", "TH": "THB", "FI": "EUR",
        "LC": "XCD", "AI": "XCD", "AG": "XCD", "DM": "XCD", "GD": "XCD", "MS": "XCD",
        "KN": "XCD", "VC": "XCD"
    }'::jsonb;
BEGIN

    -- Calculate checkins
    SELECT 
        COALESCE(SUM(CASE WHEN amount_drank > 0 THEN amount_drank ELSE 1 END), 0),
        COALESCE(SUM(
            CASE WHEN price IS NOT NULL THEN
                price * (CASE WHEN amount_drank > 0 THEN amount_drank ELSE 1 END) / 
                COALESCE((exchange_rates->>(COALESCE(currency_map->>(UPPER(p.country_code)), 'GBP')))::numeric, 1)
            ELSE 0 END
        ), 0),
        COALESCE(SUM(CASE WHEN price IS NOT NULL THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN price IS NOT NULL THEN (CASE WHEN amount_drank > 0 THEN amount_drank ELSE 1 END) ELSE 0 END), 0)
    INTO checkin_pints, checkin_spend, checkin_spend_dp, checkin_spend_pints
    FROM pub_checkins c
    LEFT JOIN pubs p ON c.pub_id = p.id;

    -- Calculate ratings
    SELECT 
        COALESCE(SUM(CASE WHEN amount_drank > 0 THEN amount_drank ELSE 1 END), 0),
        COALESCE(SUM(
            CASE WHEN exact_price IS NOT NULL THEN
                exact_price * (CASE WHEN amount_drank > 0 THEN amount_drank ELSE 1 END) / 
                COALESCE((exchange_rates->>(COALESCE(currency_map->>(UPPER(p.country_code)), 'GBP')))::numeric, 1)
            ELSE 0 END
        ), 0),
        COALESCE(SUM(CASE WHEN exact_price IS NOT NULL THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN exact_price IS NOT NULL THEN (CASE WHEN amount_drank > 0 THEN amount_drank ELSE 1 END) ELSE 0 END), 0)
    INTO ratings_pints, ratings_spend, ratings_spend_dp, ratings_spend_pints
    FROM ratings r
    LEFT JOIN pubs p ON r.pub_id = p.id;

    result_data := json_build_object(
        'totalCheckinPints', checkin_pints,
        'totalRatingsPints', ratings_pints,
        'totalPintsDrankSum', checkin_pints + ratings_pints,
        'totalSpentOnPints', checkin_spend + ratings_spend,
        'totalSpendDataPoints', checkin_spend_dp + ratings_spend_dp,
        'totalSpendPints', checkin_spend_pints + ratings_spend_pints,
        'avgSpendPerPint', CASE WHEN (checkin_spend_pints + ratings_spend_pints) > 0 THEN (checkin_spend + ratings_spend) / (checkin_spend_pints + ratings_spend_pints) ELSE 0 END
    );

    RETURN result_data;
END;
$$;
