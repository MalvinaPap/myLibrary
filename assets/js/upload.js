// --------------- DATA VALIDATION --------------------------------------------------

// Validation helpers
async function existsInTable(table, column, value, extraFilters = {}) {
  let query = db.from(table).select(column);
  query = query.ilike(column, value.trim());
  Object.entries(extraFilters).forEach(([k, v]) => query = query.eq(k, v));
  const { data, error } = await query;
  if (error) return false;
  return data && data.length > 0;;
}

async function isUniqueInBook(field, value, userId) {
  const { data, error } = await db
    .from('Book')
    .select('ID')
    .eq(field, value.trim())
    .eq('UserId', userId)
    .limit(1);
  if (error) return false; 
  return !(data && data.length > 0);
}

// Validation criteria for each row
async function isValidRow(row, userId) {
  // Title must not be empty
  if (!row.title || !row.title.trim()) {
    return { valid: false, reason: 'Missing title' };
  }
  // Library must not be empty & must exist in LibraryLocation table for the user (case-insensitive)
  if (!row.library || !row.library.trim()) {
    return { valid: false, reason: 'Missing library' };
  }
  if (!await existsInTable('LibraryLocation', 'Name', row.library, { UserId: userId })) {
    return { valid: false, reason: `Library "${row.library}" does not exist in your library locations. Create the library in Home page and try again.` };
  }
  // Language must not be empty & must exist in Language table (case-insensitive)
  if (!row.language || !row.language.trim()) {
    return { valid: false, reason: 'Missing language' };
  }
  if (!await existsInTable('Language', 'Name', row.language)) {
    return { valid: false, reason: `Language "${row.language}" does not exist in the database` };
  }
  // Status must not be empty & must have one of the allowed values
  const allowedStatus = ['read', 'owned', 'not applicable'];
  if (!row.status || !row.status.trim()) {
    return { valid: false, reason: 'Missing status' };
  }
  if (!allowedStatus.includes(row.status.trim().toLowerCase())) {
    return { valid: false, reason: `Invalid status: "${row.status}". Allowed: ${allowedStatus.join(', ')}` };
  }
  // ISBN10 uniqueness check
  if (row.isbn10 && row.isbn10.trim() && !await isUniqueInBook('Isbn10', row.isbn10, userId)) {
    return { valid: false, reason: 'Given ISBN10 already exists in your database' };
  }
  // ISBN13 uniqueness check
  if (row.isbn13 && row.isbn13.trim() && !await isUniqueInBook('Isbn13', row.isbn13, userId)) {
    return { valid: false, reason: 'Given ISBN13 already exists in your database' };
  }
  // If original language is provided, it must exist in Language table (case-insensitive)
  if (row['originallanguage'] && row['originallanguage'].trim()) {
    if (!await existsInTable('Language', 'Name', row['originallanguage'])) {
      return { valid: false, reason: `Original language "${row['originallanguage']}" does not exist in the database` };
    }
  }
  // if pages, publication year, or original publication year are provided, they must be valid numbers
  if (row.numpages && row.numpages.trim() && isNaN(parseInt(row.numpages.trim()))) {
    return { valid: false, reason: 'Number of pages must be a valid number' };
  }
  if (row['publicationyear'] && row['publicationyear'].trim() && isNaN(parseInt(row['publicationyear'].trim()))) {
    return { valid: false, reason: 'Publication year must be a valid number' };
  }
  if (row['originalpublicationyear'] && row['originalpublicationyear'].trim() && isNaN(parseInt(row['originalpublicationyear'].trim()))) {
    return { valid: false, reason: 'Original publication year must be a valid number' };
  }
  return { valid: true };
}


// --------------- UPLOAD TO DATABASE --------------------------------------------------

// Helper function to get ID from table by name
async function getIdByName(table, name, extraFilters = {}) {
  if (!name || !name.trim()) return null;
  let query = db.from(table).select('ID').ilike('Name', name.trim());
  Object.entries(extraFilters).forEach(([k, v]) => query = query.eq(k, v));
  const { data, error } = await query;
  if (error || !data || !data.length) return null;
  return data[0].ID;
}

// Helper function to get or create entity
async function getOrCreateId(table, name, userId, extraFields = {}) {
  if (!name || !name.trim()) return null;
  // First try to get existing ID
  const existingId = await getIdByName(table, name, { UserId: userId });
  if (existingId) return existingId;
  // If not found, create new entity
  const entityData = {
    Name: name.trim(),
    UserId: userId,
    ...extraFields
  };
  const { data, error } = await db
    .from(table)
    .insert([entityData])
    .select('ID')
    .single();
    
  if (error) {
    console.error(`Error creating ${table}:`, error);
    return null;
  }
  
  return data.ID;
}

// Upload valid rows to database
async function uploadBooks(validRows, userId) {
  const results = { success: 0, failed: 0, errors: [] };
  
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    try {
      // Create non-existing entities first (publisher, type, group, translator)
      const publisherId = row.publisher ? await getOrCreateId('Publisher', row.publisher, userId) : null;
      const typeId = row.type ? await getOrCreateId('Type', row.type, userId) : null;
      const groupId = row.group ? await getOrCreateId('Group', row.group, userId) : null;
      const translatorId = row.translator ? await getOrCreateId('Author', row.translator, userId) : null;

      // Get IDs for entities that should already exist (validated in validation process)
      const languageId = await getIdByName('Language', row.language);
      const originalLanguageId = row.originallanguage ? await getIdByName('Language', row.originallanguage) : null;
      const libraryId = await getIdByName('LibraryLocation', row.library, { UserId: userId });
      const statusId = await getIdByName('Status', row.status);
      const countryId = await getIdByName('Country', row.country);

      // Prepare book data
      const bookData = {
        Name: row.title.trim(),
        OriginalTitle: row.originaltitle ? row.originaltitle.trim() : null,
        LanguageId: languageId,
        OriginalLanguageId: originalLanguageId,
        LibraryLocationId: libraryId,
        StatusId: statusId,
        PublisherId: publisherId,
        TypeId: typeId,
        GroupId: groupId,
        TranslatorId: translatorId,
        Isbn10: row.isbn10 ? row.isbn10.trim() : null,
        Isbn13: row.isbn13 ? row.isbn13.trim() : null,
        PublicationYear: row.publicationyear ? parseInt(row.publicationyear.trim()) : null,
        OriginalPublicationYear: row.originalpublicationyear ? parseInt(row.originalpublicationyear.trim()) : null,
        NumPages: row.numpages ? parseInt(row.numpages.trim()) : null,
        Notes: row.notes ? row.notes.trim() : null,
        UserId: userId
      };

      // Insert book
      const { data: newBook, error: bookError } = await db
        .from('Book')
        .insert([bookData])
        .select()
        .single();

      if (bookError) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${bookError.message}`);
        continue;
      }

      // Handle author relationship if provided (create author if needed)
      if (row.author && row.author.trim()) {
        const authorId = await getOrCreateId('Author', row.author, userId, { CountryId: countryId });
        if (authorId) {
          const { error: authorError } = await db
            .from('BookAuthor')
            .insert([{ BookId: newBook.ID, AuthorId: authorId }]);
          if (authorError) {
            console.warn(`Warning: Could not link author for book "${row.title}": ${authorError.message}`);
          }
        }
      }

      // Handle labels if provided (comma-separated)
      if (row.labels && row.labels.trim()) {
        const labels = row.labels.split(',').map(t => t.trim()).filter(t => t);
        for (const label of labels) {
          const labelId = await getOrCreateId('Label', label, userId);
          if (labelId) {
            const { error: labelError } = await db
              .from('BookLabel')
              .insert([{ BookId: newBook.ID, LabelId: labelId }]);
            if (labelError) {
              console.warn(`Warning: Could not link label "${label}" for book "${row.title}": ${labelError.message}`);
            }
          }
        }
      }

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }
  
  return results;
}



// --------------- UPLOAD LOGIC --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const resultDiv = document.getElementById('upload-result');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
          // Check for required columns
          const required = ['title', 'library', 'language', 'status'];
          const headers = results.meta.fields.map(f => f.toLowerCase());
          const missing = required.filter(col => !headers.includes(col));
          if (missing.length) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Missing required columns: <b>${missing.join(', ')}</b></div>`;
            return;
          }
          const validRows = [];
          const ignoredRows = [];

          // Get current user ID
          const { data: userData, error: userError } = await db.auth.getUser();
          if (userError || !userData?.user?.id) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Could not determine current user.</div>`;
            return;
          }
          const userId = userData.user.id;

          // Async validation for each row
          for (let idx = 0; idx < results.data.length; idx++) {
            const row = results.data[idx];
            const normalizedRow = {};
            Object.keys(row).forEach(k => normalizedRow[k.toLowerCase()] = row[k]);
            const validation = await isValidRow(normalizedRow, userId);
            if (validation.valid) {
              validRows.push(normalizedRow);
              console.log(`Row ${idx + 1} (valid):`, normalizedRow);
            } else {
              ignoredRows.push({ row: idx + 1, data: normalizedRow, reason: validation.reason });
              console.log(`Row ${idx + 1} (ignored):`, normalizedRow, 'Reason:', validation.reason);
            }
          }

          // Always show the summary of valid and ignored rows
          let html = `<div class="alert alert-info">Valid rows: <b>${validRows.length}</b> &nbsp; | &nbsp; Ignored rows: <b>${ignoredRows.length}</b></div>`;
          if (ignoredRows.length) {
            html += `<div class="alert alert-warning">Ignored rows:<ul>`;
            ignoredRows.forEach(r => {
              html += `<li>Row ${r.row}: ${JSON.stringify(r.data)}<br><b>Reason:</b> ${r.reason}</li>`;
            });
            html += '</ul></div>';
          }

          // Upload valid rows to database
          if (validRows.length > 0) {
            html += `<div class="alert alert-info">Uploading ${validRows.length} books to database...</div>`;
            resultDiv.innerHTML = html;
            
            const uploadResults = await uploadBooks(validRows, userId);
            
            html += `<div class="alert ${uploadResults.failed > 0 ? 'alert-warning' : 'alert-success'}">
              Upload completed: <b>${uploadResults.success}</b> successful, <b>${uploadResults.failed}</b> failed
            </div>`;
            
            if (uploadResults.errors.length > 0) {
              html += `<div class="alert alert-danger">Upload errors:<ul>`;
              uploadResults.errors.forEach(error => {
                html += `<li>${error}</li>`;
              });
              html += '</ul></div>';
            }
          }

          resultDiv.innerHTML = html;
        },
        error: function(err) {
          console.error('Error parsing CSV:', err);
          resultDiv.innerHTML = `<div class="alert alert-danger">Error parsing CSV file.</div>`;
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  });
});