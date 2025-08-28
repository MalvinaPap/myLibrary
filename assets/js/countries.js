let allCountries = [];
// --- HELPERS ----------------------------------------------

// Handle form submission for adding new entities
const handleFormSubmit = (formId, table, transform = d => d) => {
  document.getElementById(formId).addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = transform(Object.fromEntries(new FormData(this).entries()));
    const { error } = await db.from(table).insert([data]);
    bootstrap.Modal.getInstance(this.closest('.modal')).hide();
    if (error) alert(`❌ Error: ${error.message}`);
    else { await applyFilters(); this.reset(); }
  });
};

// Show modal with pre-filled data
async function showModal(modalId, formId, labelId, title, selectField, table, countryId) {
  document.getElementById(labelId).textContent = title;
  let hidden = document.querySelector(`#${formId} input[name="CountryId"]`);
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'CountryId';
    document.getElementById(formId).appendChild(hidden);
  }
  hidden.value = countryId;
  if (selectField) await populateModalOptions(selectField, table);
  new bootstrap.Modal(document.getElementById(modalId)).show();
}

// --- LOAD AUTHORS ----------------------------------------------
async function loadCountries(
  Continent = '', Library = '', Type = '', 
  Search = '', SortField = 'Name', SortOrder = 'asc'
) {
  // Prepare filter params for the RPC
  const params = {
    p_continent: Continent || null,
    p_library: Library || null,
    p_type: Array.isArray(Type) && Type.length ? Type : null
  };

  // Call the RPC function (replace 'get_countries' with your actual function name)
  const { data, error } = await db.rpc('get_filtered_countries', params);
  const list = document.getElementById('country-list');

  if (error) {
    console.error('❌ Error fetching countries:', error);
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  let filtered = data || [];

  // --- Client-side search ---
  if (Search && Search.trim() !== '') {
    const s = Search.toLowerCase();
    filtered = filtered.filter(country =>
      (country.Name && country.Name.toLowerCase().includes(s)) ||
      (country.AltGroup && country.AltGroup.toLowerCase().includes(s))
    );
  }

  // --- Client-side sort ---
  if (SortField) {
    filtered = filtered.sort((a, b) => {
      let aVal = a[SortField] || '';
      let bVal = b[SortField] || '';
      // If sorting by created_at or other date, convert to Date
      if (aVal < bVal) return SortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return SortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  allCountries = filtered;
  list.innerHTML = '';
  if (!filtered.length) return list.innerHTML = '<div>No countries found.</div>';

  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-3 fw-bold";
  totalCountEl.textContent = `🌍 ${filtered.length} countr${filtered.length > 1 ? 'ies' : 'y'} found`;
  list.appendChild(totalCountEl);

  const gridContainer = document.createElement('div');
  gridContainer.className = 'row g-3';
  const fragment = document.createDocumentFragment();

  filtered.forEach(country => {
    const col = document.createElement('div');
    col.className = 'col-12';

    // Pick badge color based on Status
    let statusClass = "bg-secondary";
    if (country.Status === "Read") statusClass = "bg-success";
    else if (country.Status === "Owned") statusClass = "bg-secondary";
    else if (country.Status === "To Buy") statusClass = "bg-danger";

    col.innerHTML = `
    <div class="card h-100 shadow-sm rounded">
      <div class="card-body p-3">
        <strong>${safe(country.Name)}</strong> (${safe(country.Continent)})
        <span class="badge ${statusClass}">${country.Status}</span>
        <span class="badge bg-warning">#Books: ${safe(country['#Books'])}</span>
        <span class="badge bg-warning">#Authors: ${safe(country['#Authors'])}</span>
      </div>
    </div>`;
    fragment.appendChild(col);
  });

  gridContainer.appendChild(fragment);
  list.appendChild(gridContainer);
}

// --- FILTERS --------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  $('#type-filter').select2({ placeholder: "Select Type(s)", allowClear: true, width: '100%'});

  await Promise.all([
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('type-filter', 'Type')
  ]);
  await loadCountries();

  ['continent-filter','library-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  $('#type-filter').on('change', applyFilters);
  document.getElementById('search-filter').addEventListener('input', applyFilters);
  document.getElementById('sort-field').addEventListener('change', applyFilters);
  document.getElementById('sort-order').addEventListener('change', applyFilters);
});

async function applyFilters() {
  const getVal = id => document.getElementById(id).value.trim();
  await loadCountries(
    getVal('continent-filter'), 
    getVal('library-filter'),
    ($('#type-filter').val() || []).filter(Boolean), 
    getVal('search-filter'),
    document.getElementById('sort-field').value,
    document.getElementById('sort-order').checked ? 'desc' : 'asc'
  );
}

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
