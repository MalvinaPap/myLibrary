# myLibrary
## Summary

## Pages Specifications
Home Page

Books Page:
--search filter searches in Title, Authors, Isbn13, Isbn10, Group (case insensitive)
--sort by: created_at, continent, country, author(s), publisher, language, status, type (asc or desc). 
--default sorting created_at, asc
--Type filter: multiple selection, brings all selected types
--Label filter: multiple selection, brings results having ALL the selected labels 

Authors Page
--search filter searches in Name and Country
--Sort by: name, continent, country, #books (asc or desc). 
--default sorting by Name asc
--Type filter: multiple selection, brings all selected types - authors with at least a book of the type

Countries Page
--search filter searches in Name and AltGroup (ex Yugoslavia, ESSR)
--default sorting by Name asc
--Type filter: multiple selection, brings all selected types - countries with at least a book of the type


## Authentication


## Database Setup
Global Tables: Country, Continent, Language, Status, BookAuthor, BookLabel
Rest are per User