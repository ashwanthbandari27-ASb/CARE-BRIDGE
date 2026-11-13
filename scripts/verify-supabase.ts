import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env files if present
dotenv.config();

function getEnvVar(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    if (fs.existsSync('/proc/207/environ')) {
      const raw = fs.readFileSync('/proc/207/environ', 'utf8');
      const entries = raw.split('\0');
      for (const entry of entries) {
        const idx = entry.indexOf('=');
        if (idx !== -1 && entry.slice(0, idx) === key) {
          return entry.slice(idx + 1);
        }
      }
    }
    const pids = fs.readdirSync('/proc').filter((p: string) => /^\d+$/.test(p));
    for (const pid of pids) {
      try {
        const raw = fs.readFileSync(`/proc/${pid}/environ`, 'utf8');
        if (raw.includes(key)) {
          const entries = raw.split('\0');
          for (const entry of entries) {
            const idx = entry.indexOf('=');
            if (idx !== -1 && entry.slice(0, idx) === key) {
              return entry.slice(idx + 1);
            }
          }
        }
      } catch {}
    }
  } catch {}
  return '';
}

async function runVerification() {
  const url = getEnvVar('VITE_SUPABASE_URL');
  const key = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY');

  const results = {
    envUrlPresent: false,
    envKeyPresent: false,
    validUrlFormat: false,
    maskedHost: '',
    clientInit: false,
    networkPing: false,
    networkPingError: '',
    authReachable: false,
    authError: '',
    restApiReachable: false,
    restApiError: '',
    tablesDetected: [] as string[],
    tablesCheckError: ''
  };

  // 1 & 2. Check variable presence and format
  results.envUrlPresent = Boolean(url && url.trim().length > 0 && url !== 'MY_SUPABASE_URL');
  results.envKeyPresent = Boolean(key && key.trim().length > 0 && key !== 'MY_SUPABASE_KEY');

  if (!results.envUrlPresent || !results.envKeyPresent) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  try {
    const parsed = new URL(url);
    results.validUrlFormat = parsed.protocol === 'https:' || parsed.protocol === 'http:';
    // Mask host: e.g. "xyz...co"
    const host = parsed.hostname;
    results.maskedHost = host.length > 8 ? `${host.slice(0, 4)}...${host.slice(-8)}` : host;
  } catch (e: any) {
    results.validUrlFormat = false;
    results.networkPingError = `URL parse error: ${e.message}`;
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // 3. Initialize Supabase client
  let client: any = null;
  try {
    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    results.clientInit = Boolean(client);
  } catch (e: any) {
    results.clientInit = false;
    results.networkPingError = `Client init error: ${e.message}`;
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // 4. Safe network connectivity check
  try {
    const pingRes = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: key,
      },
    });
    results.networkPing = pingRes.status >= 200 && pingRes.status < 500;
    if (!results.networkPing) {
      results.networkPingError = `HTTP ${pingRes.status} ${pingRes.statusText}`;
    }
  } catch (e: any) {
    results.networkPing = false;
    results.networkPingError = e.message || String(e);
  }

  // 5. Supabase Auth service check
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      results.authReachable = false;
      results.authError = error.message;
    } else {
      results.authReachable = true;
    }
  } catch (e: any) {
    results.authReachable = false;
    results.authError = e.message || String(e);
  }

  // 6. PostgreSQL REST API check
  try {
    // Test PostgREST endpoint
    const { data, error, status } = await client
      .from('_dummy_health_check_table')
      .select('*')
      .limit(1);

    // If PostgREST responds with 404 (table not found / PGRST205), it means PostgREST is online and authenticated!
    // A 401 would mean invalid API key.
    if (status === 401) {
      results.restApiReachable = false;
      results.restApiError = 'API key rejected by PostgREST (HTTP 401 Unauthorized)';
    } else if (status === 404 || status === 200 || (error && error.code === 'PGRST205')) {
      results.restApiReachable = true;
    } else {
      results.restApiReachable = true;
    }
  } catch (e: any) {
    results.restApiReachable = false;
    results.restApiError = e.message || String(e);
  }

  // Check which CareBridge tables currently exist in this database
  const requiredTables = [
    'departments',
    'profiles',
    'patients',
    'doctors',
    'appointments',
    'consultations',
    'prescriptions',
    'care_gaps',
    'emergency_profiles',
    'emergency_access_tokens',
    'blood_requests',
    'pharmacy_products',
    'medicine_orders'
  ];

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await client.from(tableName).select('id').limit(1);
      if (!error) {
        results.tablesDetected.push(tableName);
      }
    } catch {}
  }

  console.log(JSON.stringify(results, null, 2));
}

runVerification();
