// Database connection details
const SUPABASE_URL = 'https://hlrmxbhcouvljvdbsfpa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhscm14Ymhjb3V2bGp2ZGJzZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzUxMDEsImV4cCI6MjA2MjYxMTEwMX0.KfDPllXeo_X12jtEajp43wvuAzKJ1ibyiN3p1_Eswtw';

// --- Create Supabase client ---
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Show login form if not authenticated, else show main content
async function requireAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    document.body.innerHTML = `
      <div class="container my-5" style="max-width:400px;">
        <form id="login-form" class="card card-body">
          <h5 class="mb-3">Login</h5>
          <input type="email" name="email" class="form-control mb-2" placeholder="Email" required>
          <input type="password" name="password" class="form-control mb-2" placeholder="Password" required>
          <button type="submit" class="btn btn-primary w-100">Login</button>
          <div id="login-error" class="text-danger mt-2"></div>
        </form>
      </div>
    `;
    document.getElementById('login-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = this.email.value;
      const password = this.password.value;
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        document.getElementById('login-error').textContent = error.message;
      } else {
        location.reload();
      }
    });
    throw new Error('Not authenticated');
  }
}

// Optional: Logout button logic
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await db.auth.signOut();
      location.reload();
    });
  }
}