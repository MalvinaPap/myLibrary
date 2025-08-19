let allAuthors = [];

async function loadAuthors(Continent= null, Country = null, Type = null, Library = null, Search = '') {
  // Call the Postgres function
  const { data, error } = await db.rpc('get_filtered_authors', {
    p_library: Library || null,
    p_type: Type || null,
    p_country: Country || null,
    p_continent: Continent || null
  });
  
  const list = document.getElementById('author-list');
  
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
    filtered = data.filter(author =>
      (author.Name && author.Name.toLowerCase().includes(searchLower)) ||
      (author.Country && author.Country.toLowerCase().includes(searchLower)) 
    );
  }
  list.innerHTML = '';

  const safe = (val) => val ?? '';

  // Show total count before rendering the list
  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-2 fw-bold";
  totalCountEl.textContent = `👤 ${filtered.length} ${filtered.length > 1 ? 'authors' : 'author'} found`;
  list.appendChild(totalCountEl);

  // Create list items
  filtered.forEach(author => {
    const li = document.createElement('li');
    li.className = 'list-group-item mb-2'; 

    li.innerHTML = `
      <strong>${safe(author.Name)}</strong> from <em>${safe(author.Country)}</em><br>
      <div class="d-flex align-items-center flex-wrap gap-2 mt-1">
        <span class="badge bg-info" style="font-size: 0.75rem;">Books: ${safe(author['#Books'])}</span>
        <span class="badge bg-secondary" style="font-size: 0.75rem;">Created: ${author.created_at}</span>
        <button class="btn btn-primary btn-sm ms-auto edit-author-btn" data-id=${author.ID}>Edit</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Listen for filter changes
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    populateFilterOptions('country-filter', 'Country'),
    populateFilterOptions('type-filter', 'Type'),
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('continent-filter', 'Continent')
  ]);
  await loadAuthors();
  // Listen for Dropdown filters
  ['continent-filter','country-filter','type-filter','library-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  // Listen for Search filter (run on typing, debounce optional)
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});


// Apply filters 
async function applyFilters() {
  const country = document.getElementById('country-filter').value
  const continent = document.getElementById('continent-filter').value
  const type = document.getElementById('type-filter').value
  const library = document.getElementById('library-filter').value
  const search    = document.getElementById('search-filter').value.trim();
  await loadAuthors(continent, country, type, library, search);
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




