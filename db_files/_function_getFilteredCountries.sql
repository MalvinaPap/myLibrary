CREATE OR REPLACE FUNCTION get_filtered_countries(
    p_library varchar DEFAULT NULL,
    p_continent varchar DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_type TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    "ID" BIGINT,
    "Name" varchar,
    "Continent" varchar,
    "AltGroup" text,
    "PopulationShare" numeric,
    "Status" text,
    "#Books" BIGINT,
    "#Authors" BIGINT
)
AS $$
BEGIN
    RETURN QUERY
        WITH country_data AS (
            SELECT 
                c."ID",
                c."Name",
                con."Name" as "Continent",
                c."AltGroup",
                c."PopulationShare",
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM "Book" b 
                        INNER JOIN "BookAuthor" ba ON ba."BookId"=b."ID"
                        INNER JOIN "Author" a ON a."ID"=ba."AuthorId" 
                        WHERE a."CountryId"=c."ID" 
                          AND b."StatusId"=2
                    ) THEN 'Read'
                    WHEN EXISTS (
                        SELECT 1 FROM "Book" b 
                        INNER JOIN "BookAuthor" ba ON ba."BookId"=b."ID"
                        INNER JOIN "Author" a ON a."ID"=ba."AuthorId" 
                        WHERE a."CountryId"=c."ID" 
                          AND b."StatusId" in (1,7)
                    ) THEN 'Owned'
                    ELSE 'To Buy'
                END AS "Country Status",
                COUNT(DISTINCT ba."BookId") AS "#Books",
                COUNT(DISTINCT a."ID") AS "#Authors"
            FROM "Country" c
            INNER JOIN "Continent" con ON con."ID" = c."ContinentId"
            LEFT JOIN "Author" a ON a."CountryId"=c."ID"
            LEFT JOIN "BookAuthor" ba ON ba."AuthorId"=a."ID" 
            LEFT JOIN "Book" b ON b."ID" = ba."BookId"
            LEFT JOIN "Type" t ON b."TypeId" = t."ID"
            LEFT JOIN "LibraryLocation" ll ON b."LibraryLocationId" = ll."ID"
            WHERE 
                (p_library IS NULL OR ll."Name" = p_library)
                AND (p_continent IS NULL OR con."Name" = p_continent)
                AND (p_type IS NULL OR t."Name" = ANY(p_type))
            GROUP BY c."ID", c."Name", con."Name", c."AltGroup", c."PopulationShare"
        )
        SELECT *
        FROM country_data
        WHERE (p_status IS NULL OR "Country Status" = p_status)
        ORDER BY "#Books" DESC;
END;
$$ LANGUAGE plpgsql;