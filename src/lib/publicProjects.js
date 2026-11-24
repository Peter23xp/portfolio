// src/lib/publicProjects.js
// Lecture publique des projets classés, via l'API REST de Supabase directement :
// le site public n'embarque pas le client supabase-js (~40 KB gz), réservé à
// l'admin. Même requête que fetchPublicProjects() de supabase.ts : tout sauf
// « cache » et les dépôts privés, mis en avant d'abord, puis l'ordre manuel.

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export async function fetchPublicProjects() {
  if (!url || !anonKey) throw new Error('Supabase non configuré');
  const query = new URLSearchParams({
    select: '*',
    category: 'neq.cache',
    is_private: 'eq.false',
    order: 'is_featured.desc,display_order.asc',
  });
  const res = await fetch(`${url}/rest/v1/portfolio_projects?${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}
