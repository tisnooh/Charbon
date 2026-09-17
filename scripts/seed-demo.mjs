/**
 * Crée un compte de démonstration AVEC données réelles (via l'API, aucun
 * accès direct à la base) :
 *   email    : demo@charbon.app
 *   password : demo-12345
 * Contenu : 1 objectif, 2 habitudes (dont une avec série de 3 jours),
 * 1 routine matin (3 actions), 2 tâches (1 à faire aujourd'hui, 1 faite),
 * validations antidatées pour des statistiques non vides.
 *
 * Usage : serveur démarré puis `npm run seed:demo`
 *       (ou DEMO_BASE=http://hote:port npm run seed:demo)
 * Idempotent : si le compte existe, il est reconnecté et complété seulement
 * si nécessaire (les appels idempotents de l'API gèrent les doublons).
 */
const BASE = (process.env.DEMO_BASE ?? 'http://127.0.0.1:3000') + '/api/v1';
const EMAIL = 'demo@charbon.app';
const PASSWORD = 'demo-12345';

async function req(path, opts = {}, cookie) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
  });
  return res;
}

function cookieOf(res) {
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')];
  return raw[0]?.split(';')[0];
}

const isoDay = (offset) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString().slice(0, 10);
};

async function main() {
  let res = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Camille Démo', email: EMAIL, password: PASSWORD, timezone: 'Europe/Paris' }),
  });
  let cookie;
  if (res.status === 201) {
    cookie = cookieOf(res);
    console.log('✓ compte démo créé');
  } else if (res.status === 409) {
    res = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
    if (res.status !== 200) throw new Error('login démo impossible : ' + res.status);
    cookie = cookieOf(res);
    console.log('✓ compte démo existant → reconnecté');
  } else {
    throw new Error('register inattendu : ' + res.status + ' ' + (await res.text()));
  }

  const me = await (await req('/me', {}, cookie)).json();

  if (!me.user.onboardingCompleted) {
    res = await req(
      '/onboarding',
      {
        method: 'POST',
        body: JSON.stringify({
          goals: [{ title: 'Être plus constant' }],
          habits: [{ name: 'Lire 10 minutes' }, { name: 'Marcher 20 minutes' }],
          routines: [
            { name: 'Routine matin', timeOfDay: 'morning', items: [{ title: 'Verre d’eau' }, { title: 'Étirements' }, { title: 'Pas de téléphone' }] },
          ],
        }),
      },
      cookie,
    );
    if (res.status !== 201) throw new Error('onboarding démo : ' + res.status);
    console.log('✓ onboarding seedé');
  }

  // Habitudes : série de 3 jours (J-2, J-1) sur la première habitude.
  const habits = (await (await req('/habits', {}, cookie)).json()).items;
  const h1 = habits.find((h) => h.name === 'Lire 10 minutes');
  if (h1) {
    for (const off of [-2, -1]) {
      await req(`/habits/${h1.id}/completions`, { method: 'POST', body: JSON.stringify({ date: isoDay(off) }) }, cookie);
    }
    console.log('✓ série de 3 jours (J-2, J-1, aujourd’hui à valider)');
  }

  // Tâches : une à faire aujourd'hui, une faite.
  const due = new Date(Date.now() + 3 * 3600_000).toISOString();
  const t1 = await req('/tasks', { method: 'POST', body: JSON.stringify({ title: 'Préparer ma journée de demain', dueAt: due }) }, cookie);
  if (t1.status === 201) console.log('✓ tâche à faire créée');
  const t2 = await req('/tasks', { method: 'POST', body: JSON.stringify({ title: 'Étirer le dos', dueAt: due }) }, cookie);
  if (t2.status === 201) {
    await req(`/tasks/${t2.json().id}/complete`, { method: 'POST' }, cookie);
    console.log('✓ tâche terminée créée');
  }

  console.log(`\nCompte de démonstration prêt :`);
  console.log(`  URL   : ${BASE.replace('/api/v1', '')}/app/  (ou http://localhost:5173 en dev)`);
  console.log(`  email : ${EMAIL}`);
  console.log(`  mdp   : ${PASSWORD}`);
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
