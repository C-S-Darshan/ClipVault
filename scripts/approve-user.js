const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if present
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ckkfhzksheltqioddcjf.supabase.co';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SECRET_KEY) {
  console.error('Error: SUPABASE_SECRET_KEY not found in .env.local or environment.');
  process.exit(1);
}

const targetEmail = process.argv[2]?.trim().toLowerCase();

async function main() {
  // If no email provided, list all users and their status
  if (!targetEmail) {
    console.log('\n--- ClipVault Registered Users ---');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, {
      headers: {
        apikey: SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });
    const users = await res.json();
    if (!Array.isArray(users) || users.length === 0) {
      console.log('No users registered yet.');
    } else {
      console.table(
        users.map((u) => ({
          Name: u.name,
          Email: u.email,
          Approved: u.is_approved ? '✅ Approved' : '⏳ Pending',
          Joined: new Date(u.created_at).toLocaleDateString(),
        }))
      );
    }
    console.log('\nUsage to approve a user:');
    console.log('  npm run approve <email>\n');
    return;
  }

  console.log(`\nApproving user: ${targetEmail}...`);

  // 1. Update public.users table
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(targetEmail)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ is_approved: true }),
    }
  );

  const updatedUsers = await updateRes.json();

  // 2. Also confirm email in auth.users if unconfirmed
  const authUsersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SECRET_KEY,
      Authorization: `Bearer ${SECRET_KEY}`,
    },
  });
  const authData = await authUsersRes.json();
  const authUser = authData?.users?.find(
    (u) => u.email?.toLowerCase() === targetEmail
  );

  if (authUser && !authUser.email_confirmed_at) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUser.id}`, {
      method: 'PUT',
      headers: {
        apikey: SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_confirm: true }),
    });
    console.log('  Confirmed email in Supabase Auth.');
  }

  if (Array.isArray(updatedUsers) && updatedUsers.length > 0) {
    const user = updatedUsers[0];
    console.log(`\n✅ Successfully approved ${user.name} (${user.email})!`);
    console.log('   Status: is_approved = true\n');
  } else {
    console.log(`\n⚠️  No record found in public.users for email: ${targetEmail}`);
    if (authUser) {
      console.log(`   Found in auth.users (ID: ${authUser.id}). Email has been confirmed.`);
    } else {
      console.log('   Make sure the user has signed in at least once so their profile exists.');
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('Failed to approve user:', err.message);
  process.exit(1);
});
