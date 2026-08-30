(() => {
  if (window.RageSupabaseBridge) return;

  const VERSION = '2.5.0-alpha1';
  const config = window.RAGE_SUPABASE_CONFIG || {};
  let client = null;
  let currentSession = null;
  let libraryPromise = null;
  let realtimeChannel = null;

  function loadLibrary() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    if (libraryPromise) return libraryPromise;

    libraryPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-rage-supabase-lib]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.supabase), { once: true });
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Supabase JS.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.async = true;
      script.dataset.rageSupabaseLib = '1';
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error('No se pudo cargar Supabase JS.'));
      document.head.appendChild(script);
    });

    return libraryPromise;
  }

  function dispatch(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(`rage:supabase:${name}`, { detail }));
  }

  function localSnapshot() {
    const result = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || key.startsWith('sb-')) continue;
      const raw = localStorage.getItem(key);
      try { result[key] = JSON.parse(raw); }
      catch (_) { result[key] = raw; }
    }
    return {
      exportedAt: new Date().toISOString(),
      appVersion: document.querySelector('meta[name="rage-version"]')?.content || null,
      data: result
    };
  }

  function subscribeRealtime() {
    if (!client || !currentSession || realtimeChannel) return;
    realtimeChannel = client
      .channel('rage-training-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => dispatch('clients-change', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, payload => dispatch('sessions-change', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trainers' }, payload => dispatch('trainers-change', payload))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => dispatch('payments-change', payload))
      .subscribe(status => dispatch('realtime-status', { status }));
  }

  function unsubscribeRealtime() {
    if (!client || !realtimeChannel) return;
    client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  async function init() {
    if (!config.url || !config.publishableKey) {
      throw new Error('Falta la configuración de Supabase.');
    }

    const lib = await loadLibrary();
    client = lib.createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      realtime: {
        params: { eventsPerSecond: 20 }
      }
    });

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentSession = data.session || null;

    client.auth.onAuthStateChange((_event, session) => {
      currentSession = session || null;
      if (currentSession) subscribeRealtime();
      else unsubscribeRealtime();
      dispatch('auth', { authenticated: !!currentSession, user: currentSession?.user || null });
    });

    if (currentSession) subscribeRealtime();
    dispatch('ready', { authenticated: !!currentSession, mode: config.mode || 'shadow' });
    return { authenticated: !!currentSession, mode: config.mode || 'shadow' };
  }

  async function signIn(email, password) {
    if (!client) await init();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  window.RageSupabaseBridge = {
    version: VERSION,
    mode: config.mode || 'shadow',
    init,
    signIn,
    signOut,
    getClient: () => client,
    getSession: () => currentSession,
    exportLocalSnapshot: localSnapshot,
    isAuthenticated: () => !!currentSession
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init().catch(error => {
      console.warn('[Rage Supabase] Inicialización en modo sombra:', error);
      dispatch('error', { message: error.message });
    }), { once: true });
  } else {
    init().catch(error => {
      console.warn('[Rage Supabase] Inicialización en modo sombra:', error);
      dispatch('error', { message: error.message });
    });
  }
})();
