create or replace view "Translator" WITH (security_invoker=on) as
select distinct "TranslatorId" as "ID", a."Name" as "Name"
from "Book"
inner join "Author" a on a."ID"="TranslatorId"