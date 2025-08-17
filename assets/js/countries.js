let allCountries = [];

// Fetch and display countries in a table, optionally filtered 
async function loadCountries(Continent = '', Search = '') {
  console.log("📡 Fetching countries from Supabase...");
  
  let query = db.from('country_full_view').select('*');
  if (Continent) query = query.ilike('Continent', `%${Continent}%`);
  if (Search) query = query.ilike('Country', `%${Search}%`);

  const { data, error } = await query;
  const list = document.getElementById('country-list');
  
  if (error) {
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<div>No countries found.</div>';
    return;
  }
  const safe = (val) => val ?? 'N/A';
  const table = document.createElement('table');
  table.className = 'table table-striped table-hover';
  table.innerHTML = `
    <thead class="table-dark">
      <tr>
        <th>Continent</th>
        <th>Country</th>
        <th>Population Share</th>
        <th>Suggested Author</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  data.forEach(country => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${safe(country.Continent)}</td>
      <td>${safe(country.Country)}</td>
      <td>${safe(country.PopulationShare)}</td>
      <td>${safe(country.SuggestedAuthor)}</td>
      <td>${safe(country.Status)}</td>
    `;
    tbody.appendChild(tr);
  });

  list.innerHTML = '';
  list.appendChild(table);
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    populateFilterOptions('continent-filter', 'Continent')
  ]);
  await loadCountries();
  // Listen for Dropdown filters
  ['continent-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  // Listen for Search filter (run on typing, debounce optional)
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});

// Apply filters 
async function applyFilters() {
  const continent = document.getElementById('continent-filter').value
  const search    = document.getElementById('search-filter').value.trim();
  await loadCountries(continent, search);
}



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
        <th>Countries</th>
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
