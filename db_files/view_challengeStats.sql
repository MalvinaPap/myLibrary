create or replace view challenge_stats_view WITH (security_invoker=on) as
with countries_view as (
        select con."Name" as "Continent",
        c."Name" as "Country",
        c."ID",
        c."AltGroup",
        "PopulationShare",
        case 
                when exists (select 1 from "Book" b 
                        inner join "BookAuthor" ba on ba."BookId"=b."ID"
                        inner join "Author" a on a."ID"=ba."AuthorId" 
                        where a."CountryId"=c."ID" and b."StatusId"=2) then 'Read'
                when exists (select 1 from "Book" b 
                        inner join "BookAuthor" ba on ba."BookId"=b."ID"
                        inner join "Author" a on a."ID"=ba."AuthorId" 
                        where a."CountryId"=c."ID" and b."StatusId" in (1,7)) then 'Owned'
                else 'To Buy'
        end as "Status"
        from "Country" c
        inner join "Continent" con on con."ID" ="ContinentId"
        order by "PopulationShare" desc
        limit 200
),

values as ( 
        select "Continent", 
                count("Country") as "Countries",
                count("Country") filter (where "Status"='Read') as "CountriesRead"
        from countries_view
        group by "Continent"
        union 
        select 'Total' as "Continent", 
                count("Country") as "Countries",
                count("Country") filter (where "Status"='Read') as "CountriesRead"
        from countries_view
)

select v.*,
       round((("CountriesRead"::float / "Countries") * 100)::numeric, 1)::text AS "Percentage"
from values v
order by "Continent"