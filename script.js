// Supabase configuration
const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// Create Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch and display books
async function loadBooks() {
  console.log("📡 Fetching from Supabase...");

  const { data, error } = await db
    .from('Book') // lowercase unless table was created with quotes
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
    const id = book.id ?? book.ID ?? '(no id)';
    const name = book.name ?? book.Name ?? '(no name)';
    li.textContent = `${id}: ${name}`;
    list.appendChild(li);
  });
}

loadBooks();