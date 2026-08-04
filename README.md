# myLibrary

## Overview

**myLibrary** is a comprehensive personal library management web application designed to help users catalog, organize, and analyze their book collections. The system supports multiple libraries, rich metadata for books (including types, labels, groups, and publishers), and offers powerful filtering, management, and bulk upload for books, authors, and countries.

## Features

### Home Page
- Add, edit, and delete libraries, types, groups, labels, and publishers
- Complete CRUD operations for all library entities

### Books Page
- **Advanced Filtering:**
  - Search books by title, original title, authors, ISBN-13, ISBN-10, or group (case-insensitive)
  - Sort books by creation date, continent, country, author(s), publisher, language, status, or type (ascending/descending)
  - Default sorting: `created_at`, descending
  - Filter by type (multi-select): shows books of any selected type
  - Filter by labels (multi-select): shows books that have ALL selected labels
- **Book Management:**
  - Add new books with comprehensive metadata (title, original title, publisher, author, translator, ISBN, publication years, language, type, group, status, library, notes)
  - Edit existing books with full field support
  - Delete books with confirmation
  - Smart display: translator, original title, and original language fields only show when original language differs from current language

### Authors Page
- **Available Filters:**
  - Search authors by name or country
  - Sort by created_at, name, continent, country, or number of books (ascending/descending)
  - Default sorting: `created_at`, descending
  - Filter by type (multi-select): shows authors with at least one book of the selected type(s)

### Countries Page
- **Available Filters:**
  - Search countries by name or alternative group (e.g., Yugoslavia, ESSR)
  - Sort by name, continent, country, number of books, number of authors, or population share (ascending/descending)
  - Default sorting: `PopulationShare`, descending
  - Filter by type (multi-select): countries with at least one book of the selected type(s)

### Bulk Operations

#### Upload Books (CSV)
- **Bulk upload** books from CSV files with validation
- **Required columns:** Title, Library, Language, Status
- **Optional columns:** Author, Publisher, Type, Group, Translator, ISBN10/13, Publication Years, Original Title/Language, Number of Pages, Labels, Notes, Country information
- **Smart entity creation:** Automatically creates publishers, types, groups, translators, and authors if they don't exist
- **Validation:** Ensures libraries and languages exist, validates ISBNs for uniqueness, checks data types
- **Error reporting:** Detailed feedback on validation failures and upload results
- **Template provided:** Pre-configured CSV template for easy data entry

## Authentication
- **Powered by Supabase** - An open-source Firebase alternative that provides a complete backend-as-a-service platform, including PostgreSQL database, real-time subscriptions, authentication, and API auto-generation
- **Built-in Auth System:** Supabase handles login, session management, and security best practices out of the box
- **Email and password login** with secure session management and automatic token refresh
- **No self-registration:** Users are created directly in Supabase; the app only exposes sign-in and forgot-password flows
- **Password reset functionality** via email with secure token-based reset links
- **Protected routes** with automatic login prompts and session validation
- **Clean logout** with proper session termination and token cleanup
- **Shared data model:** All authenticated users have read/write access to the full database — no per-user data isolation
- **Scalable infrastructure:** Supabase manages hosting, scaling, and security updates automatically

## Database Structure

- **Tables:** `Country`, `Continent`, `Language`, `Status`, `BookAuthor`, `BookLabel`, `Library`, `Book`, `Author`, `Publisher`, `Type`, `Group`, `Label`
- **Access:** All authenticated users share a single dataset with full read/write access
- **Advanced Querying:** Filtering and sorting powered by optimized SQL functions and views (`get_filtered_authors`, `get_filtered_countries`) for efficient metadata queries
- **Relationship Management:** Proper foreign key constraints and many-to-many relationships for complex book metadata

## Tech Stack

- **Frontend:** HTML5, Modern JavaScript (ES6+), Bootstrap 5, Select2 for enhanced dropdowns
- **Database & Auth:** Supabase (PostgreSQL + Authentication)
- **File Processing:** PapaParse for CSV handling
- **Styling:** Custom CSS with Bootstrap theming
- **Architecture:** Modular JavaScript with utility functions and clean separation of concerns

## File Structure

```
myLibrary/
├── assets/
│   ├── css/style.css           # Custom styling
│   ├── images/favicon.png      # Site icon
│   ├── js/
│   │   ├── auth.js            # Authentication logic
│   │   ├── books.js           # Book management
│   │   ├── authors.js         # Author management
│   │   ├── countries.js       # Country management
│   │   ├── index.js           # Home page logic
│   │   ├── upload.js          # Bulk upload functionality
│   │   └── utils.js           # Shared utilities
│   └── templates/
│       ├── book.csv            # Full Example Collection
│       └── template.csv        # Upload template
├── pages/
│   ├── books.html             # Book management interface
│   ├── authors.html           # Author management interface
│   ├── countries.html         # Country analytics interface
│   └── upload.html            # Bulk operations interface
├── db_files/                  # Database schema and functions
├── index.html                 # Home page and entry point
└── README.md                  # This documentation
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd myLibrary
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then retrieve your project URL and anon key from **Project Settings → API**

3. **Configure Supabase credentials** in `assets/js/auth.js`
   ```javascript
   const supabaseUrl = 'your-supabase-url'
   const supabaseKey = 'your-supabase-anon-key'
   ```

4. **Deploy database schema** from `/db_files` to your Supabase instance

5. **Create users** directly in your Supabase project dashboard (**Authentication → Users**)

6. **Open `index.html`** in your browser and log in

7. **Set up your library structure:**
   - Create your libraries (e.g., "Home Library", "Office")
   - Add publishers, types, and groups as needed
   - Use bulk upload for existing collections

## Usage Tips

- **Use the CSV template** in `/assets/templates/` for bulk uploads
- **Create libraries first** before uploading books
- **Authors, publishers, types, and groups** are created automatically during upload
- **ISBN validation** ensures no duplicates in your collection
- **Filter combinations** allow for precise book discovery
- **Export functionality** available for data backup and analysis

## Advanced Features

- **Conditional field display** based on translation status
- **Multi-language support** with original language tracking
- **Comprehensive metadata** including publication years, page counts, and notes
- **Label system** for custom categorization
- **Country-based analytics** for collection insights
- **Responsive design** for mobile and desktop use

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request with clear descriptions

For bug reports or feature requests, please open an issue with detailed information.

## License

This project is open source. See LICENSE file for details.

---

**myLibrary** - Your personal collection, organized and accessible.