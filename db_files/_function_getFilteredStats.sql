CREATE OR REPLACE FUNCTION get_filtered_stats(
    p_library varchar DEFAULT NULL,
    p_continent varchar DEFAULT NULL,
    p_type TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    "Continent" varchar,
    "Countries" BIGINT,
    "CountriesRead" BIGINT,
    "Percentage" TEXT
)
AS $$
BEGIN
    RETURN QUERY
        WITH countries_view AS (
            SELECT con."Name" AS "Continent",
                   c."Name" AS "Country",
                   c."ID",
                   c."AltGroup",
                   "PopulationShare",
                   EXISTS (
                        SELECT 1 
                        FROM "Book" b 
                        INNER JOIN "BookAuthor" ba ON ba."BookId" = b."ID"
                        INNER JOIN "Author" a ON a."ID" = ba."AuthorId"
                        INNER JOIN "LibraryLocation" ll on ll."ID"=b."LibraryLocationId"
                        LEFT JOIN "Type" t on t."ID"=b."TypeId"
                        WHERE a."CountryId" = c."ID" 
                          AND b."StatusId" = 2
                          AND (p_library IS NULL OR ll."Name" = p_library)
                          AND (p_type IS NULL OR t."Name" = ANY(p_type))
                   ) AS "isRead"    
            FROM "Country" c
            INNER JOIN "Continent" con ON con."ID" = "ContinentId"
            LIMIT 200
        ),
        stats AS ( 
            SELECT cv."Continent", 
                   COUNT(cv."Country") AS "Countries",
                   COUNT(cv."Country") FILTER (WHERE cv."isRead" = TRUE) AS "CountriesRead"
            FROM countries_view cv
            GROUP BY cv."Continent"
            UNION 
            SELECT 'Total' AS "Continent", 
                   COUNT(cv."Country") AS "Countries",
                   COUNT(cv."Country") FILTER (WHERE cv."isRead" = TRUE) AS "CountriesRead"
            FROM countries_view cv
        )
        SELECT s."Continent",
               s."Countries",
               s."CountriesRead",
               ROUND(((s."CountriesRead"::FLOAT / s."Countries") * 100)::NUMERIC, 1)::TEXT AS "Percentage"
        FROM stats s
        WHERE (p_continent IS NULL OR s."Continent" = p_continent)
        ORDER BY s."Continent";
END;
$$ LANGUAGE plpgsql;