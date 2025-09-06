let allAuthors = [];

// --- LOAD AUTHORS ----------------------------------------------
async function loadAuthors(
  Continent = '', Country = '', Library = '', Type = '', 
  Search = '', SortField = 'created_at', SortOrder = 'desc',
  isAuthor = false, isTranslator = false
) {
  // Prepare filter params for the RPC
  const params = {
    p_continent: Continent || null,
    p_country: Country || null,
    p_library: Library || null,
    p_type: Array.isArray(Type) && Type.length ? Type : null
  };

  // Call the RPC function (replace 'get_authors' with your actual function name)
  const { data, error } = await db.rpc('get_filtered_authors', params);
  const list = document.getElementById('author-list');

  if (error) {
    console.error('❌ Error fetching authors:', error);
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  let filtered = data || [];
  filtered = filterAndSort(
    data,
    Search,
    SortField,
    SortOrder,
    ['Name', 'Country'] // fields to search
  );

  if (isAuthor) {
    filtered = filtered.filter(author => author.isAuthor === true );
  }
  if (isTranslator) {
    filtered = filtered.filter(author => author.isTranslator === true);
  }

  allAuthors = filtered;
  list.innerHTML = '';
  if (!filtered.length) return list.innerHTML = '<div>No authors found.</div>';

  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-3 fw-bold";
  totalCountEl.textContent = `👤 ${filtered.length} author${filtered.length > 1 ? 's' : ''} found`;
  list.appendChild(totalCountEl);

  const gridContainer = document.createElement('div');
  gridContainer.className = 'row g-3';
  const fragment = document.createDocumentFragment();

  filtered.forEach(author => {
    const col = document.createElement('div');
    col.className = 'col-12 col-lg-6';
    col.innerHTML = `
    <div class="card h-100 shadow-sm rounded">
      <div class="card-body p-3">
        <strong>${safe(author.Name)}</strong> 
        <span class="badge bg-info">${safe(author.Country)}</span>
        <span class="badge bg-warning">#Books: ${safe(author['#Books'])}</span>
        <span class="badge bg-warning">#Translations: ${safe(author['#Translations'])}</span>
      </div>
      <div class="d-flex mb-2">
        <div class="ms-auto">
          <button class="btn btn-primary btn-sm edit-btn me-2" data-id="${author.ID}">✎</button>
          <button class="btn btn-danger btn-sm delete-btn me-2" data-id="${author.ID}">🗑</button>
        </div>
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
    populateFilterOptions('country-filter', 'Country'),
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('type-filter', 'Type')
  ]);
  await loadAuthors();

  ['continent-filter','country-filter','library-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  $('#type-filter').on('change', applyFilters);
  document.getElementById('search-filter').addEventListener('input', applyFilters);
  document.getElementById('sort-field').addEventListener('change', applyFilters);
  document.getElementById('sort-order').addEventListener('change', applyFilters);
  document.getElementById('is-author-filter').addEventListener('change', applyFilters);
  document.getElementById('is-translator-filter').addEventListener('change', applyFilters);
});

async function applyFilters() {
  const getVal = id => document.getElementById(id).value.trim();
  const isAuthor = document.getElementById('is-author-filter')?.checked;
  const isTranslator = document.getElementById('is-translator-filter')?.checked;
  await loadAuthors(
    getVal('continent-filter'), 
    getVal('country-filter'), 
    getVal('library-filter'),
    ($('#type-filter').val() || []).filter(Boolean), 
    getVal('search-filter'),
    document.getElementById('sort-field').value,
    document.getElementById('sort-order').checked ? 'desc' : 'asc',
    isAuthor,
    isTranslator
  );
}

// --- ADD BOOK -------------------------------------------------

document.getElementById('add-author-btn').addEventListener('click', async () => {
  await Promise.all([
    populateModalOptions('modal-country-select', 'Country')
  ]);
  new bootstrap.Modal(document.getElementById('addAuthorModal')).show();
});

handleFormSubmit('add-author-form', 'Author', d => {
  return {
    Name: d.Name || null,
    CountryId: d.Country || null
  };
});

// --- EDIT / DELETE HANDLING--------------------------
document.addEventListener("click", async (e) => {
  const authorId = e.target.dataset.id;
  if (e.target.classList.contains("edit-btn")) {
    // Find the current author data
    const currentAuthor = allAuthors.find(author => author.ID == authorId);
    
    document.getElementById('editAuthorModalLabel').textContent = `Edit Author ID: ${authorId}`;
    document.getElementById('edit-author-id').value = authorId;
    
    // Populate country options first
    await populateModalOptions('edit-country-select', 'Country');
    
    // Set current values in the form
    if (currentAuthor) {
      document.querySelector('#edit-author-form input[name="Name"]').value = currentAuthor.Name || '';
      
      // Set the country dropdown value after a brief delay to ensure DOM is updated
      setTimeout(() => {
        if (currentAuthor.Country) {
          const countrySelect = document.getElementById('edit-country-select');
          const countryOptions = countrySelect.querySelectorAll('option');
          
          for (let option of countryOptions) {
            if (option.textContent === currentAuthor.Country) {
              countrySelect.value = option.value;
              break;
            }
          }
        }
      }, 10);
    }
    
    new bootstrap.Modal(document.getElementById('editAuthorModal')).show();
  }
  if (e.target.classList.contains('delete-btn')) {
    if (confirm('Are you sure you want to delete this author?')) {
      const { error } = await db.from('Author').delete().eq('ID', authorId);
      if (error) alert('Error deleting author: ' + error.message);
      else await applyFilters();
    }
  }
});

// --- EDIT FORM -----------------------------------------------
document.getElementById('edit-author-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this).entries());
  const updateData = {};
  if (data.Name) updateData.Name = data.Name;
  if (data.Country) updateData.CountryId = parseInt(data.Country, 10);
  if (!Object.keys(updateData).length) return;
  const { error } = await db.from('Author').update(updateData).eq('ID', parseInt(data.authorId, 10));
  bootstrap.Modal.getInstance(document.getElementById('editAuthorModal')).hide();
  if (error) alert(`❌ Error editing Author ID ${data.authorId}: ${error.message}`);
  else { await applyFilters(); this.reset(); }
});






