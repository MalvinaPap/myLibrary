// Dynamic Navigation Bar
function getNavbarHTML() {
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path === '/myLibrary/' || path === '/myLibrary/index.html') {
    // Navbar for index.html
    return `
      <nav>
        <a href="index.html">Home</a>
        <a href="pages/books.html">Books</a>
        <a href="pages/authors.html">Authors</a>
        <a href="pages/countries.html">Countries</a>
        <a href="pages/upload.html">Upload Data</a>
        <button id="logout-btn" class="btn btn-outline-secondary btn-sm float-end">Logout</button>
      </nav>
    `;
  } else {
    // Navbar for subpages
    return `
      <nav>
        <a href="../index.html">Home</a>
        <a href="../pages/books.html">Books</a>
        <a href="../pages/authors.html">Authors</a>
        <a href="../pages/countries.html">Countries</a>
        <a href="../pages/upload.html">Upload Data</a>
        <button id="logout-btn" class="btn btn-outline-secondary btn-sm float-end">Logout</button>
      </nav>
    `;
  }
}

// Insert navbar at the top of the body or in a placeholder
document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', getNavbarHTML());
  if (typeof setupLogoutButton === 'function') setupLogoutButton();
});


// Utility function to safely get values
const safe = (val) => val ?? '';

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
  const { data, error } = await db
  .from(table_name)
  .select('ID,Name')
  .order('Name', { ascending: true });
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

// Create a badge HTML string from a comma-separated text
const makeBadges = (text, bookId = null, type = null, editable = false) => {
  if (!text || text === '') {
    return editable ? `<span type="button" class="badge bg-info btn-sm add-${type}-btn" data-id="${bookId}">+</span>` : '';
  }
  const badges = text.split(',')
    .map(n => n.trim())
    .filter(Boolean)
    .map(name => {
      const delBtn = editable
        ? `<button type="button" class="badge-delete-btn ms-1" data-book-id="${bookId}" data-type="${type}" data-name="${name}">×</button>`
        : '';
      return `<span class="badge bg-info me-1 mb-1">${name}${delBtn}</span>`;
    }).join('');
  return badges + (editable ? `<span type="button" class="badge bg-info btn-sm add-${type}-btn" data-id="${bookId}">+</span>` : '');
};


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
async function showModal(modalId, formId, labelId, title, selectField, table, entityId) {
  document.getElementById(labelId).textContent = title;
  let hidden = document.querySelector(`#${formId} input[name="EntityId"]`);
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'BookId';
    document.getElementById(formId).appendChild(hidden);
  }
  hidden.value = entityId;
  if (selectField) await populateModalOptions(selectField, table);
  new bootstrap.Modal(document.getElementById(modalId)).show();
}

// Filter and sort data
function filterAndSort(data, search, sortField, sortOrder, searchFields = []) {
  let filtered = data || [];
  if (search && search.trim() !== '') {
    const s = search.toLowerCase();
    filtered = filtered.filter(item =>
      searchFields.some(field =>
        item[field] && item[field].toLowerCase().includes(s)
      )
    );
  }
  if (sortField) {
    filtered = filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }
  return filtered;
}

