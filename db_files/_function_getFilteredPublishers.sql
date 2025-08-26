CREATE OR REPLACE FUNCTION get_filtered_publishers(
    p_library TEXT DEFAULT NULL,
    p_type TEXT[] DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_continent TEXT DEFAULT NULL
)
RETURNS TABLE (
    "ID" BIGINT,
    "Name" varchar,
    "Country" varchar,
    "Continent" varchar,
    created_at TIMESTAMP,
    "#Books" BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."ID", 
        p."Name", 
        c."Name" AS "Country", 
        con."Name" AS "Continent", 
        date_trunc('second', p.created_at) as "created_at",
        COUNT(DISTINCT b."ID") AS "#Books"
    FROM "Publisher" p
    LEFT JOIN "Country" c ON c."ID" = p."CountryId"
    LEFT JOIN "Continent" con on con."ID"=c."ContinentId"
    LEFT JOIN "Book" b ON b."PublisherId"=p."ID"
    LEFT JOIN "Type" t ON b."TypeId" = t."ID"
    LEFT JOIN "LibraryLocation" ll ON b."LibraryLocationId" = ll."ID"
    WHERE 
        (p_library IS NULL OR ll."Name" = p_library)
        AND (p_type IS NULL OR t."Name" = ANY(p_type))
        AND (p_country IS NULL OR c."Name" = p_country)
        AND (p_continent IS NULL OR con."Name" = p_continent)
    GROUP BY p."ID", p."Name", c."Name", con."Name", p.created_at
    order by COUNT(DISTINCT b."ID") desc;
END;
$$ LANGUAGE plpgsql;
