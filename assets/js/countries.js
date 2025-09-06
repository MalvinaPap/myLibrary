let allCountries = [];

// --- LOAD COUNTRIES ----------------------------------------------
async function loadCountries(
  Continent = '', Library = '', Status = '', Type = '', 
  Search = '', SortField = 'PopulationShare', SortOrder = 'desc'
) {

  const params = {
    p_continent: Continent || null,
    p_library: Library || null,
    p_status: Status || null,
    p_type: Array.isArray(Type) && Type.length ? Type : null
  };

  const { data, error } = await db.rpc('get_filtered_countries', params);
  const list = document.getElementById('country-list');

  if (error) {
    console.error('❌ Error fetching countries:', error);
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  let filtered = data || [];
  filtered = filterAndSort(
    data,
    Search,
    SortField,
    SortOrder,
    ['Name', 'AltGroup'] // fields to search
  );

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

// --- LOAD CHALLENGE STATS ----------------------------
async function loadStats(Continent = '', Library = '', Type = '') 
{
  const params = {
    p_continent: Continent || null,
    p_library: Library || null,
    p_type: Array.isArray(Type) && Type.length ? Type : null
  };

  const { data, error } = await db.rpc('get_filtered_stats', params);
  const list = document.getElementById('stats-list');

  if (error) {
    console.error('❌ Error fetching stats:', error);
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  let filtered = data || [];
  allCountries = filtered;
  list.innerHTML = '';

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



// --- FILTERS --------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  $('#type-filter').select2({ placeholder: "Select Type(s)", allowClear: true, width: '100%'});

  await Promise.all([
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('type-filter', 'Type')
  ]);
  await loadCountries();
  await loadStats();

  ['continent-filter','library-filter','status-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
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
    getVal('status-filter'),
    ($('#type-filter').val() || []).filter(Boolean), 
    getVal('search-filter'),
    document.getElementById('sort-field').value,
    document.getElementById('sort-order').checked ? 'desc' : 'asc'
  );
  await loadStats(
    getVal('continent-filter'), 
    getVal('library-filter'),
    ($('#type-filter').val() || []).filter(Boolean)
  );
}


