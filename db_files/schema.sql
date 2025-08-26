
---> Updates to referenced entities do not affect the central entity.

-- Book Table
CREATE TABLE public.Book (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UserId uuid NOT NULL DEFAULT auth.uid(),
  Name character varying NOT NULL,
  LanguageId bigint NOT NULL,
  LibraryLocationId bigint NOT NULL,
  StatusId bigint NOT NULL,
  Isbn13 character varying, 
  Isbn10 character varying,
  PublisherId bigint,
  TypeId bigint,
  GroupId bigint,
  CONSTRAINT Book_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT Book_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id),
  -- if referenced BookId deleted -> Set Null
  CONSTRAINT Book_GroupId_fkey FOREIGN KEY (GroupId) REFERENCES public.Group(ID),
  -- if referenced LibraryLocationId deleted -> Restrict
  CONSTRAINT Book_LibraryLocationId_fkey FOREIGN KEY (LibraryLocationId) REFERENCES public.LibraryLocation(ID),
  -- if referenced PublisherId deleted -> Set Null
  CONSTRAINT Book_PublisherId_fkey FOREIGN KEY (PublisherId) REFERENCES public.Publisher(ID),
  -- if referenced TypeId deleted -> Set Null
  CONSTRAINT Book_TypeId_fkey FOREIGN KEY (TypeId) REFERENCES public.Type(ID),
  -- if referenced StatusId deleted -> Restrict
  CONSTRAINT Book_StatusId_fkey FOREIGN KEY (StatusId) REFERENCES public.Status(ID),
  -- if referenced LanguageId deleted -> Restrict
  CONSTRAINT Book_LanguageId_fkey FOREIGN KEY (LanguageId) REFERENCES public.Language(ID)
);

-- Author Table
CREATE TABLE public.Author (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UserId uuid NOT NULL DEFAULT auth.uid(),
  Name character varying NOT NULL,
  CountryId bigint,
  CONSTRAINT Author_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT Author_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id),
  -- if referenced CountryId deleted -> Set Null
  CONSTRAINT Author_CountryId_fkey FOREIGN KEY (CountryId) REFERENCES public.Country(ID)
);

-- BookAuthor Table
CREATE TABLE public.BookAuthor (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  BookId bigint NOT NULL,
  AuthorId bigint NOT NULL,
  CONSTRAINT BookAuthor_pkey PRIMARY KEY (ID),
  -- if referenced BookId deleted -> Cascade
  CONSTRAINT BookAuthor_BookId_fkey FOREIGN KEY (BookId) REFERENCES public.Book(ID),
  -- if referenced AuthorId deleted -> Cascade
  CONSTRAINT BookAuthor_AuthorId_fkey FOREIGN KEY (AuthorId) REFERENCES public.Author(ID)
);

-- BookLabel Table
CREATE TABLE public.BookLabel (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  BookId bigint NOT NULL,
  LabelId bigint NOT NULL,
  CONSTRAINT BookLabel_pkey PRIMARY KEY (ID),
  -- if referenced LabelId deleted -> Cascade
  CONSTRAINT BookLabel_LabelId_fkey FOREIGN KEY (LabelId) REFERENCES public.Label(ID),
  -- if referenced BookId deleted -> Cascade
  CONSTRAINT BookTheme_BookId_fkey FOREIGN KEY (BookId) REFERENCES public.Book(ID)
);

-- Continent Table
CREATE TABLE public.Continent (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  Name character varying UNIQUE,
  CONSTRAINT Continent_pkey PRIMARY KEY (ID)
);

-- Country Table
CREATE TABLE public.Country (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  Name character varying NOT NULL UNIQUE,
  ContinentId bigint NOT NULL,
  "Population Share" character varying,
  AltGroup text,
  PopulationShare numeric,
  CONSTRAINT Country_pkey PRIMARY KEY (ID),
  -- if referenced ContinentId deleted -> Restrict
  CONSTRAINT Country_ContinentId_fkey FOREIGN KEY (ContinentId) REFERENCES public.Continent(ID)
);

-- Group Table
CREATE TABLE public.Group (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  Name character varying NOT NULL,
  CONSTRAINT Group_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT Group_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);

-- Label Table
CREATE TABLE public.Label (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  Name character varying NOT NULL,
  CONSTRAINT Label_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT Label_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);

-- Language Table
CREATE TABLE public.Language (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  Name character varying,
  CONSTRAINT Language_pkey PRIMARY KEY (ID)
);

-- LibraryLocation Table
CREATE TABLE public.LibraryLocation (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  UserId uuid NOT NULL DEFAULT auth.uid(),
  Name character varying NOT NULL,
  CONSTRAINT LibraryLocation_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT LibraryLocation_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);

-- Publisher Table
CREATE TABLE public.Publisher (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UserId uuid NOT NULL DEFAULT auth.uid(),
  Name character varying NOT NULL,
  CountryId bigint,
  CONSTRAINT Publisher_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT Publisher_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id),
  -- if referenced CountryId deleted -> Set Null
  CONSTRAINT Publisher_CountryId_fkey FOREIGN KEY (CountryId) REFERENCES public.Country(ID)
);

-- Status Table 
CREATE TABLE public.Status (
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  Name character varying NOT NULL UNIQUE,
  CONSTRAINT Status_pkey PRIMARY KEY (ID)
);

-- Type Table
CREATE TABLE public.Type (
  Name character varying NOT NULL,
  ID bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  UserId uuid DEFAULT auth.uid(),
  CONSTRAINT Type_pkey PRIMARY KEY (ID),
  -- if referenced UserId deleted -> Restrict
  CONSTRAINT Type_UserId_fkey FOREIGN KEY (UserId) REFERENCES auth.users(id)
);