
// Validation functions
const validateFileStructure = (headers, resultDiv) => {
  if (headers.length !== 2) {
    resultDiv.innerHTML = `<div class="alert alert-danger">File must have exactly 2 columns. Found ${headers.length} columns.</div>`;
    return false;
  }
  
  if (!headers.includes('bookid')) {
    resultDiv.innerHTML = `<div class="alert alert-danger">Missing required 'bookId' column.</div>`;
    return false;
  }
  
  return true;
};

const validateUpdateField = (updateField, resultDiv) => {
  const acceptedFields = [
    'title', 'originaltitle', 'isbn10', 'isbn13', 'publicationyear', 'originalpublicationyear', 'numpages', 'notes', 
    'language', 'originallanguage', 'translator', 'status', 'library', 'publisher', 'type', 'group', 
    'author', 'label'
  ];
  
  if (!acceptedFields.includes(updateField)) {
    resultDiv.innerHTML = `<div class="alert alert-danger">
      Invalid field name: "${updateField}". 
      <br>Accepted fields: ${acceptedFields.join(', ')}
    </div>`;
    return false;
  }
  
  return true;
};

// Field processing functions
const processDirectFields = async (updateField, newValue) => {
  const updateData = {};
  
  switch (updateField) {
    case 'title':
      updateData.Name = newValue || null;
      break;
    case 'originaltitle':
      updateData.OriginalTitle = newValue || null;
      break;
    case 'isbn10':
      updateData.Isbn10 = newValue || null;
      break;
    case 'isbn13':
      updateData.Isbn13 = newValue || null;
      break;
    case 'publicationyear':
      updateData.PublicationYear = newValue ? parseInt(newValue) : null;
      break;
    case 'originalpublicationyear':
      updateData.OriginalPublicationYear = newValue ? parseInt(newValue) : null;
      break;
    case 'numpages':
      updateData.NumPages = newValue ? parseInt(newValue) : null;
      break;
    case 'notes':
      updateData.Notes = newValue || null;
      break;
  }
  
  return updateData;
};

const processForeignKeyFields = async (updateField, newValue, userId) => {
  const updateData = {};
  
  switch (updateField) {
    case 'publisher':
      updateData.PublisherId = newValue ? await getOrCreateId('Publisher', newValue, userId) : null;
      break;
    case 'type':
      updateData.TypeId = newValue ? await getOrCreateId('Type', newValue, userId) : null;
      break;
    case 'group':
      updateData.GroupId = newValue ? await getOrCreateId('Group', newValue, userId) : null;
      break;
    case 'translator':
      updateData.TranslatorId = newValue ? await getOrCreateId('Author', newValue, userId) : null;
      break;
    case 'language':
      updateData.LanguageId = newValue ? await getIdByName('Language', newValue) : null;
      break;
    case 'originallanguage':
      updateData.OriginalLanguageId = newValue ? await getIdByName('Language', newValue) : null;
      break;
    case 'status':
      const statusMap = { 'read': 'Read', 'owned': 'Owned', 'not applicable': 'Not Applicable' };
      const statusName = statusMap[newValue?.toLowerCase()] || newValue;
      updateData.StatusId = statusName ? await getIdByName('Status', statusName) : null;
      break;
    case 'library':
      updateData.LibraryLocationId = newValue ? await getIdByName('LibraryLocation', newValue, { UserId: userId }) : null;
      break;
  }
  
  return updateData;
};

const processRelationshipFields = async (updateField, newValue, bookId, userId) => {
  if (updateField === 'author') {
    await db.from('BookAuthor').delete().eq('BookId', parseInt(bookId));
    if (newValue?.trim()) {
      const authorId = await getOrCreateId('Author', newValue, userId);
      if (authorId) {
        await db.from('BookAuthor').insert([{ BookId: parseInt(bookId), AuthorId: authorId }]);
      }
    }
  }

  if (updateField === 'label') {
    await db.from('BookLabel').delete().eq('BookId', parseInt(bookId));
    if (newValue?.trim()) {
      const labels = newValue.split(',').map(l => l.trim()).filter(Boolean);
      for (const labelName of labels) {
        const labelId = await getOrCreateId('Label', labelName, userId);
        if (labelId) {
          await db.from('BookLabel').insert([{ BookId: parseInt(bookId), LabelId: labelId }]);
        }
      }
    }
  }
};

const updateBookRecord = async (bookId, updateData, userId) => {
  if (Object.keys(updateData).length === 0) return null;
  
  const { error } = await db
    .from('Book')
    .update(updateData)
    .eq('ID', parseInt(bookId))
    .eq('UserId', userId);
    
  return error;
};

const processBookUpdate = async (row, updateField, userId, results_summary, rowIndex) => {
  const bookId = row.bookId || row.BookId;
  const newValue = row[updateField] || row[updateField.charAt(0).toUpperCase() + updateField.slice(1)];
  console.log(`Processing row ${rowIndex + 1}: bookId=${bookId}, ${updateField}=${newValue}`);
  if (!bookId) {
    results_summary.failed++;
    results_summary.errors.push(`Row ${rowIndex + 1}: Missing bookId`);
    return;
  }
  
  try {
    // Process different field types
    let updateData = {};
    const directFields = ['title', 'originaltitle', 'isbn10', 'isbn13', 'publicationyear', 'originalpublicationyear', 'numpages', 'notes'];
    const foreignKeyFields = ['publisher', 'type', 'group', 'translator', 'language', 'originallanguage', 'status', 'library'];
    const relationshipFields = ['author', 'label'];
    
    if (directFields.includes(updateField)) {
      updateData = await processDirectFields(updateField, newValue);
    } else if (foreignKeyFields.includes(updateField)) {
      updateData = await processForeignKeyFields(updateField, newValue, userId);
    } else if (relationshipFields.includes(updateField)) {
      await processRelationshipFields(updateField, newValue, bookId, userId);
    } else {
      results_summary.failed++;
      results_summary.errors.push(`Row ${rowIndex + 1} (BookId: ${bookId}): Unsupported field type`);
      return;
    }

    // Update Book table if needed
    const updateError = await updateBookRecord(bookId, updateData, userId);
    if (updateError) {
      results_summary.failed++;
      results_summary.errors.push(`Row ${rowIndex + 1} (BookId: ${bookId}): ${updateError.message}`);
      return;
    }

    results_summary.success++;
  } catch (error) {
    results_summary.failed++;
    results_summary.errors.push(`Row ${rowIndex + 1} (BookId: ${bookId}): ${error.message}`);
  }
};

const displayResults = (results_summary, updateField, resultDiv) => {
  let html = `<div class="alert ${results_summary.failed > 0 ? 'alert-warning' : 'alert-success'}">
    Update completed: <b>${results_summary.success}</b> successful, <b>${results_summary.failed}</b> failed
    <br>Field updated: <strong>${updateField}</strong>
  </div>`;
  
  if (results_summary.errors.length) {
    html += `<div class="alert alert-danger">Errors:<ul>`;
    results_summary.errors.forEach(error => html += `<li>${error}</li>`);
    html += '</ul></div>';
  }
  
  resultDiv.innerHTML = html;
};

// Main processing function
const processCSVUpdate = async (results, resultDiv) => {
  const headers = results.meta.fields.map(f => f.toLowerCase());
  
  if (!validateFileStructure(headers, resultDiv)) return;
  
  const updateField = headers.find(h => h !== 'bookid');
  if (!validateUpdateField(updateField, resultDiv)) return;

  const { data: userData, error: userError } = await db.auth.getUser();
  if (userError || !userData?.user?.id) {
    resultDiv.innerHTML = `<div class="alert alert-danger">Could not determine current user.</div>`;
    return;
  }

  const results_summary = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < results.data.length; i++) {
    await processBookUpdate(results.data[i], updateField, userData.user.id, results_summary, i);
  }

  displayResults(results_summary, updateField, resultDiv);
};

// Main event listener
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('update-file-input').files[0];
    const resultDiv = document.getElementById('update-result');
    
    if (!file) return alert('Please select a CSV file.');

    const reader = new FileReader();
    reader.onload = async (event) => {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => await processCSVUpdate(results, resultDiv),
        error: () => resultDiv.innerHTML = `<div class="alert alert-danger">Error parsing CSV file.</div>`
      });
    };
    reader.readAsText(file, 'UTF-8');
  });
});