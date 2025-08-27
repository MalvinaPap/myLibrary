let allAuthors = [];
let allPublishers = [];

// --- GENERIC LOADER ---------------------------------------------------

async function loadEntities({
  rpcFn,
  listId,
  search,
  icon,
  singular,
  plural,
  editClass,
  deleteClass
}) {

  const { data, error } = await db.rpc(rpcFn, {
    p_library: document.getElementById('library-filter').value || null,
    p_country: document.getElementById('country-filter').value || null,
    p_continent: document.getElementById('continent-filter').value || null
  });

  const list = document.getElementById(listId);
  if (error) return list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
  if (!data || data.length === 0) return list.innerHTML = `<div>No ${plural} found.</div>`;

  // 🔎 Apply frontend search filter
  let filtered = data;
  if (search && search.trim() !== '') {
    const s = search.toLowerCase();
    filtered = data.filter(item =>
      (item.Name && item.Name.toLowerCase().includes(s)) ||
      (item.Country && item.Country.toLowerCase().includes(s))
    );
  }

  list.innerHTML = '';

  // Count header
  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-2 fw-bold";
  totalCountEl.textContent = `${icon} ${filtered.length} ${filtered.length > 1 ? plural : singular} found`;
  list.appendChild(totalCountEl);

  // Items 
  filtered.forEach(item => {
    const li = document.createElement('li');
    li.className = 'list-group-item mb-2 p-3 rounded-3 shadow-sm';
    li.innerHTML = `
      
      
  
    <div class="d-flex justify-content-between align-items-center flex-wrap">
      <div>
        <strong>${safe(item.Name).length > 25 ? safe(item.Name).slice(0, 15) + '…' : safe(item.Name)}</strong> ${safe(item.Country) ? `(${safe(item.Country)})` : ''}
        <span> - </span> 
        <span class="badge bg-warning">#Books: ${safe(item['#Books'])}</span>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-primary btn-sm ${editClass}" data-id=${item.ID}>✎</button>
        <button class="btn btn-danger btn-sm ${deleteClass}" data-id=${item.ID}>🗑</button>
      </div>
    </div>
      
      
      `;
    list.appendChild(li);
  });
}

// Convenience wrappers
async function loadAuthors(search='') {
  await loadEntities({
    rpcFn: 'get_filtered_authors',
    listId: 'author-list',
    search,
    icon: '👤',
    singular: 'author',
    plural: 'authors',
    editClass: 'edit-author-btn',
    deleteClass: 'delete-author-btn'
  });
}

async function loadPublishers(search='') {
  await loadEntities({
    rpcFn: 'get_filtered_publishers',
    listId: 'publisher-list',
    search,
    icon: '📚',
    singular: 'publisher',
    plural: 'publishers',
    editClass: 'edit-publisher-btn',
    deleteClass: 'delete-publisher-btn'
  });
}

// --- FILTER HANDLING -------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  $('#type-filter').select2({ placeholder: "Select Type(s)", allowClear: true, width: '100%'});
  await Promise.all([
    populateFilterOptions('country-filter', 'Country'),
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('continent-filter', 'Continent')
  ]);
  await applyFilters();

  ['continent-filter','country-filter','library-filter']
    .forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  document.getElementById('search-filter').addEventListener('input', applyFilters);
});

async function applyFilters() {
  const search = document.getElementById('search-filter').value.trim();
  await loadAuthors(search);
  await loadPublishers(search);
}

// --- GENERIC FORM HANDLING -------------------------------------------
async function handleAddForm(formId, table, modalId, countryField='Country') {
  document.getElementById(formId).addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    data.CountryId = data[countryField] || null;
    delete data[countryField];

    const { error } = await db.from(table).insert([data]);
    bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
    if (error) alert(`Error adding ${table}: ${error.message}`);
    else { await applyFilters(); this.reset(); }
  });
}

async function handleEditForm(formId, table, modalId, idField) {
  document.getElementById(formId).addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const updateData = {};
    if (data.Name) updateData.Name = data.Name;
    if (data.Country) updateData.CountryId = parseInt(data.Country, 10);

    const id = parseInt(data[idField], 10);
    if (Object.keys(updateData).length === 0) return;

    const { error } = await db.from(table).update(updateData).eq('ID', id);
    bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
    if (error) alert(`❌ Error editing ${table} ID ${id}: ${error.message}`);
    else { await applyFilters(); this.reset(); }
  });
}

async function handleDelete(listId, table, deleteClass) {
  document.getElementById(listId).addEventListener('click', async function(e) {
    if (e.target.classList.contains(deleteClass)) {
      const id = e.target.getAttribute('data-id');
      if (confirm(`Are you sure you want to delete this ${table}?`)) {
        const { error } = await db.from(table).delete().eq('ID', id);
        if (error) alert(`Error deleting ${table}: ${error.message}`);
        else await applyFilters();
      }
    }
  });
}

// --- GENERIC MODAL OPENERS --------------------------------------------
function setupAddModal(buttonId, modalId, selectId, optionType) {
  document.getElementById(buttonId).addEventListener('click', async () => {
    await populateModalOptions(selectId, optionType);
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  });
}

function setupEditModal(editClass, modalId, labelId, hiddenInputId, optionSelectId, optionType, entityName) {
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains(editClass)) {
      const entityId = e.target.getAttribute('data-id');
      document.getElementById(labelId).textContent = `Edit ${entityName} ID: ${entityId}`;
      document.getElementById(hiddenInputId).value = entityId;
      await populateModalOptions(optionSelectId, optionType);
      const modal = new bootstrap.Modal(document.getElementById(modalId));
      modal.show();
    }
  });
}

// --- APPLY GENERIC HANDLERS ------------------------------------------
// Add forms
handleAddForm('add-author-form', 'Author', 'addAuthorModal');
handleAddForm('add-publisher-form', 'Publisher', 'addPublisherModal');
// Edit forms
handleEditForm('edit-author-form', 'Author', 'editAuthorModal', 'authorId');
handleEditForm('edit-publisher-form', 'Publisher', 'editPublisherModal', 'publisherId');
// Delete buttons
handleDelete('author-list', 'Author', 'delete-author-btn');
handleDelete('publisher-list', 'Publisher', 'delete-publisher-btn');
// Add modals
setupAddModal('add-author-btn', 'addAuthorModal', 'modal-country-select', 'Country');
setupAddModal('add-publisher-btn', 'addPublisherModal', 'modal-country-select-publisher', 'Country');
// Edit modals
setupEditModal('edit-author-btn', 'editAuthorModal', 'editAuthorModalLabel', 'edit-author-id', 'edit-country-select-author', 'Country', 'Author');
setupEditModal('edit-publisher-btn', 'editPublisherModal', 'editPublisherModalLabel', 'edit-publisher-id', 'edit-country-select-publisher', 'Country', 'Publisher');
