const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// --- Create Supabase client ---
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let allBooks = [];

// Populate country filter options
async function populateCountryFilter() {
  const select = document.getElementById('country-filter');
  const { data, error } = await db.from('country_view').select('Name');
  if (error) {
    console.error('Error fetching countries:', error);
    select.innerHTML = `<option value="">All</option>`;
    return;
  }
  select.innerHTML = `<option value="">All</option>` +
    data.map(c => `<option value="${c.Name}">${c.Name}</option>`).join('');
}

// Fetch and display books, optionally filtered 
async function loadBooks(Country = '', Library = '') {
  console.log("📡 Fetching books from Supabase...");
  let query = db.from('book_full_view').select('*');
  if (Country) query = query.eq('Country', Country);
  if (Library) query = query.eq('library', Library);
  const { data, error } = await query;
  const list = document.getElementById('book-list');
  if (error) {
    console.error('❌ Error fetching books:', error);
    list.innerHTML = `<li style="color:red">Error: ${error.message}</li>`;
    return;
  }
  allBooks = data || [];
  list.innerHTML = '';
  if (!data || data.length === 0) {
    list.innerHTML = '<li>No books found.</li>';
    return;
  }
  
  data.forEach(book => {
    const li = document.createElement('li');
    li.className = "list-group-item mb-3 p-3 shadow-sm rounded"; // Bootstrap styling

    const safe = (val) => val || 'N/A';
    let html = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>${safe(book.Title)}</strong> &nbsp;   
          ${safe(book.ISBN) !== 'N/A' ? `<em>(ISBN:</em> ${book.ISBN})` : ''} <br>
          ${safe(book.Creators) !== 'N/A' ? `<em>Creators:</em> ${book.Creators}<br>` : ''}
          ${safe(book.Publisher) !== 'N/A' ? `<em>Publisher:</em> ${book.Publisher}<br>` : ''}
          ${safe(book.Country) !== 'N/A' ? `<em>Country:</em> ${book.Country}<br>` : ''}
          ${safe(book.Language) !== 'N/A' ? `<em>Language:</em> ${book.Language}<br>` : ''}
          ${safe(book.Type) !== 'N/A' ? `<em>Type:</em> ${book.Type}<br>` : ''}
          ${safe(book.Group) !== 'N/A' ? `<em>Group:</em> ${book.Group}<br>` : ''}
          ${safe(book.Themes) !== 'N/A' ? `<em>Themes:</em> ${book.Themes}<br>` : ''}
          ${safe(book.DateAdded) !== 'N/A' ? `<em>Date Added:</em> ${book.DateAdded}<br>` : ''}
          ${safe(book.Status) !== 'N/A' ? `<em>Status:</em> ${book.Status}<br>` : ''}
        </div>
        <div class="d-flex flex-column align-items-end">
          <div>
            <button class="btn btn-primary btn-sm edit-btn me-1" data-id="${book.ID}">Edit</button>
            <button class="btn btn-warning btn-sm add-author-btn me-1" data-id="${book.ID}">+ Author</button>
            <button class="btn btn-info btn-sm add-theme-btn me-1" data-id="${book.ID}">+ Theme</button>
            <button class="btn btn-danger btn-sm delete-btn me-1" data-id="${book.ID}">Delete</button> 
          </div>
        </div>
      </div>
    `;
    li.innerHTML = html;
    list.appendChild(li);
  });
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await populateCountryFilter();
  await loadBooks();

  // Listen for both filters
  document.getElementById('country-filter').addEventListener('change', applyFilters);
  document.getElementById('library-filter').addEventListener('change', applyFilters);
});

// Apply filters 
async function applyFilters() {
  const country = document.getElementById('country-filter').value;
  const library = document.getElementById('library-filter').value;
  await loadBooks(country, library);
}

// --- BOOK ADDITION MODAL HANDLING------------------------------------

// Show modal when Add Book button is clicked
document.getElementById('add-book-btn').addEventListener('click', async function() {
  await populateOptions('modal-publisher-select', 'Publisher' );
  await populateOptions('modal-type-select', 'Type' );
  await populateOptions('modal-language-select', 'Language' );
  await populateOptions('modal-group-select', 'Group' );
  await populateOptions('modal-status-select', 'Status' );
  await populateOptions('modal-library-select', 'LibraryLocation' );
  const modal = new bootstrap.Modal(document.getElementById('addBookModal'));
  modal.show();
});

// Populate options function in the modal
async function populateOptions(modal_name='', table_name='') {
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
  bookData.GroupId = bookData.Group || null;
  bookData.StatusId = bookData.Status || 1;
  bookData.LibraryLocationId = bookData.LibraryLocation || 1;
  bookData.Isbn10 = bookData.ISBN10 || null; // Map to correct DB column
  bookData.Isbn13 = bookData.ISBN13 || null; // If needed

  // Remove old keys
  delete bookData.Publisher;
  delete bookData.Type;
  delete bookData.Language;
  delete bookData.Group;
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
    await populateOptions('modal-author-select', 'Author');
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