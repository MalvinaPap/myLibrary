// Database connection details
const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// --- Create Supabase client ---
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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


// Populate modal options
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

