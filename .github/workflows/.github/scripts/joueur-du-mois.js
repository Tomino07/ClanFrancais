// Joueur du mois : calcule le classement du mois en cours à partir de
//   - la guerre : points gagnés dans les courses terminées ce mois-ci + la course en cours
//   - les dons : cumulés sur le mois (le compteur du jeu repart à 0 chaque semaine)
//   - les trophées gagnés : d'après data/progression/<TAG>.json
// Lancé par .github/workflows/classement.yml, juste après la récupération des données.
const fs = require('fs');

const lire = (fichier, defaut) => {
  try { return JSON.parse(fs.readFileSync(fichier, 'utf8')); } catch { return defaut; }
};
const NOTRE_CLAN = '#LJ8GVLQC';
const maintenant = new Date();
const mois = maintenant.toISOString().slice(0, 7); // ex. "2026-10"
const libelle = maintenant.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
const dateCR = t => new Date(t.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*$/, '$1-$2-$3T$4:$5:$6Z'));

const clan = lire('clan.json', { memberList: [] });
const log = lire('log.json', { items: [] });
const course = lire('cur.json', {});
const membres = clan.memberList || [];
if (!membres.length) process.exit(0);

// --- Guerre : courses terminées ce mois-ci + course en cours
const guerre = {};
const ajouterGuerre = participants => (participants || []).forEach(p => { guerre[p.tag] = (guerre[p.tag] || 0) + (p.fame || 0); });
for (const w of log.items || []) {
  if (!w.createdDate || dateCR(w.createdDate) < debutMois) continue;
  const nous = (w.standings || []).find(s => s.clan && s.clan.tag === NOTRE_CLAN);
  if (nous) ajouterGuerre(nous.clan.participants);
}
const nousCourse = (course.clans || []).find(c => c.tag === NOTRE_CLAN);
if (nousCourse) ajouterGuerre(nousCourse.participants);

// --- Dons : on additionne ce qui a été donné depuis le passage précédent
const suivi = lire('data/dons-suivi.json', { dernier: {}, mois: {} });
suivi.mois[mois] = suivi.mois[mois] || {};
// Premier lancement : on part des dons déjà faits cette semaine (compteur du jeu)
if (!suivi.initialise) {
  for (const m of membres) {
    suivi.mois[mois][m.tag] = Math.max(suivi.mois[mois][m.tag] || 0, m.donations);
    suivi.dernier[m.tag] = m.donations;
  }
  suivi.initialise = true;
}
for (const m of membres) {
  const avant = suivi.dernier[m.tag];
  const delta = avant == null ? 0 : m.donations >= avant ? m.donations - avant : m.donations; // remise à 0 hebdo
  suivi.mois[mois][m.tag] = (suivi.mois[mois][m.tag] || 0) + delta;
  suivi.dernier[m.tag] = m.donations;
}
for (const k of Object.keys(suivi.mois).sort().slice(0, -3)) delete suivi.mois[k]; // garder 3 mois
fs.writeFileSync('data/dons-suivi.json', JSON.stringify(suivi));

// --- Trophées gagnés ce mois-ci (d'après la courbe de progression)
const gainTrophees = tag => {
  const h = lire('data/progression/' + tag.slice(1) + '.json', []);
  if (!h.length) return 0;
  const base = [...h].reverse().find(p => new Date(p.d) < debutMois) || h[0];
  return Math.max(0, h[h.length - 1].t - base.t);
};

// --- Score sur 100 : guerre 50 %, dons 25 %, trophées 25 % (chaque critère comparé au meilleur du clan)
const lignes = membres.map(m => ({
  tag: m.tag.slice(1),
  nom: m.name,
  role: m.role,
  guerre: guerre[m.tag] || 0,
  dons: suivi.mois[mois][m.tag] || 0,
  trophees: gainTrophees(m.tag)
}));
const max = k => Math.max(1, ...lignes.map(l => l[k]));
const [mG, mD, mT] = [max('guerre'), max('dons'), max('trophees')];
lignes.forEach(l => { l.score = Math.round(50 * l.guerre / mG + 25 * l.dons / mD + 25 * l.trophees / mT); });
lignes.sort((a, b) => b.score - a.score || b.guerre - a.guerre);

// --- Changement de mois : le gagnant du mois précédent rejoint l'historique
const ancien = lire('data/joueur-du-mois.json', { historique: [] });
const historique = ancien.historique || [];
if (ancien.mois && ancien.mois !== mois && ancien.classement && ancien.classement.length) {
  historique.unshift({ mois: ancien.mois, libelle: ancien.libelle, ...ancien.classement[0] });
}

fs.writeFileSync('data/joueur-du-mois.json', JSON.stringify({
  mois,
  libelle,
  majAt: maintenant.toISOString(),
  classement: lignes.slice(0, 5),
  historique: historique.slice(0, 12)
}, null, 2));
