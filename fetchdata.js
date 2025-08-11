const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// --- Create Supabase client ---
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allBooks = [];

async function populateCountryFilter() {
  const select = document.getElementById('country-filter');
  const { data, error } = await db.from('Country').select('Name');
  if (error) {
    console.error('Error fetching countries:', error);
    select.innerHTML = `<option value="">All</option>`;
    return;
  }
  select.innerHTML = `<option value="">All</option>` +
    data.map(c => `<option value="${c.Name}">${c.Name}</option>`).join('');
}


// Fetch and display books, optionally filtered by country
async function loadBooks(Country = '') {
  console.log("📡 Fetching books from Supabase...");
  let query = db.from('book_full_view').select('*');
  if (Country) {
    query = query.eq('Country', Country);
  }
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
    const safe = (val) => val || 'N/A';
    const dateAdded = book.date_added
      ? new Date(book.date_added).toLocaleDateString()
      : 'N/A';
    li.innerHTML = `
      <strong>${safe(book.Title)}</strong><br>
      <em>Creators:</em> ${safe(book.Creators)}<br>
      <em>ISBN:</em> ${safe(book.ISBN)}<br>
      <em>Publisher:</em> ${safe(book.Publisher)}<br>
      <em>Country:</em> ${safe(book.Country)}<br>
      <em>Language:</em> ${safe(book.Language)}<br>
      <em>Type:</em> ${safe(book.Type)}<br>
      <em>Themes:</em> ${safe(book.Themes)}<br>
      <em>Date Added:</em> ${safe(book.DateAdded)}<br>
      <em>Status:</em> ${safe(book.Status)} <br>
      <em>Library:</em> ${safe(book.library)}
    `;
    list.appendChild(li);
  });
}

// Listen for country filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await populateCountryFilter();
  await loadBooks();
  document.getElementById('country-filter').addEventListener('change', async function() {
    await loadBooks(this.value);
  });
});