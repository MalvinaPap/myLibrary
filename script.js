// Supabase configuration
const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// Create Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch and display books
async function loadBooks() {
  console.log("📡 Fetching from Supabase view...");

  const { data, error } = await db
    .from('book_full_view') // query the view instead of the table
    .select('*');

  const list = document.getElementById('book-list');

  if (error) {
    console.error('❌ Error fetching books:', error);
    list.innerHTML = `<li style="color:red">Error: ${error.message}</li>`;
    return;
  }

  list.innerHTML = '';

  if (!data || data.length === 0) {
    list.innerHTML = '<li>No books found.</li>';
    return;
  }

  data.forEach(book => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${book.Title || '(no title)'}</strong><br>
      <em>Creators:</em> ${book.Creators || 'N/A'}<br>
      <em>ISBN:</em> ${book.ISBN || 'N/A'}<br>
      <em>Publisher:</em> ${book.Publisher || 'N/A'}<br>
      <em>Country:</em> ${book.Country || 'N/A'}<br>
      <em>Language:</em> ${book.Language || 'N/A'}<br>
      <em>Type:</em> ${book.Type || 'N/A'}<br>
      <em>Themes:</em> ${book.Themes || 'N/A'}<br>
      <em>Date Added:</em> ${new Date(book['Date Added']).toLocaleDateString() || 'N/A'}<br>
      <em>Status:</em> ${book.Status || 'N/A'}
    `;
    list.appendChild(li);
  });
}

loadBooks();
