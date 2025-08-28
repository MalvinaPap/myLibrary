create or replace view book_full_view WITH (security_invoker=on) as
select  
       b."ID",
       b."Name" as "Title",
       string_agg(distinct a."Name", ', ') filter (where a."Name" is not null) as "Creators",
       aa."Name" as "Translator",
       "Isbn13",
       "Isbn10",
       p."Name" as "Publisher",
       string_agg(distinct c."Name", ', ') filter (where c."Name" is not null) as "Country",
       string_agg(distinct con."Name", ', ') filter (where con."Name" is not null) as "Continent",
       l."Name" as "Language",
       t."Name" as "Type",
       g."Name" as "Group",
       string_agg(distinct th."Name", ', ') filter (where th."Name" is not null) as "Labels",
       date_trunc('minute', b.created_at) as "created_at",
       s."Name" as "Status",
       ll."Name" as "Library"
from "Book" b
inner join "Language" l on l."ID"=b."LanguageId"
inner join "LibraryLocation" ll on ll."ID"="LibraryLocationId"
inner join "Status" s on s."ID"="StatusId"
left join "BookAuthor" ba on ba."BookId"=b."ID"
left join "Author" a on a."ID"=ba."AuthorId"
left join "Author" aa on aa."ID"=b."TranslatorId"
left join "Publisher" p on p."ID"=b."PublisherId"
left join "Type" t on t."ID"=b."TypeId"
left join "Group" g on g."ID"=b."GroupId"
left join "Country" c on c."ID"=a."CountryId"
left join "Continent" con on con."ID"=c."ContinentId"
left join "BookLabel" bt on bt."BookId"=b."ID"
left join "Label" th on th."ID"=bt."LabelId"
group by
  b."ID",
  b."Name",
  aa."Name",
  "Isbn13",
  "Isbn10",
   p."Name",
   l."Name",
   g."Name",
   t."Name",
   b.created_at,
   s."Name",
   ll."Name"
order by b.created_at desc;