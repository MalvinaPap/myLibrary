const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// --- Create Supabase client ---
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let allBooks = [];

// Populate filter options
async function populateFilterOptions(filter_name='', table_name='') {
  const select = document.getElementById(filter_name);
  const { data, error } = await db
    .from(table_name)
    .select('Name')
    .order('Name', { ascending: true });
  if (error) {
    console.error('Error fetching options:', error);
    select.innerHTML = `<option value="">All</option>`;
    return;
  }
  select.innerHTML = `<option value="">All</option>` +
    data.map(c => `<option value="${c.Name}">${c.Name}</option>`).join('');
}

// Fetch and display books, optionally filtered 
async function loadBooks(Country = '', Library = '', Author = '', 
                         Publisher = '', Language = '', Type = '', 
                         Status = '', Label = '', Search = '') {                        

  console.log("📡 Fetching books from Supabase...");
  let query = db.from('book_full_view').select('*');
  if (Country) query = query.ilike('Country', `%${Country}%`);
  if (Library) query = query.eq('Library', Library);
  if (Author)  query = query.ilike('Creators', `%${Author}%`);
  if (Publisher) query = query.eq('Publisher', Publisher);
  if (Language) query = query.eq('Language', Language);
  if (Type) query = query.eq('Type', Type);
  if (Status) query = query.eq('Status', Status);
  if (Label)  query = query.ilike('Labels', `%${Label}%`);
  if (Search) query = query.or(`Title.ilike.%${Search}%, ISBN.ilike.%${Search}%, Creators.ilike.%${Search}%`);

  const { data, error } = await query;
  const list = document.getElementById('book-list');

  if (error) {
    console.error('❌ Error fetching books:', error);
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  allBooks = data || [];
  list.innerHTML = '';

  if (!data || data.length === 0) {
    list.innerHTML = '<div>No books found.</div>';
    return;
  }

  // Ensure book-list is a row container for Bootstrap grid
  list.className = 'row g-3'; // g-3 adds gap between columns

  const safe = (val) => val || 'N/A';

  data.forEach(book => {
    const col = document.createElement('div');
    // Responsive: 1 col on xs, 2 cols on sm, 3 cols on lg+
    col.className = 'col-12 col-sm-6 col-lg-4';

    const creatorBadges = safe(book.Creators) !== 'N/A'
      ? book.Creators.split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0)
          .map(name => `<span class="badge bg-secondary me-1 mb-1" style="font-size: 0.75rem;">${name}</span>`)
          .join('')
      : '';
    const countryBadges = safe(book.Country) !== 'N/A'
      ? book.Country.split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0)
          .map(name => `<span class="badge bg-secondary me-1 mb-1" style="font-size: 0.75rem;">${name}</span>`)
          .join('')
      : '';
    const labelBadges = safe(book.Labels) !== 'N/A'
      ? book.Labels.split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0)
          .map(name => `<span class="badge bg-secondary me-1 mb-1" style="font-size: 0.75rem;">${name}</span>`)
          .join('')
      : '';

    col.innerHTML = `
    <div class="card h-100 shadow-sm rounded">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="card-title mb-0">${safe(book.Title)}</h5>
        </div>
        ${safe(book.ISBN) !== 'N/A' ? `<p class="mb-1"><em>ISBN:</em> ${book.ISBN}</p>` : ''}
        ${creatorBadges ? `<p class="mb-1"><em>Creator:</em> ${creatorBadges}</p>` : ''}
        ${safe(book.Publisher) !== 'N/A' ? `<p class="mb-1"><em>Publisher:</em> ${book.Publisher}</p>` : ''}
        ${countryBadges ? `<p class="mb-1"><em>Country:</em> ${countryBadges}</p>` : ''}
        ${safe(book.Language) !== 'N/A' ? `<p class="mb-1"><em>Language:</em> ${book.Language}</p>` : ''}
        ${safe(book.Type) !== 'N/A' ? `<p class="mb-1"><em>Type:</em> ${book.Type}</p>` : ''}
        ${labelBadges ? `<p class="mb-1"><em>Labels:</em> ${labelBadges}</p>` : ''}
        ${safe(book.DateAdded) !== 'N/A' ? `<p class="mb-1"><em>Date Added:</em> ${book.DateAdded}</p>` : ''}
      </div>
      <div class="d-flex mb-2">
          <div class="ms-auto">
            <button class="btn btn-warning btn-sm add-author-btn me-1" data-id="${book.ID}">+Author</button>
            <button class="btn btn-primary btn-sm add-label-btn me-1" data-id="${book.ID}">+Label</button>
            <button class="btn btn-danger btn-sm delete-btn me-2" data-id="${book.ID}">Delete</button>
          </div>
        </div>
    </div>
    `;
    list.appendChild(col);
  });
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await populateFilterOptions(filter_name='library-filter', table_name='LibraryLocation');
  await populateFilterOptions(filter_name='country-filter', table_name='Country');
  await populateFilterOptions(filter_name='author-filter', table_name='Author');
  await populateFilterOptions(filter_name='publisher-filter', table_name='Publisher');
  await populateFilterOptions(filter_name='lang-filter', table_name='Language');
  await populateFilterOptions(filter_name='type-filter', table_name='Type');
  await populateFilterOptions(filter_name='status-filter', table_name='Status');
  await populateFilterOptions(filter_name='label-filter', table_name='Label');
  await loadBooks();

  // Listen for Dropdown filters
  ['country-filter','author-filter','library-filter','publisher-filter',
   'lang-filter','type-filter','status-filter','label-filter']
    .forEach(id => document.getElementById(id).addEventListener('change', applyFilters));

  // Listen for Search filter (run on typing, debounce optional)
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});

// Apply filters 
async function applyFilters() {
  const country = document.getElementById('country-filter').value;
  const author = document.getElementById('author-filter').value;
  const library = document.getElementById('library-filter').value;
  const publisher = document.getElementById('publisher-filter').value;
  const language = document.getElementById('lang-filter').value;
  const type = document.getElementById('type-filter').value; 
  const status = document.getElementById('status-filter').value;
  const label = document.getElementById('label-filter').value;
  const search    = document.getElementById('search-filter').value.trim();
  await loadBooks(country, library, author, publisher, language, type, status, label, search);
}

// --- BOOK ADDITION MODAL HANDLING------------------------------------

// Populate options function in the modal
async function populateModalOptions(modal_name='', table_name='') {
  const select = document.getElementById(modal_name);
  select.innerHTML = '<option value="">Select '+table_name+'...</option>'; // Default option
  const { data, error } = await db.from(table_name).select('ID,Name');
  if (error) {
    console.error('Error fetching types:', error);
    return;
  }
  data.forEach(type => {
    const option = document.createElement('option');
    option.value = type.ID;
    option.textContent = type.Name;
    select.appendChild(option);
  });
}

// Show modal when Add Book button is clicked
document.getElementById('add-book-btn').addEventListener('click', async function() {
  await populateModalOptions('modal-publisher-select', 'Publisher' );
  await populateModalOptions('modal-type-select', 'Type' );
  await populateModalOptions('modal-language-select', 'Language' );
  await populateModalOptions('modal-status-select', 'Status' );
  await populateModalOptions('modal-library-select', 'LibraryLocation' );
  const modal = new bootstrap.Modal(document.getElementById('addBookModal'));
  modal.show();
});

// Handle Add Book form submission
document.getElementById('add-book-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const bookData = Object.fromEntries(formData.entries());

    // Map form fields to correct table columns
    bookData.Name = bookData.Name || null;
    bookData.PublisherId = bookData.Publisher || null;
    bookData.TypeId = bookData.Type || null;
    bookData.LanguageId = bookData.Language || null;
    bookData.StatusId = bookData.Status || 1;
    bookData.LibraryLocationId = bookData.LibraryLocation || 1;
    bookData.Isbn10 = bookData.ISBN10 || null; // Map to correct DB column
    bookData.Isbn13 = bookData.ISBN13 || null; // If needed

    // Remove old keys
    delete bookData.Publisher;
    delete bookData.Type;
    delete bookData.Language;
    delete bookData.Status;
    delete bookData.ISBN10;
    delete bookData.ISBN13;
    delete bookData.LibraryLocation;

    // Insert into Book table
    const { error } = await db.from('Book').insert([bookData]);
    const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
    modal.hide();

    if (error) {
      alert('Error adding book: ' + error.message);
    } else {
      await applyFilters(); // Refresh book list
      this.reset();
    }
});

// --- HANDLING OF BOOK LEVEL BUTTONS ------------------------------------

// Handle book delete action
document.getElementById('book-list').addEventListener('click', async function(e) {
  if (e.target.classList.contains('delete-btn')) {
    const bookId = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this book?')) {
      const { error } = await db.from('Book').delete().eq('ID', bookId);
      if (error) {
        alert('Error deleting book: ' + error.message);
      } else {
        await applyFilters();
      }
    }
  }
});

// Show modal when Add Author button is clicked
document.getElementById('book-list').addEventListener('click', async function(e) {
  if (e.target.classList.contains('add-author-btn')) {
    const bookId = e.target.getAttribute('data-id');
    // Show in modal title
    document.getElementById('addAuthorModalLabel').textContent = `Add Author (Book ID: ${bookId})`;
    // Add hidden input for BookId if not already there
    let hiddenBookId = document.querySelector('#add-author-form input[name="BookId"]');
    if (!hiddenBookId) {
      hiddenBookId = document.createElement('input');
      hiddenBookId.type = 'hidden';
      hiddenBookId.name = 'BookId';
      document.getElementById('add-author-form').appendChild(hiddenBookId);
    }
    hiddenBookId.value = bookId;
    // Populate author options in the select box
    await populateModalOptions('modal-author-select', 'Author');
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addAuthorModal'));
    modal.show();
  }
});

// Handle Add Author form submission
document.getElementById('add-author-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const bookAuthorData = Object.fromEntries(formData.entries());
  // Now bookAuthorData has: { BookId: "123", AuthorId: "456" }
  const { error } = await db.from('BookAuthor').insert([bookAuthorData]);
  const modal = bootstrap.Modal.getInstance(document.getElementById('addAuthorModal'));
  modal.hide();
  if (error) {
    alert(`Error adding author to Book ID: ${bookAuthorData.BookId} - ${error.message}`);
  } else {
    await applyFilters(); // Refresh list
    this.reset();
  }
});

// Show modal when Add Label button is clicked
document.getElementById('book-list').addEventListener('click', async function(e) {
  if (e.target.classList.contains('add-label-btn')) {
    const bookId = e.target.getAttribute('data-id');
    // Show in modal title
    document.getElementById('addLabelModalLabel').textContent = `Add Label (Book ID: ${bookId})`;
    // Add hidden input for BookId if not already there
    let hiddenBookId = document.querySelector('#add-label-form input[name="BookId"]');
    if (!hiddenBookId) {
      hiddenBookId = document.createElement('input');
      hiddenBookId.type = 'hidden';
      hiddenBookId.name = 'BookId';
      document.getElementById('add-label-form').appendChild(hiddenBookId);
    }
    hiddenBookId.value = bookId;
    // Populate label options in the select box
    await populateModalOptions('modal-label-select', 'Label');
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addLabelModal'));
    modal.show();
  }
});

// Handle Add Label form submission
document.getElementById('add-label-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const bookLabelData = Object.fromEntries(formData.entries());
  const { error } = await db.from('BookLabel').insert([bookLabelData]);
  const modal = bootstrap.Modal.getInstance(document.getElementById('addLabelModal'));
  modal.hide();
  if (error) {
    alert(`Error adding label to Book ID: ${bookLabelData.BookId} - ${error.message}`);
  } else {
    await applyFilters(); // Refresh list
    this.reset();
  }
});