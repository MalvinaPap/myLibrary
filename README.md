# myLibrary

## Overview

**myLibrary** is a personal library management web application designed to help users catalog, organize, and analyze their book collections. The system supports multiple libraries, rich metadata for books (including types, labels, groups, and publishers), and offers powerful filtering and management features for books, authors, and countries.

## Features

### Home Page
- Add, edit, and delete libraries, types, groups, labels, and publishers.

### Books Page
- Search books by title, authors, ISBN-13, ISBN-10, or group (case-insensitive).
- Sort books by creation date, continent, country, author(s), publisher, language, status, or type (ascending/descending).
- Default sorting: `created_at`, ascending.
- Filter by type (multi-select): shows books of any selected type.
- Filter by labels (multi-select): shows books that have ALL selected labels.

### Authors Page
- Search authors by name or country.
- Sort by name, continent, country, or number of books (ascending/descending).
- Default sorting: name, ascending.
- Filter by type (multi-select): shows authors with at least one book of the selected type(s).

### Countries Page
- Search countries by name or alternative group (e.g., Yugoslavia, ESSR).
- Sort by name, continent, country, number of books, number of authors, or population share (ascending/descending).
- Default sorting: name, ascending.
- Filter by type (multi-select): countries with at least one book of the selected type(s).

## Authentication

- The app uses Supabase for authentication.
- On visiting a protected page, users are prompted to log in with email and password.
- Forgotten passwords can be reset via email.
- After login, users can log out using the logout button in the navigation bar.

## Database Structure

- **Global Tables:** `Country`, `Continent`, `Language`, `Status`, `BookAuthor`, `BookLabel`.
- **Per User Tables:** All other tables (e.g., Library, Book, Author) are user-specific.
- Filtering and sorting in the UI are powered by SQL functions and views, such as `get_filtered_authors` and `get_filtered_countries`, supporting efficient queries on the metadata.

## Tech Stack

- **Frontend:** HTML, JavaScript, Bootstrap 5, jQuery, Select2
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **Other:** Custom SQL functions for advanced filtering/sorting

## Getting Started

1. **Clone the repository.**
2. **Configure Supabase credentials** (see `assets/js/auth.js`).
3. **Deploy SQL files** in `/db_files` to your Supabase instance.
4. **Open `index.html`** in your browser and log in!

## Contribution

Feel free to open issues or submit pull requests to improve or extend functionality.

---
This README is based on the code and current documentation. For details about advanced filtering or database schema, see the `/db_files` directory and related JavaScript files.