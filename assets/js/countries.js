let allCountries = [];

async function loadCountries(Library = null, Continent= null, Status = null, Type = null, Search = '') {
  // Call the Postgres function
  const { data, error } = await db.rpc('get_filtered_countries', {
    p_library: Library || null,
    p_continent: Continent || null,
    p_status: Status || null,
    p_type: Type || null
  });
  
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

  const safe = (val) => val ?? '';

  // Show total count before rendering the list
  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-2 fw-bold";
  totalCountEl.textContent = `🌎 ${filtered.length} ${filtered.length > 1 ? 'countries' : 'country'} found`;
  list.appendChild(totalCountEl);

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
      <strong>${safe(country.Name)}</strong> (${safe(country.Continent)})<br>
      <div class="d-flex align-items-center flex-wrap gap-2 mt-1">
        Status: <span class="badge ${statusClass}">${country.Status}</span>
        ${safe(country.SuggestedAuthor) !== '' ? `Suggested Author: <span class="badge bg-info">${safe(country.SuggestedAuthor)}</span>` : ''}
        <span class="badge bg-warning">#Books: ${safe(country['#Books'])}</span>
        <span class="badge bg-warning">#Authors: ${safe(country['#Authors'])}</span>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-primary btn-sm edit-btn" data-id=${country.ID}>Edit</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('type-filter', 'Type'),
    populateFilterOptions('status-filter', 'Status')
  ]);
  await loadCountries();
  // Listen for Dropdown filters
  ['library-filter','continent-filter','type-filter','status-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  // Listen for Search filter (run on typing, debounce optional)
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});


// Apply filters 
async function applyFilters() {
  const continent = document.getElementById('continent-filter').value
  const library = document.getElementById('library-filter').value
  const type = document.getElementById('type-filter').value
  const status = document.getElementById('status-filter').value
  const search    = document.getElementById('search-filter').value.trim();
  await loadCountries(library, continent, status, type, search);
}


// --- HANDLING OF COUNTRY LEVEL BUTTONS ------------------------------------

// Show modal when Edit button is clicked
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-btn")) {
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
