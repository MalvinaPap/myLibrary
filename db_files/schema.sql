-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.Book (
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  Name character varying NOT NULL,
  Isbn13 character varying,
  Isbn10 character varying,
  PublisherId bigint,
  LanguageId bigint NOT NULL,
  LibraryLocationId bigint NOT NULL,
  StatusId bigint NOT NULL,
  TypeId bigint,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  GroupId bigint,
  CONSTRAINT Book_pkey PRIMARY KEY (ID),
  CONSTRAINT Book_GroupId_fkey FOREIGN KEY (GroupId) REFERENCES public.Group(ID),
  CONSTRAINT Book_LibraryLocationId_fkey FOREIGN KEY (LibraryLocationId) REFERENCES public.LibraryLocation(ID),
  CONSTRAINT Book_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id),
  CONSTRAINT Book_PublisherId_fkey FOREIGN KEY (PublisherId) REFERENCES public.Publisher(ID),
  CONSTRAINT Book_TypeId_fkey FOREIGN KEY (TypeId) REFERENCES public.Type(ID),
  CONSTRAINT TOFIX_Book_StatusId_fkey FOREIGN KEY (StatusId) REFERENCES public.Status(ID),
  CONSTRAINT TOFIX_Book_LanguageId_fkey FOREIGN KEY (LanguageId) REFERENCES public.Language(ID)
);
CREATE TABLE public.Author (
  Name character varying NOT NULL,
  CountryId bigint,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UserId uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT Author_pkey PRIMARY KEY (ID),
  CONSTRAINT Author_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id),
  CONSTRAINT TOFIX_Author_CountryId_fkey FOREIGN KEY (CountryId) REFERENCES public.Country(ID)
);

CREATE TABLE public.BookAuthor (
  BookId bigint NOT NULL,
  AuthorId bigint NOT NULL,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CONSTRAINT BookAuthor_pkey PRIMARY KEY (ID),
  CONSTRAINT TOFIX_BookAuthor_BookId_fkey FOREIGN KEY (BookId) REFERENCES public.Book(ID),
  CONSTRAINT BookAuthor_AuthorId_fkey FOREIGN KEY (AuthorId) REFERENCES public.Author(ID)
);
CREATE TABLE public.BookLabel (
  BookId bigint NOT NULL,
  LabelId bigint NOT NULL,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CONSTRAINT BookLabel_pkey PRIMARY KEY (ID),
  CONSTRAINT BookLabel_LabelId_fkey FOREIGN KEY (LabelId) REFERENCES public.Label(ID),
  CONSTRAINT TOFIX_BookTheme_BookId_fkey FOREIGN KEY (BookId) REFERENCES public.Book(ID)
);
CREATE TABLE public.Continent (
  Name character varying UNIQUE,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CONSTRAINT Continent_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Country (
  Name character varying NOT NULL UNIQUE,
  ContinentId bigint NOT NULL,
  Population Share character varying,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  AltGroup text,
  PopulationShare numeric,
  CONSTRAINT Country_pkey PRIMARY KEY (ID),
  CONSTRAINT TOFIX_Country_ContinentId_fkey FOREIGN KEY (ContinentId) REFERENCES public.Continent(ID)
);
CREATE TABLE public.Group (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Name character varying NOT NULL,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT Group_pkey PRIMARY KEY (ID),
  CONSTRAINT Group_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);
CREATE TABLE public.Label (
  Name character varying NOT NULL,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT Label_pkey PRIMARY KEY (ID),
  CONSTRAINT Label_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);
CREATE TABLE public.Language (
  Name character varying,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CONSTRAINT Language_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.LibraryLocation (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Name character varying NOT NULL,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT LibraryLocation_pkey PRIMARY KEY (ID),
  CONSTRAINT LibraryLocation_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);
CREATE TABLE public.Publisher (
  Name character varying NOT NULL,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CountryId bigint,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UserId uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT Publisher_pkey PRIMARY KEY (ID),
  CONSTRAINT Publisher_CountryId_fkey FOREIGN KEY (CountryId) REFERENCES public.Country(ID),
  CONSTRAINT Publisher_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);
CREATE TABLE public.Status (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  Name character varying NOT NULL UNIQUE,
  CONSTRAINT Status_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Type (
  Name character varying NOT NULL,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  UserId uuid DEFAULT auth.uid(),
  CONSTRAINT Type_pkey PRIMARY KEY (ID),
  CONSTRAINT Type_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);