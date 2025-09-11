// Validation helpers
const existsInTable = async (table, column, value, extraFilters = {}) => {
  let query = db.from(table).select(column).ilike(column, value.trim());
  Object.entries(extraFilters).forEach(([k, v]) => query = query.eq(k, v));
  const { data, error } = await query;
  return !error && data?.length > 0;
};

const isUniqueInBook = async (field, value, userId) => {
  const { data, error } = await db.from('Book').select('ID').eq(field, value.trim()).eq('UserId', userId).limit(1);
  return !error && !(data?.length > 0);
};

const isValidRow = async (row, userId) => {
  if (!row.title?.trim()) return { valid: false, reason: 'Missing title' };
  if (!row.library?.trim()) return { valid: false, reason: 'Missing library' };
  if (!await existsInTable('LibraryLocation', 'Name', row.library, { UserId: userId })) 
    return { valid: false, reason: `Library "${row.library}" not found. Create it first.` };
  if (!row.language?.trim()) return { valid: false, reason: 'Missing language' };
  if (!await existsInTable('Language', 'Name', row.language)) 
    return { valid: false, reason: `Language "${row.language}" not found` };
  
  const allowedStatus = ['read', 'owned', 'not applicable'];
  if (!row.status?.trim() || !allowedStatus.includes(row.status.trim().toLowerCase())) 
    return { valid: false, reason: `Invalid status. Allowed: ${allowedStatus.join(', ')}` };
  
  if (row.isbn10?.trim() && !await isUniqueInBook('Isbn10', row.isbn10, userId)) 
    return { valid: false, reason: 'ISBN10 already exists' };
  if (row.isbn13?.trim() && !await isUniqueInBook('Isbn13', row.isbn13, userId)) 
    return { valid: false, reason: 'ISBN13 already exists' };
  if (row.originallanguage?.trim() && !await existsInTable('Language', 'Name', row.originallanguage)) 
    return { valid: false, reason: `Original language "${row.originallanguage}" not found` };
  
  const numFields = ['numpages', 'publicationyear', 'originalpublicationyear'];
  for (const field of numFields) {
    if (row[field]?.trim() && isNaN(parseInt(row[field].trim()))) 
      return { valid: false, reason: `${field} must be a number` };
  }
  return { valid: true };
};

// Database helpers
const getIdByName = async (table, name, extraFilters = {}) => {
  if (!name?.trim()) return null;
  let query = db.from(table).select('ID').ilike('Name', name.trim());
  Object.entries(extraFilters).forEach(([k, v]) => query = query.eq(k, v));
  const { data, error } = await query;
  return !error && data?.length ? data[0].ID : null;
};

const getOrCreateId = async (table, name, userId, extraFields = {}) => {
  if (!name?.trim()) return null;
  const existingId = await getIdByName(table, name, { UserId: userId });
  if (existingId) return existingId;
  
  const { data, error } = await db.from(table).insert([{ Name: name.trim(), UserId: userId, ...extraFields }]).select('ID').single();
  return !error ? data.ID : null;
};

const uploadBooks = async (validRows, userId) => {
  const results = { success: 0, failed: 0, errors: [] };
  
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    try {
      // Get/create entities
      const [publisherId, typeId, groupId, translatorId, languageId, originalLanguageId, libraryId, statusId] = await Promise.all([
        row.publisher ? getOrCreateId('Publisher', row.publisher, userId) : null,
        row.type ? getOrCreateId('Type', row.type, userId) : null,
        row.group ? getOrCreateId('Group', row.group, userId) : null,
        row.translator ? getOrCreateId('Author', row.translator, userId) : null,
        getIdByName('Language', row.language),
        row.originallanguage ? getIdByName('Language', row.originallanguage) : null,
        getIdByName('LibraryLocation', row.library, { UserId: userId }),
        getIdByName('Status', row.status)
      ]);

      // Insert book
      const { data: newBook, error: bookError } = await db.from('Book').insert([{
        Name: row.title.trim(),
        OriginalTitle: row.originaltitle?.trim() || null,
        LanguageId: languageId,
        OriginalLanguageId: originalLanguageId,
        LibraryLocationId: libraryId,
        StatusId: statusId,
        PublisherId: publisherId,
        TypeId: typeId,
        GroupId: groupId,
        TranslatorId: translatorId,
        Isbn10: row.isbn10?.trim() || null,
        Isbn13: row.isbn13?.trim() || null,
        PublicationYear: row.publicationyear ? parseInt(row.publicationyear.trim()) : null,
        OriginalPublicationYear: row.originalpublicationyear ? parseInt(row.originalpublicationyear.trim()) : null,
        NumPages: row.numpages ? parseInt(row.numpages.trim()) : null,
        Notes: row.notes?.trim() || null,
        UserId: userId
      }]).select().single();

      if (bookError) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${bookError.message}`);
        continue;
      }

      // Handle author and labels
      const promises = [];
      if (row.author?.trim()) {
        const CountryId = row.country ? await getIdByName('Country', row.country) : null;
        promises.push(getOrCreateId('Author', row.author, userId, { CountryId: CountryId })
          .then(authorId => authorId && db.from('BookAuthor').insert([{ BookId: newBook.ID, AuthorId: authorId }])));
      }
      if (row.labels?.trim()) {
        const labels = row.labels.split(',').map(t => t.trim()).filter(Boolean);
        promises.push(...labels.map(async label => {
          const labelId = await getOrCreateId('Label', label, userId);
          return labelId && db.from('BookLabel').insert([{ BookId: newBook.ID, LabelId: labelId }]);
        }));
      }
      await Promise.allSettled(promises);

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }
  return results;
};

// Main upload logic
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('file-input').files[0];
    const resultDiv = document.getElementById('upload-result');
    
    if (!file) return alert('Please select a CSV file.');

    const reader = new FileReader();
    reader.onload = async (event) => {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const required = ['title', 'library', 'language', 'status'];
          const headers = results.meta.fields.map(f => f.toLowerCase());
          const missing = required.filter(col => !headers.includes(col));
          
          if (missing.length) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Missing columns: <b>${missing.join(', ')}</b></div>`;
            return;
          }

          const { data: userData, error: userError } = await db.auth.getUser();
          if (userError || !userData?.user?.id) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Could not determine current user.</div>`;
            return;
          }

          const validRows = [];
          const ignoredRows = [];

          for (let idx = 0; idx < results.data.length; idx++) {
            const normalizedRow = {};
            Object.keys(results.data[idx]).forEach(k => normalizedRow[k.toLowerCase()] = results.data[idx][k]);
            const validation = await isValidRow(normalizedRow, userData.user.id);
            
            if (validation.valid) validRows.push(normalizedRow);
            else ignoredRows.push({ row: idx + 1, data: normalizedRow, reason: validation.reason });
          }

          let html = `<div class="alert alert-info">Valid: <b>${validRows.length}</b> | Ignored: <b>${ignoredRows.length}</b></div>`;
          
          if (ignoredRows.length) {
            html += `<div class="alert alert-warning">Ignored rows:<ul>`;
            ignoredRows.forEach(r => html += `<li>Row ${r.row}: ${r.reason}</li>`);
            html += '</ul></div>';
          }

          if (validRows.length > 0) {
            html += `<div class="alert alert-info">Uploading ${validRows.length} books...</div>`;
            resultDiv.innerHTML = html;
            
            const uploadResults = await uploadBooks(validRows, userData.user.id);
            html += `<div class="alert ${uploadResults.failed > 0 ? 'alert-warning' : 'alert-success'}">
              Upload completed: <b>${uploadResults.success}</b> successful, <b>${uploadResults.failed}</b> failed</div>`;
            
            if (uploadResults.errors.length) {
              html += `<div class="alert alert-danger">Errors:<ul>`;
              uploadResults.errors.forEach(error => html += `<li>${error}</li>`);
              html += '</ul></div>';
            }
          }
          resultDiv.innerHTML = html;
        },
        error: () => resultDiv.innerHTML = `<div class="alert alert-danger">Error parsing CSV file.</div>`
      });
    };
    reader.readAsText(file, 'UTF-8');
  });
});