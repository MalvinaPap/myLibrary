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
          ${safe(book.ISBN) !== 'N/A' ? `<em>(ISBN:</em> ${book.ISBN})` : ''}<br>
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
        <div>
          <button class="btn btn-primary btn-sm edit-btn me-2" data-id="${book.ID}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${book.ID}">Delete</button>
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

// Apply filters 
async function applyFilters() {
  const country = document.getElementById('country-filter').value;
  const library = document.getElementById('library-filter').value;
  await loadBooks(country, library);
}