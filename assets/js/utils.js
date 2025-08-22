// Handling of Navigation Bar
const navbarHTML = `

<nav>
  <a href="../index.html">Home</a>
  <a href="../pages/books.html">Books</a>
  <a href="../pages/authors_publishers.html">Authors/Publishers</a>
  <a href="../pages/countries.html">Countries</a>
  <button id="logout-btn" class="btn btn-outline-secondary btn-sm float-end">Logout</button>
</nav>
`;

// Insert navbar at the top of the body or in a placeholder
document.addEventListener('DOMContentLoaded', () => {

  document.body.insertAdjacentHTML('afterbegin', navbarHTML);
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
  const { data, error } = await db.from(table_name).select('ID,Name');
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
async function showModal(modalId, formId, labelId, title, selectField, table, bookId) {
  document.getElementById(labelId).textContent = title;
  let hidden = document.querySelector(`#${formId} input[name="BookId"]`);
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'BookId';
    document.getElementById(formId).appendChild(hidden);
  }
  hidden.value = bookId;
  if (selectField) await populateModalOptions(selectField, table);
  new bootstrap.Modal(document.getElementById(modalId)).show();
}

