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
  if (Search) query = query.or(`Title.ilike.%${Search}%, Isbn13.ilike.%${Search}%, Isbn10.ilike.%${Search}%, Creators.ilike.%${Search}%`);

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
  const fragment = document.createDocumentFragment();
  
  data.forEach(book => {
    const col = document.createElement('div');
    // Responsive: 1 col on xs, 2 cols on sm, 3 cols on lg+
    col.className = 'col-12 col-sm-6 col-lg-4';

    const makeEditableBadges = (text, bookId, type) => {
      if (safe(text) === 'N/A') {
        // If no badges, just show the + button
        return `<span type="button" class="badge bg-success btn-sm add-${type}-btn" data-id="${bookId}">+</span>`;
      }
      // Split text into badges
      const badgesHtml = text
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => {
          return `<span class="badge bg-secondary me-1 mb-1" style="font-size: 0.75rem;">
                    ${name}
                    <button type="button" 
                        class="badge-delete-btn ms-1"
                        data-book-id="${bookId}" 
                        data-type="${type}" 
                        data-name="${name}">×</button>
                  </span>`;
        })
        .join('');
      // Add a single + button at the end
      const addButtonHtml = `<span type="button" class="badge bg-success btn-sm add-${type}-btn" data-id="${bookId}">+</span>`;
      return badgesHtml + addButtonHtml;
    };

    const makeBadges = (text) =>
    safe(text) !== 'N/A'
      ? text.split(',')
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => {
            return `<span class="badge bg-info me-1 mb-1" style="font-size: 0.75rem;">
                      ${name}
                    </span>`;
          })
          .join('')
      : '';
    
    const creatorsBadges = makeEditableBadges(book.Creators, book.ID, 'author');
    const countryBadges = makeBadges(book.Country);
    const labelsBadges = makeEditableBadges(book.Labels, book.ID, 'label');
    

    col.innerHTML = `
    <div class="card h-100 shadow-sm rounded">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="card-title mb-0">${safe(book.Title)}</h5>
        </div>
        ${safe(book.Isbn13) !== 'N/A' ? `<p class="mb-1"><em>ISBN-13:</em> ${book.Isbn13}</p>` : ''}
        ${safe(book.Isbn10) !== 'N/A' ? `<p class="mb-1"><em>ISBN-10:</em> ${book.Isbn10}</p>` : ''}
        ${creatorsBadges ? `<p class="mb-1"><em>Creator:</em> ${creatorsBadges}</p>` : ''}
        ${safe(book.Publisher) !== 'N/A' ? `<p class="mb-1"><em>Publisher:</em> ${book.Publisher}</p>` : ''}
        ${countryBadges ? `<p class="mb-1"><em>Country:</em> ${countryBadges}</p>` : ''}
        ${safe(book.Language) !== 'N/A' ? `<p class="mb-1"><em>Language:</em> ${book.Language}</p>` : ''}
        ${safe(book.Type) !== 'N/A' ? `<p class="mb-1"><em>Type:</em> ${book.Type}</p>` : ''}
        ${labelsBadges ? `<p class="mb-1"><em>Labels:</em> ${labelsBadges}</p>` : ''}
        ${safe(book.Status) !== 'N/A' ? `<p class="mb-1"><em>Status:</em> ${book.Status}</p>` : ''}
        ${safe(book.DateAdded) !== 'N/A' ? `<p class="mb-1"><em>Date Added:</em> ${book.DateAdded}</p>` : ''}
      </div>
      <div class="d-flex mb-2">
          <div class="ms-auto">
            <button class="btn btn-primary btn-sm edit-btn me-2" data-id="${book.ID}">Edit</button>
            <button class="btn btn-danger btn-sm delete-btn me-2" data-id="${book.ID}">Delete</button>
          </div>
        </div>
    </div>
    `;
    fragment.appendChild(col);
  });
  list.innerHTML = '';
  list.appendChild(fragment);
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('country-filter', 'Country'),
    populateFilterOptions('author-filter', 'Author'),
    populateFilterOptions('publisher-filter', 'Publisher'),
    populateFilterOptions('lang-filter', 'Language'),
    populateFilterOptions('type-filter', 'Type'),
    populateFilterOptions('status-filter', 'Status'),
    populateFilterOptions('label-filter', 'Label')
  ]);
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

// Show modal when Edit button is clicked
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const bookId = e.target.getAttribute('data-id');
    document.getElementById('editBookModalLabel').textContent = `Edit Book ID: ${bookId}`;
    // Set hidden bookId input
    document.getElementById('edit-book-id').value = bookId;
    await populateModalOptions('edit-status-select', 'Status');
    await populateModalOptions('edit-library-select', 'LibraryLocation');
    const modal = new bootstrap.Modal(document.getElementById('editBookModal'));
    modal.show();
  }
});

// Handle Edit Book form submission
document.getElementById('edit-book-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const bookData = Object.fromEntries(formData.entries());
  // Build updateData dynamically: only include filled fields
  const updateData = {};
  if (bookData.Name) updateData.Name = bookData.Name;
  if (bookData.Status) updateData.StatusId = parseInt(bookData.Status, 10);
  if (bookData.ISBN10) updateData.Isbn10 = bookData.ISBN10;
  if (bookData.ISBN13) updateData.Isbn13 = bookData.ISBN13;
  if (bookData.Library) updateData.LibraryLocationId = bookData.Library;

  const bookId = parseInt(bookData.bookId, 10);

  if (Object.keys(updateData).length === 0) {
    console.log('No fields to update.');
    return; // nothing to update
  }
  // Perform update
  const { error } = await db
    .from('Book')
    .update(updateData)
    .eq('ID', bookId);
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('editBookModal'));
  modal.hide();

  if (error) {
    alert(`❌ Error editing Book ID ${bookId}: ${error.message}`);
  } else {
    await applyFilters(); // Refresh list
    this.reset();
  }
});


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

// Handle badge deletion for labels and authors
document.getElementById('book-list').addEventListener('click', async function (e) {
  if (e.target.classList.contains('badge-delete-btn')) {
    const bookId = e.target.dataset.bookId;
    const type = e.target.dataset.type;
    const name = e.target.dataset.name;

    if (!confirm(`Remove "${name}" from this book?`)) return;
    let error;
    if (type === 'label') {
      const { data: labelData, error: lookupError } = await db
        .from('Label')
        .select('ID')
        .eq('Name', name)
        .maybeSingle();
      if (lookupError || !labelData) {
        alert(`Could not find label "${name}"`);
        return;
      }
      const { error: delError } = await db
        .from('BookLabel')
        .delete()
        .eq('BookId', bookId)
        .eq('LabelId', labelData.ID);
      error = delError;
    }

    if (type === 'author') {
      const { data: authorData, error: lookupError } = await db
        .from('Author')
        .select('ID')
        .eq('Name', name)
        .maybeSingle();
      if (lookupError || !authorData) {
        alert(`Could not find author "${name}"`);
        return;
      }
      console.log(`Removing author ${authorData.ID} from book ${bookId}`);
      const { error: delError } = await db
        .from('BookAuthor')
        .delete()
        .eq('BookId', bookId)
        .eq('AuthorId', authorData.ID);
      error = delError;
    }
    if (error) {
      alert(`Error removing ${type}: ${error.message}`);
    } else {
      await applyFilters(); // refresh list
    }
  }
});