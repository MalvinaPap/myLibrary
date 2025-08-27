let allCountries = [];

// --- LOAD COUNTRIES ----------------------------------------------
function getSelectedTypes() {
  const select = document.getElementById('type-filter');
  const selected = Array.from(select.selectedOptions)
    .map(opt => opt.value)
    .filter(v => v);
  return selected.length > 0 ? selected : null;
}

async function loadCountries() {
  // Call the Postgres function
  const { data, error } = await db.rpc('get_filtered_countries', {
    p_library: document.getElementById('library-filter').value || null,
    p_continent: document.getElementById('continent-filter').value || null,
    p_status: document.getElementById('status-filter').value || null,
    p_type: getSelectedTypes()
  });

  const Search = document.getElementById('search-filter').value.trim();
  const list = document.getElementById('country-list');
  
  if (error) {
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<div>No authors found.</div>';
    return;
  }

  // 🔎 Apply frontend search filter (case-insensitive)
  let filtered = data;
  if (Search && Search.trim() !== '') {
    const searchLower = Search.toLowerCase();
    filtered = data.filter(country =>
      (country.Name && country.Name.toLowerCase().includes(searchLower)) ||
      (country.AltGroup && country.AltGroup.toLowerCase().includes(searchLower)) 
    );
  }
  list.innerHTML = '';

  // Show total count before rendering the list
  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-2 fw-bold";
  totalCountEl.textContent = `🌎 ${filtered.length} ${filtered.length > 1 ? 'countries' : 'country'} found`;
  list.appendChild(totalCountEl);
  
  // Create the parent <ul>
  const ul = document.createElement('ul');
  ul.className = 'list-group element-list';

  // Create list items
  filtered.forEach(country => {
    const li = document.createElement('li');
    li.className = 'list-group-item mb-2 p-3 rounded-3 shadow-sm';

    // Pick badge color based on Status
    let statusClass = "bg-secondary";
    if (country.Status === "Read") statusClass = "bg-success";
    else if (country.Status === "Owned") statusClass = "bg-warning";
    else if (country.Status === "To Buy") statusClass = "bg-danger";

    li.innerHTML = `
      <strong>${safe(country.Name)}</strong> (${safe(country.Continent)}) - 
      <span class="badge ${statusClass}">${country.Status}</span>
      <span class="badge bg-warning">#Books: ${safe(country['#Books'])}</span>
      <span class="badge bg-warning">#Authors: ${safe(country['#Authors'])}</span>
    `;
    ul.appendChild(li);
  });
  list.appendChild(ul);
}

// --- FILTERS --------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  $('#type-filter').select2({ placeholder: "Select Type(s)", allowClear: true, width: '100%'});
  await Promise.all([
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('type-filter', 'Type'),
    populateFilterOptions('status-filter', 'Status')
  ]);
  await loadCountries();

  ['library-filter','continent-filter','status-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  $('#type-filter').on('change', applyFilters);
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});


// Apply filters 
async function applyFilters() {
  await loadCountries();
}


// --- HANDLING OF COUNTRY LEVEL BUTTONS ------------------------------------

// ------- CHALLENGE STATS STATIC TABLE ------------

// Fetch and display challenge stats in a table
async function loadStats() {
  let query = db.from('challenge_stats_view').select('*');
  const { data, error } = await query;
  const list = document.getElementById('stats-list');
  if (error) {
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }
  const safe = (val) => val ?? 'N/A';
  const table = document.createElement('table');
  table.className = 'table table-striped table-hover';
  table.innerHTML = `
    <thead class="table-dark">
      <tr>
        <th>Continent</th>
        <th>Total</th>
        <th>Read</th>
        <th>%</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  data.forEach(stats => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${safe(stats.Continent)}</td>
      <td>${safe(stats.Countries)}</td>
      <td>${safe(stats.CountriesRead)}</td>
      <td>${safe(stats.Percentage)}</td>
    `;
    tbody.appendChild(tr);
  });
  list.innerHTML = '';
  list.appendChild(table);
}


// Load Stats on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
});
