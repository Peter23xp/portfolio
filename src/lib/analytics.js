// src/lib/analytics.js
// Mesure d'audience respectueuse, stockée dans Supabase (table portfolio_events,
// migration 006). Pas de cookie, pas d'adresse IP, pas d'empreinte : un
// identifiant de visite aléatoire en sessionStorage (oublié à la fermeture de
// l'onglet). Rien n'est envoyé si « Do Not Track » est actif, en local, ou
// depuis le navigateur de l'admin (marqué à la connexion).

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const OPT_OUT_KEY = 'pa-no-track';

const disabled = () =>
  !url || !anonKey ||
  typeof window === 'undefined' ||
  navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
  /^(localhost|127\.|192\.168\.)/.test(location.hostname) ||
  localStorage.getItem(OPT_OUT_KEY) === '1';

function sessionId() {
  let id = sessionStorage.getItem('pa-sid');
  if (!id) {
    id = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)).slice(0, 36);
    sessionStorage.setItem('pa-sid', id);
  }
  return id;
}

function referrerHost() {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname.replace(/^www\./, '');
    return host === location.hostname ? null : host.slice(0, 80);
  } catch {
    return null;
  }
}

/**
 * Enregistre un évènement.
 * type : page_view | cv_view | cv_download | contact_click | case_view | context_select | project_click
 */
export function track(type, label = null) {
  if (disabled()) return;
  const body = {
    type,
    label: label ? String(label).slice(0, 80) : null,
    path: location.pathname.slice(0, 120),
    session_id: sessionId(),
    referrer_host: referrerHost(),
    device: matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
    lang: (document.documentElement.lang || 'fr').slice(0, 5),
  };
  fetch(`${url}/rest/v1/portfolio_events`, {
    method: 'POST',
    keepalive: true,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}
