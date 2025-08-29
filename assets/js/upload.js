document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const resultDiv = document.getElementById('upload-result');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a CSV file.');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        // Check for required columns
        const required = ['title', 'library', 'language', 'status'];
        const headers = results.meta.fields.map(f => f.toLowerCase());
        const missing = required.filter(col => !headers.includes(col));
        if (missing.length) {
          resultDiv.innerHTML = `<div class="alert alert-danger">Missing required columns: <b>${missing.join(', ')}</b></div>`;
          return;
        }
        // If valid, parse and print each row
        results.data.forEach((row, idx) => {
          console.log(`Row ${idx + 1}:`, row);
        });
        resultDiv.innerHTML = `<div class="alert alert-success">CSV loaded and parsed! Check the console for each row.</div>`;
      },
      error: function(err) {
        console.error('Error parsing CSV:', err);
        resultDiv.innerHTML = `<div class="alert alert-danger">Error parsing CSV file.</div>`;
      }
    });
  });
});