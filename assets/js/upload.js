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
  return { valid: true };
}


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