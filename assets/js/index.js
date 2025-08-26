let allLibraries = [];

// --- GENERIC LOADER ---------------------------------------------------
async function loadEntities(table, listId) {
  let query = db.from(table).select('*');
  query = query.order('Name', { ascending: true });
  const { data, error } = await query;
  const list = document.getElementById(listId);
  if (error) {
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<div>None found.</div>';
    return;
  }

  list.innerHTML = '';
  const li = document.createElement('li');
  li.className = 'list-group-item mb-2 p-3 rounded-3 shadow-sm d-flex flex-wrap align-items-center';

  data.forEach(element => {
    const span = document.createElement('span');
    span.className = 'badge bg-info me-2 mb-2';
    span.textContent = element.Name;

    // edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'badge-edit-btn ms-1 btn-sm'; // <-- FIXED CLASS
    editBtn.setAttribute('data-id', element.ID);
    editBtn.setAttribute('data-type', table);
    editBtn.setAttribute('data-name', element.Name);
    editBtn.textContent = '✎'; // Pencil icon

    // delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'badge-delete-btn ms-1 btn-sm';
    delBtn.setAttribute('data-id', element.ID);
    delBtn.setAttribute('data-type', table);
    delBtn.setAttribute('data-name', element.Name);
    delBtn.textContent = '×';
    
    span.appendChild(editBtn);
    span.appendChild(delBtn);
    li.appendChild(span);
  });
  

  list.appendChild(li);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadEntities('LibraryLocation', 'library-list');
  await loadEntities('Type', 'type-list');
  await loadEntities('Label', 'label-list');
  await loadEntities('Group', 'group-list');
});


// --- Handling Add/Edit/Delete

let currentAddTable = null;
let currentAddListId = null;
let currentEditId = null;
let isEditMode = false;

// Open modal for add or edit
function openEntityModal({ table, listId, label, id = null, name = '' }) {
  currentAddTable = table;
  currentAddListId = listId;
  currentEditId = id;
  isEditMode = !!id;
  document.getElementById('addEntityModalLabel').textContent = isEditMode ? `Edit ${label} ID: ${id}` : `Add ${label}`;
  document.getElementById('entity-name-input').value = name;
  document.getElementById('entity-id-input').value = id || '';
  document.getElementById('entity-modal-submit-btn').textContent = isEditMode ? 'Save' : 'Add';
  const modal = new bootstrap.Modal(document.getElementById('addEntityModal'));
  modal.show();
}

// Handle form submit for add/edit
document.getElementById('add-entity-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('entity-name-input').value.trim();
  const id = document.getElementById('entity-id-input').value;
  if (!name || !currentAddTable || !currentAddListId) return;

  let error;
  if (isEditMode && id) {
    ({ error } = await db.from(currentAddTable).update({ Name: name }).eq('ID', id));
  } else {
    ({ error } = await db.from(currentAddTable).insert([{ Name: name }]));
  }
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  bootstrap.Modal.getInstance(document.getElementById('addEntityModal')).hide();
  await loadEntities(currentAddTable, currentAddListId);
});

// Attach handlers to each add button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-library-btn').addEventListener('click', () =>
    openEntityModal({ table: 'LibraryLocation', listId: 'library-list', label: 'Library' })
  );
  document.getElementById('add-book-type-btn').addEventListener('click', () =>
    openEntityModal({ table: 'Type', listId: 'type-list', label: 'Type' })
  );
  document.getElementById('add-book-label-btn').addEventListener('click', () =>
    openEntityModal({ table: 'Label', listId: 'label-list', label: 'Label' })
  );
  document.getElementById('add-book-group-btn').addEventListener('click', () =>
    openEntityModal({ table: 'Group', listId: 'group-list', label: 'Group' })
  );
});

// Handle edit and delete buttons (event delegation)
document.addEventListener('click', async function(e) {
  // Edit button
  if (e.target.classList.contains('badge-edit-btn')) {
    const id = e.target.getAttribute('data-id');
    const table = e.target.getAttribute('data-type');
    const listId = e.target.closest('ul').id;
    const name = e.target.getAttribute('data-name');
    const label = table === 'LibraryLocation' ? 'Library'
                : table === 'Type' ? 'Type'
                : table === 'Label' ? 'Label'
                : table === 'Group' ? 'Group'
                : 'Entity';
    openEntityModal({ table, listId, label, id, name });
  }

  // Delete button
  if (e.target.classList.contains('badge-delete-btn') && e.target.textContent === '×') {
    const id = e.target.getAttribute('data-id');
    const table = e.target.getAttribute('data-type');
    const listId = e.target.closest('ul').id;
    if (confirm('Are you sure you want to delete this item?')) {
      const { error } = await db.from(table).delete().eq('ID', id);
      if (error) {
        alert('Error: ' + error.message);
      } else {
        await loadEntities(table, listId);
      }
    }
  }
});