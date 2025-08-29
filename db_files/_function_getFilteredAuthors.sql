CREATE OR REPLACE FUNCTION get_filtered_authors(
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
    "isAuthor" boolean,
    "isTranslator" boolean,
    "#Books" BIGINT,
    "#Translations" BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    WITH authors_translations AS (
        SELECT "TranslatorId", COUNT(DISTINCT b."ID") as "#Translations"
        FROM "Book" b
        GROUP by "TranslatorId"
    )

    SELECT 
        a."ID", 
        a."Name", 
        c."Name" AS "Country", 
        con."Name" AS "Continent", 
        date_trunc('minute', a.created_at) as "created_at",
        exists(select 1 from "BookAuthor" where "AuthorId"=a."ID") as "isAuthor",
        exists(select 1 from "Book" b where b."TranslatorId"=a."ID") as "isTranslator",
        COUNT(DISTINCT ba."BookId") AS "#Books",
        at."#Translations"
    FROM "Author" a
    LEFT JOIN "Country" c ON c."ID" = a."CountryId"
    LEFT JOIN "Continent" con on con."ID"=c."ContinentId"
    LEFT JOIN "BookAuthor" ba ON ba."AuthorId" = a."ID"
    LEFT JOIN "Book" b ON b."ID" = ba."BookId"
    LEFT JOIN "Type" t ON b."TypeId" = t."ID"
    LEFT JOIN "LibraryLocation" ll ON b."LibraryLocationId" = ll."ID"
    LEFT JOIN authors_translations at on at."TranslatorId"=a."ID"
    WHERE 
        (p_library IS NULL OR ll."Name" = p_library)
        AND (p_type IS NULL OR t."Name" = ANY(p_type))
        AND (p_country IS NULL OR c."Name" = p_country)
        AND (p_continent IS NULL OR con."Name" = p_continent)
    GROUP BY a."ID", a."Name", c."Name", con."Name", a.created_at, "isAuthor", "isTranslator", at."#Translations"
    ORDER BY COUNT(DISTINCT ba."BookId") desc;
END;
$$ LANGUAGE plpgsql;