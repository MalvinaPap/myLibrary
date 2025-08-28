let allBooks = [];

// --- LOAD BOOKS ----------------------------------------------
async function loadBooks(
  Continent = '', Country = '', Library = '', Author = '', Publisher = '', Language = '',
  Type = '', Group = '',Status = '', Label = '', Search = '', SortField = 'created_at', SortOrder = 'asc'
) {

  let query = db.from('book_full_view').select('*');
  const filterMap = { Continent, Country, Library, Group, Creators: Author, Publisher, Language, Status };

  Object.entries(filterMap).forEach(([key, val]) => {
    if (val) {
      const method = ['Library', 'Publisher', 'Language', 'Status', 'Group'].includes(key) ? 'eq' : 'ilike';
      query = query[method](key, method === 'ilike' ? `%${val}%` : val);
    }
  });

  if (Array.isArray(Type) && Type.length) query = query.in('Type', Type);
  if (Array.isArray(Label) && Label.length) Label.forEach(l => query = query.ilike('Labels', `%${l}%`));
  if (Search) query = query.or([
    `Title.ilike.%${Search}%`,
    `Isbn13.ilike.%${Search}%`,
    `Isbn10.ilike.%${Search}%`,
    `Creators.ilike.%${Search}%`,
    `Group.ilike.%${Search}%`
  ].join(','));

  query = query.order(SortField, { ascending: SortOrder === 'asc' });
  const { data, error } = await query;
  const list = document.getElementById('book-list');

  if (error) {
    console.error('❌ Error fetching books:', error);
    list.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    return;
  }

  allBooks = data || [];
  list.innerHTML = '';
  if (!data || !data.length) return list.innerHTML = '<div>No books found.</div>';

  const totalCountEl = document.createElement('div');
  totalCountEl.className = "mb-3 fw-bold";
  totalCountEl.textContent = `📚 ${data.length} book${data.length > 1 ? 's' : ''} found`;
  list.appendChild(totalCountEl);

  const gridContainer = document.createElement('div');
  gridContainer.className = 'row g-3';
  const fragment = document.createDocumentFragment();

  data.forEach(book => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4';
    const creatorsBadges = makeBadges(book.Creators, book.ID, 'author', true);
    const labelsBadges   = makeBadges(book.Labels, book.ID, 'label', true);
    const countryBadges  = makeBadges(book.Country);

    // Build ISBN line
    let isbnLine = '';
    if (safe(book.Isbn10) && safe(book.Isbn13)) {
      isbnLine = `<em>Isbn13:</em> ${safe(book.Isbn13)},  <em>Isbn10:</em> ${safe(book.Isbn10)}<br>`;
    } else if (safe(book.Isbn10)) {
      isbnLine = `<em>Isbn10:</em> ${safe(book.Isbn10)}<br>`;
    } else if (safe(book.Isbn13)) {
      isbnLine = `<em>Isbn13:</em> ${safe(book.Isbn13)}<br>`;
    }

    col.innerHTML = `
    <div class="card h-100 shadow-sm rounded">
      <div class="card-body p-3">
        <h5 class="card-title mb-2">${safe(book.Title)} </h5>
        <h6 class="card-title mb-2">${safe(book.Group) !== '' ? `(${book.Group})` : ''} </h6> 
        ${isbnLine} 
        <em>Type:</em> ${safe(book.Type)}<br>
        <em>Language:</em> ${safe(book.Language)}<br>
        ${creatorsBadges ? `<em>Author:</em> ${creatorsBadges} <br>` : ''} 
        <em>Publisher:</em> ${safe(book.Publisher)}<br>
        ${labelsBadges ? `<em>Labels:</em> ${labelsBadges}<br>` : ''}
        <button class="btn btn-link btn-sm" data-bs-toggle="collapse" data-bs-target="#extra-info-${book.ID}">
          Show More
        </button>
        <div class="collapse" id="extra-info-${book.ID}">
         ${countryBadges ? `<em>Country:</em> ${countryBadges}<br>` : ''}
         <em>Status:</em> ${safe(book.Status)}<br>
         <em>created_at:</em> ${book.created_at}
      </div>
      </div>
      <div class="d-flex mb-2">
        <div class="ms-auto">
          <button class="btn btn-primary btn-sm edit-btn me-2" data-id="${book.ID}">✎</button>
          <button class="btn btn-danger btn-sm delete-btn me-2" data-id="${book.ID}">🗑</button>
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
  $('#label-filter').select2({ placeholder: "Select Label(s)", allowClear: true, width: '100%'});

  await Promise.all([
    populateFilterOptions('library-filter', 'LibraryLocation'),
    populateFilterOptions('country-filter', 'Country'),
    populateFilterOptions('continent-filter', 'Continent'),
    populateFilterOptions('author-filter', 'Author'),
    populateFilterOptions('publisher-filter', 'Publisher'),
    populateFilterOptions('lang-filter', 'Language'),
    populateFilterOptions('type-filter', 'Type'),
    populateFilterOptions('status-filter', 'Status'),
    populateFilterOptions('label-filter', 'Label'),
    populateFilterOptions('group-filter', 'Group')
  ]);
  await loadBooks();

  ['continent-filter','country-filter','author-filter','library-filter','publisher-filter','group-filter','lang-filter','status-filter']
    .forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  $('#type-filter').on('change', applyFilters);
  $('#label-filter').on('change', applyFilters);
  document.getElementById('search-filter').addEventListener('input', applyFilters);
  document.getElementById('sort-field').addEventListener('change', applyFilters);
  document.getElementById('sort-order').addEventListener('change', applyFilters);
});

async function applyFilters() {
  const getVal = id => document.getElementById(id).value.trim();
  await loadBooks(
    getVal('continent-filter'), getVal('country-filter'), getVal('library-filter'),
    getVal('author-filter'), getVal('publisher-filter'), getVal('lang-filter'),
    ($('#type-filter').val() || []).filter(Boolean), getVal('group-filter'), getVal('status-filter'),
    ($('#label-filter').val() || []).filter(Boolean),
    getVal('search-filter'),
    document.getElementById('sort-field').value,
    document.getElementById('sort-order').checked ? 'desc' : 'asc'
  );
}

// --- ADD BOOK -------------------------------------------------

document.getElementById('add-book-btn').addEventListener('click', async () => {
  await Promise.all([
    populateModalOptions('modal-publisher-select', 'Publisher'),
    populateModalOptions('modal-type-select', 'Type'),
    populateModalOptions('modal-language-select', 'Language'),
    populateModalOptions('modal-status-select', 'Status'),
    populateModalOptions('modal-library-select', 'LibraryLocation'),
    populateModalOptions('modal-group-select', 'Group')
  ]);
  new bootstrap.Modal(document.getElementById('addBookModal')).show();
});

handleFormSubmit('add-author-form', 'BookAuthor');
handleFormSubmit('add-label-form', 'BookLabel');
handleFormSubmit('add-book-form', 'Book', d => {
  return {
    Name: d.Name || null,
    PublisherId: d.Publisher || null,
    TypeId: d.Type || null,
    GroupId: d.Group || null,
    LanguageId: d.Language || null,
    StatusId: d.Status || null, 
    LibraryLocationId: d.LibraryLocation || null,
    Isbn10: d.ISBN10 || null,
    Isbn13: d.ISBN13 || null
  };
});

// --- EDIT / DELETE / BADGE HANDLING --------------------------

document.addEventListener("click", async (e) => {
  const bookId = e.target.dataset.id;
  if (e.target.classList.contains("edit-btn")) {
    document.getElementById('editBookModalLabel').textContent = `Edit Book ID: ${bookId}`;
    document.getElementById('edit-book-id').value = bookId;
    await populateModalOptions('edit-status-select', 'Status');
    await populateModalOptions('edit-library-select', 'LibraryLocation');
    await populateModalOptions('edit-group-select', 'Group');
    new bootstrap.Modal(document.getElementById('editBookModal')).show();
  }
  if (e.target.classList.contains('delete-btn')) {
    if (confirm('Are you sure you want to delete this book?')) {
      const { error } = await db.from('Book').delete().eq('ID', bookId);
      if (error) alert('Error deleting book: ' + error.message);
      else await applyFilters();
    }
  }
  if (e.target.classList.contains('add-author-btn')) {
    await showModal('addAuthorModal', 'add-author-form', 'addAuthorModalLabel', `Add Author (Book ID: ${bookId})`, 'modal-author-select', 'Author', bookId);
  }
  if (e.target.classList.contains('add-label-btn')) {
    await showModal('addLabelModal', 'add-label-form', 'addLabelModalLabel', `Add Label (Book ID: ${bookId})`, 'modal-label-select', 'Label', bookId);
  }
});

// --- EDIT FORM -----------------------------------------------

document.getElementById('edit-book-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this).entries());
  const updateData = {};
  if (data.Name) updateData.Name = data.Name;
  if (data.Status) updateData.StatusId = parseInt(data.Status, 10);
  if (data.Group) updateData.GroupId = parseInt(data.Group, 10);
  if (data.ISBN10) updateData.Isbn10 = data.ISBN10;
  if (data.ISBN13) updateData.Isbn13 = data.ISBN13;
  if (data.Library) updateData.LibraryLocationId = data.Library;
  if (!Object.keys(updateData).length) return;
  const { error } = await db.from('Book').update(updateData).eq('ID', parseInt(data.bookId, 10));
  bootstrap.Modal.getInstance(document.getElementById('editBookModal')).hide();
  if (error) alert(`❌ Error editing Book ID ${data.bookId}: ${error.message}`);
  else { await applyFilters(); this.reset(); }
});

// --- BADGE DELETION ------------------------------------------

document.getElementById('book-list').addEventListener('click', async e => {
  if (!e.target.classList.contains('badge-delete-btn')) return;
  const { bookId, type, name } = e.target.dataset;
  if (!confirm(`Remove \"${name}\" from this book?`)) return;
  let error;
  if (type === 'label') {
    const { data: label, error: lookupError } = await db.from('Label').select('ID').eq('Name', name).maybeSingle();
    if (!label || lookupError) return alert(`Could not find label \"${name}\"`);
    ({ error } = await db.from('BookLabel').delete().eq('BookId', bookId).eq('LabelId', label.ID));
  }
  if (type === 'author') {
    const { data: author, error: lookupError } = await db.from('Author').select('ID').eq('Name', name).maybeSingle();
    if (!author || lookupError) return alert(`Could not find author \"${name}\"`);
    ({ error } = await db.from('BookAuthor').delete().eq('BookId', bookId).eq('AuthorId', author.ID));
  }
  if (error) alert(`Error removing ${type}: ${error.message}`);
  else await applyFilters();
});





