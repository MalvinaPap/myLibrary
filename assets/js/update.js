
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
        complete: async (results) => {

          const headers = results.meta.fields.map(f => f.toLowerCase());

          // Check for exactly 2 columns
          if (headers.length !== 2) {
            resultDiv.innerHTML = `<div class="alert alert-danger">File must have exactly 2 columns. Found ${headers.length} columns.</div>`;
            return;
          }

          // Check for required bookId column
          if (!headers.includes('bookid')) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Missing required 'bookId' column.</div>`;
            return;
          }

          // Define accepted field names for updates
          const acceptedFields = [
            'title', 'originaltitle', 'publisher', 'type', 'group', 'language', 
            'originallanguage', 'translator', 'status', 'library', 'isbn10', 
            'isbn13', 'publicationyear', 'originalpublicationyear', 'numpages', 
            'notes', 'author', 'labels'
          ];

          // Find the update field (the non-bookId column)
          const updateField = headers.find(h => h !== 'bookid');

          if (!acceptedFields.includes(updateField)) {
            resultDiv.innerHTML = `<div class="alert alert-danger">
              Invalid field name: "${updateField}". 
              <br>Accepted fields: ${acceptedFields.join(', ')}
            </div>`;
            return;
          }

          const { data: userData, error: userError } = await db.auth.getUser();
          if (userError || !userData?.user?.id) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Could not determine current user.</div>`;
            return;
          }

          // Process the update
          // const results_summary = { success: 0, failed: 0, errors: [] };

          // for (let i = 0; i < results.data.length; i++) {
          //   const row = results.data[i];
          //   const bookId = row.bookId || row.BookId;
          //   const newValue = row[updateField] || row[updateField.charAt(0).toUpperCase() + updateField.slice(1)];
            
          //   if (!bookId) {
          //     results_summary.failed++;
          //     results_summary.errors.push(`Row ${i + 1}: Missing bookId`);
          //     continue;
          //   }
            
          //   try {
          //     // Update the book record
          //     const updateData = {};
          //     updateData[updateField] = newValue || null;
              
          //     const { error: updateError } = await db
          //       .from('Book')
          //       .update(updateData)
          //       .eq('ID', parseInt(bookId))
          //       .eq('UserId', userData.user.id);
              
          //     if (updateError) {
          //       results_summary.failed++;
          //       results_summary.errors.push(`Row ${i + 1} (BookId: ${bookId}): ${updateError.message}`);
          //     } else {
          //       results_summary.success++;
          //     }
          //   } catch (error) {
          //     results_summary.failed++;
          //     results_summary.errors.push(`Row ${i + 1} (BookId: ${bookId}): ${error.message}`);
          //   }
          // }

          // Display results
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
        },
        error: () => resultDiv.innerHTML = `<div class="alert alert-danger">Error parsing CSV file.</div>`
      });
    };
    reader.readAsText(file, 'UTF-8');
  });
});