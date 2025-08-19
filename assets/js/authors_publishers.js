let allAuthors = [];
let allPublishers = [];

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
    li.className = 'list-group-item mb-2 p-3 rounded-3 shadow-sm';
    li.innerHTML = `
      <strong>${safe(author.Name)}</strong><br>
      <div class="d-flex align-items-center flex-wrap gap-2 mt-1">
        ${safe(author.Country) !== '' ? `Country: <span class="badge bg-info" style="font-size: 0.75rem;">${safe(author.Country)}</span>` : ''}
        <span class="badge bg-warning" style="font-size: 0.75rem;">#Books: ${safe(author['#Books'])}</span>
        </div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-primary btn-sm edit-author-btn" data-id=${author.ID}>Edit</button>
        <button class="btn btn-danger btn-sm delete-author-btn" data-id=${author.ID}>Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}


async function loadPublishers(Continent= null, Country = null, Type = null, Library = null, Search = '') {
  // Call the Postgres function
  const { data, error } = await db.rpc('get_filtered_publishers', {
    p_library: Library || null,
    p_type: Type || null,
    p_country: Country || null,
    p_continent: Continent || null
  });
  const list = document.getElementById('publisher-list');
  if (error) {
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<div>No publishers found.</div>';
    return;
  }
  // 🔎 Apply frontend search filter (case-insensitive)
  let filtered = data;
  if (Search && Search.trim() !== '') {
    const searchLower = Search.toLowerCase();
    filtered = data.filter(publisher =>
      (publisher.Name && publisher.Name.toLowerCase().includes(searchLower)) ||
      (publisher.Country && publisher.Country.toLowerCase().includes(searchLower)) 
    );
  }
  list.innerHTML = '';
  const safe = (val) => val ?? '';
  // Show total count before rendering the list
  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-2 fw-bold";
  totalCountEl.textContent = `📚 ${filtered.length} ${filtered.length > 1 ? 'publishers' : 'publisher'} found`;
  list.appendChild(totalCountEl);
  // Create list items
  filtered.forEach(publisher => {
    const li = document.createElement('li');
    li.className = 'list-group-item mb-2 p-3 rounded-3 shadow-sm';
    li.innerHTML = `
      <strong>${safe(publisher.Name)}</strong><br>
      <div class="d-flex align-items-center flex-wrap gap-2 mt-1">
        ${safe(publisher.Country) !== '' ? `Country: <span class="badge bg-info" style="font-size: 0.75rem;">${safe(publisher.Country)}</span>` : ''}
        <span class="badge bg-warning" style="font-size: 0.75rem;">#Books: ${safe(publisher['#Books'])}</span>
        </div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-primary btn-sm edit-publisher-btn" data-id=${publisher.ID}>Edit</button>
        <button class="btn btn-danger btn-sm delete-publisher-btn" data-id=${publisher.ID}>Delete</button>
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
  await loadPublishers();
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
  await loadPublishers(continent, country, type, library, search);
}


// --- ADDITION MODAL HANDLING------------------------------------

// Show modal when Add Author button is clicked
document.getElementById('add-author-btn').addEventListener('click', async function() {
  await populateModalOptions('modal-country-select', 'Country' );
  const modal = new bootstrap.Modal(document.getElementById('addAuthorModal'));
  modal.show();
});

// Handle Add Author form submission
document.getElementById('add-author-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const authorData = Object.fromEntries(formData.entries());
    // Map form fields to correct table columns
    authorData.CountryId = authorData.Country || null;
    // Remove old keys
    delete authorData.Country;
    // Insert into Book table
    const { error } = await db.from('Author').insert([authorData]);
    const modal = bootstrap.Modal.getInstance(document.getElementById('addAuthorModal'));
    modal.hide();

    if (error) {
      alert('Error adding author: ' + error.message);
    } else {
      await applyFilters(); 
      this.reset();
    }
});

// Show modal when Add Publisher button is clicked
document.getElementById('add-publisher-btn').addEventListener('click', async function() {
  await populateModalOptions('modal-country-select-publisher', 'Country' );
  const modal = new bootstrap.Modal(document.getElementById('addPublisherModal'));
  modal.show();
});

// Handle Add Publisher form submission
document.getElementById('add-publisher-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const publisherData = Object.fromEntries(formData.entries());
    // Map form fields to correct table columns
    publisherData.CountryId = publisherData.Country || null;
    // Remove old keys
    delete publisherData.Country;
    // Insert into Book table
    const { error } = await db.from('Publisher').insert([publisherData]);
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPublisherModal'));
    modal.hide();

    if (error) {
      alert('Error adding publisher: ' + error.message);
    } else {
      await applyFilters(); 
      this.reset();
    }
});

// --- HANDLING OF AUTHOR LEVEL BUTTONS ------------------------------------

// Show modal when Edit button is clicked
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-author-btn")) {
    const authorId = e.target.getAttribute('data-id');
    document.getElementById('editAuthorModalLabel').textContent = `Edit Author ID: ${authorId}`;
    document.getElementById('edit-author-id').value = authorId;
    await populateModalOptions('edit-country-select-author', 'Country');
    const modal = new bootstrap.Modal(document.getElementById('editAuthorModal'));
    modal.show();
  }
});

// Handle Edit Author form submission
document.getElementById('edit-author-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const authorData = Object.fromEntries(formData.entries());
  
  const updateData = {};
  if (authorData.Name) updateData.Name = authorData.Name;
  if (authorData.Country) updateData.CountryId = parseInt(authorData.Country, 10);

  const authorId = parseInt(authorData.authorId, 10);

  if (Object.keys(updateData).length === 0) {
    console.log('No fields to update.');
    return; // nothing to update
  }
  // Perform update
  const { error } = await db
    .from('Author')
    .update(updateData)
    .eq('ID', authorId);
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('editAuthorModal'));
  modal.hide();

  if (error) {
    alert(`❌ Error editing Author ID ${authorId}: ${error.message}`);
  } else {
    await applyFilters(); 
    this.reset();
  }
});

// Handle author delete action
document.getElementById('author-list').addEventListener('click', async function(e) {
  if (e.target.classList.contains('delete-author-btn')) {
    const authorId = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this author?')) {
      const { error } = await db.from('Author').delete().eq('ID', authorId);
      if (error) {
        alert('Error deleting author: ' + error.message);
      } else {
        await applyFilters();
      }
    }
  }
});

// --- HANDLING OF PUBLISHER LEVEL BUTTONS ------------------------------------

// Show modal when Edit button is clicked
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-publisher-btn")) {
    const publisherId = e.target.getAttribute('data-id');
    document.getElementById('editPublisherModalLabel').textContent = `Edit Publisher ID: ${publisherId}`;
    document.getElementById('edit-publisher-id').value = publisherId;
    await populateModalOptions('edit-country-select-publisher', 'Country');
    const modal = new bootstrap.Modal(document.getElementById('editPublisherModal'));
    modal.show();
  }
});

// Handle Edit Publisher form submission
document.getElementById('edit-publisher-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const publisherData = Object.fromEntries(formData.entries());
  
  const updateData = {};
  if (publisherData.Name) updateData.Name = publisherData.Name;
  if (publisherData.Country) updateData.CountryId = parseInt(publisherData.Country, 10);

  const publisherId = parseInt(publisherData.publisherId, 10);

  if (Object.keys(updateData).length === 0) {
    console.log('No fields to update.');
    return; // nothing to update
  }
  // Perform update
  const { error } = await db
    .from('Publisher')
    .update(updateData)
    .eq('ID', publisherId);
  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('editPublisherModal'));
  modal.hide();

  if (error) {
    alert(`❌ Error editing Publisher ID ${publisherId}: ${error.message}`);
  } else {
    await applyFilters(); 
    this.reset();
  }
});


// Handle publisher delete action
document.getElementById('publisher-list').addEventListener('click', async function(e) {
  if (e.target.classList.contains('delete-publisher-btn')) {
    const publisherId = e.target.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this publisher?')) {
      const { error } = await db.from('Publisher').delete().eq('ID', publisherId);
      if (error) {
        alert('Error deleting publisher: ' + error.message);
      } else {
        await applyFilters();
      }
    }
  }
});



