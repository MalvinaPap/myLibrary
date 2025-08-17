let allCountries = [];

// Fetch and display countries in a table, optionally filtered 
async function loadCountries(Continent = '', Status='', Search = '') {
  console.log("📡 Fetching countries from Supabase...");
  let query = db.from('country_full_view').select('*');
  if (Continent) query = query.ilike('Continent', `%${Continent}%`);
  if (Status) query = query.eq('Status', Status);
  if (Search) query = query.or(`Country.ilike.%${Search}%, AltGroup.ilike.%${Search}%`);
  const { data, error } = await query;
  const list = document.getElementById('country-list');
  if (error) {
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }
  list.innerHTML = '';
  if (!data || data.length === 0) {
    list.innerHTML = '<div>No countries found.</div>';
    return;
  }
  const safe = (val) => val ?? '';
  // Show total count before rendering the list
  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-2 fw-bold";
  totalCountEl.textContent = `🌎 ${data.length} ${data.length > 1 ? 'countries' : 'country'} found`;
  list.appendChild(totalCountEl);
  // Create list items
  data.forEach(country => {
    const li = document.createElement('li');
    li.className = 'list-group-item mb-2'; // Bootstrap styling + spacing
    let statusClass = 'bg-secondary'; // default
    switch (country.Status?.toLowerCase()) {
        case 'read': statusClass = 'bg-success'; break;
        case 'owned': statusClass = 'bg-warning'; break;
        case 'to buy': statusClass = 'bg-danger'; break;
    }
    let suggestion =`Suggested Author: <span class="badge bg-info" style="font-size: 0.75rem;">${safe(country.SuggestedAuthor)}</span>`;
    let altGroup = `<span class="badge bg-warning" style="font-size: 0.75rem;">--former: ${safe(country.AltGroup)}</span>`;
    if (!country.SuggestedAuthor) {
      suggestion = '';
    }
    if (!country.AltGroup) {
      altGroup = '';
    }
    li.innerHTML = `
        <strong>${safe(country.Country)}</strong> (${safe(country.Continent)})<br>
        <div class="d-flex align-items-center flex-wrap gap-2 mt-1">
            <span class="badge ${statusClass}" style="font-size: 0.75rem;">${safe(country.Status)}</span>
            Population Share: <span class="badge bg-info" style="font-size: 0.75rem;">${safe(country.PopulationShare)}%</span>
            ${suggestion} ${altGroup}
            <button class="btn btn-primary btn-sm ms-auto edit-country-btn" data-id=${country.ID}>Edit</button>
        </div>
    `;
    list.appendChild(li);
  });
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('status-filter', 'Status')
  ]);
  await loadCountries();
  // Listen for Dropdown filters
  ['continent-filter','status-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  // Listen for Search filter (run on typing, debounce optional)
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});


// Apply filters 
async function applyFilters() {
  const continent = document.getElementById('continent-filter').value
  const status = document.getElementById('status-filter').value
  const search    = document.getElementById('search-filter').value.trim();
  await loadCountries(continent, status, search);
}



// --- HANDLING OF COUNTRY LEVEL BUTTONS ------------------------------------

// Show modal when Edit button is clicked
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-country-btn")) {
    const countryId = e.target.getAttribute('data-id');
    document.getElementById('editCountryModalLabel').textContent = `Edit Country ID: ${countryId}`;
    document.getElementById('edit-country-id').value = countryId;
    const modal = new bootstrap.Modal(document.getElementById('editCountryModal'));
    modal.show();
  }
});

// Handle Edit Country form submission
document.getElementById('edit-country-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const countryData = Object.fromEntries(formData.entries());
  // Build updateData dynamically: only include filled fields
  const updateData = {};
  if (countryData.Name) updateData.ToBuy = countryData.Name;

  const countryId = parseInt(countryData.countryId, 10);

  if (Object.keys(updateData).length === 0) {
    console.log('No fields to update.');
    return; // nothing to update
  }
  // Perform update
  const { error } = await db
    .from('Country')
    .update(updateData)
    .eq('ID', countryId);
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('editCountryModal'));
  modal.hide();

  if (error) {
    alert(`❌ Error editing Country ID ${countryId}: ${error.message}`);
  } else {
    await applyFilters(); // Refresh list
    this.reset();
  }
});


// ------- Challenge Stats Static Table ------------

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
