/* =========================
   GESTION DES COOKIES — CLAN FRANCAIS
   -------------------------------------------------
   Utilisation :
   1. Ajoute <script src="cookies.js" defer></script> avant </body> sur chaque page.
   2. Un lien ou bouton avec l'attribut data-cookie-settings rouvre les réglages.
   3. Pour un script soumis à consentement, écris-le ainsi :
        <script type="text/plain" data-cookie="analytics" src="..."></script>
      Il ne sera lancé que si le visiteur accepte la catégorie "analytics".
========================= */

(function () {
  const STORAGE_KEY = "cf_cookie_consent";
  const VERSION = 1; // augmente ce numéro si tu ajoutes une catégorie : le bandeau sera redemandé
  const DURATION_DAYS = 180; // 6 mois, comme recommandé par la CNIL

  /* ---------- Catégories (modifie ici) ---------- */
  const CATEGORIES = [
    {
      id: "necessary",
      label: "Cookies nécessaires",
      description:
        "Indispensables au site : connexion à ton compte, sécurité, mémorisation de tes choix de cookies. Ils ne peuvent pas être désactivés.",
      required: true,
    },
    {
      id: "analytics",
      label: "Mesure d’audience",
      description:
        "Nous aident à savoir combien de personnes visitent le site et quelles pages sont les plus vues, pour l’améliorer.",
    },
    {
      id: "external",
      label: "Contenus externes",
      description:
        "Permettent d’afficher des contenus d’autres sites (vidéos YouTube, widgets Discord…), qui peuvent déposer leurs propres cookies.",
    },
  ];

  /* ---------- Lecture / écriture du choix ---------- */
  function readConsent() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data || data.v !== VERSION) return null;
      if (Date.now() - data.date > DURATION_DAYS * 86400000) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(choices) {
    const data = { v: VERSION, date: Date.now(), choices };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* navigation privée : le choix ne sera pas mémorisé */
    }
    consent = data;
    applyConsent();
    document.dispatchEvent(new CustomEvent("cf-cookies-change", { detail: choices }));
  }

  let consent = readConsent();

  function allowed(category) {
    if (category === "necessary") return true;
    return Boolean(consent && consent.choices && consent.choices[category]);
  }

  /* ---------- Active les scripts autorisés ---------- */
  function applyConsent() {
    document.querySelectorAll('script[type="text/plain"][data-cookie]').forEach((old) => {
      if (!allowed(old.dataset.cookie)) return;
      const script = document.createElement("script");
      [...old.attributes].forEach((attr) => {
        if (attr.name !== "type" && attr.name !== "data-cookie") script.setAttribute(attr.name, attr.value);
      });
      script.text = old.text;
      old.replaceWith(script);
    });
  }

  /* ---------- Styles ---------- */
  const css = `
    .cfc-banner, .cfc-modal { font-family: "Baloo 2", Arial, sans-serif; color: #f1ece1; }
    .cfc-banner {
      position: fixed; left: 20px; bottom: 20px; z-index: 1200;
      width: min(560px, calc(100% - 40px));
      padding: 24px 24px 20px;
      background: #141418;
      border: 1px solid rgba(255,255,255,.18);
      box-shadow: 0 24px 60px rgba(0,0,0,.55);
      animation: cfcIn .35s cubic-bezier(.2,.8,.2,1) both;
    }
    .cfc-banner::before, .cfc-box::before {
      content: ""; position: absolute; top: -1px; left: -1px; right: -1px; height: 4px;
      background: linear-gradient(90deg, #2448e8 0 33%, #f4f4f4 33% 66%, #eb1212 66%);
    }
    .cfc-title {
      margin: 0 0 8px; font-family: "Archivo Black", Arial, sans-serif;
      font-size: 20px; font-weight: 400; text-transform: uppercase; letter-spacing: 0;
    }
    .cfc-text { margin: 0; color: #cfcac0; font-size: 14.5px; line-height: 1.6; }
    .cfc-text a { color: #8fa8ff; border-bottom: 1px solid rgba(143,168,255,.4); }
    .cfc-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
    .cfc-btn {
      flex: 1 1 auto; padding: 11px 16px; cursor: pointer;
      border: 2px solid #f1ece1; background: transparent; color: #f1ece1;
      font-family: inherit; font-size: 13px; font-weight: 800;
      letter-spacing: .06em; text-transform: uppercase;
      transition: transform .12s, box-shadow .12s, background .2s, color .2s;
    }
    .cfc-btn:hover { transform: translate(-2px,-2px); box-shadow: 2px 2px 0 #f1ece1; }
    .cfc-btn:focus-visible { outline: 2px solid #8fa8ff; outline-offset: 2px; }
    .cfc-btn.cfc-solid { background: #f1ece1; color: #0e0f12; }
    .cfc-btn.cfc-solid:hover { box-shadow: 2px 2px 0 #e63027; }
    .cfc-link {
      flex-basis: 100%; padding: 4px 0 0; border: 0; background: none; cursor: pointer;
      color: #b9b3a6; font-family: inherit; font-size: 13px; font-weight: 700;
      text-decoration: underline; text-underline-offset: 3px; text-align: center;
    }
    .cfc-link:hover { color: #fff; }

    .cfc-modal {
      position: fixed; inset: 0; z-index: 1300;
      display: flex; align-items: center; justify-content: center; padding: 20px;
      background: rgba(0,0,0,.75); backdrop-filter: blur(6px);
    }
    .cfc-box {
      position: relative; width: min(560px, 100%); max-height: 90vh; overflow-y: auto;
      padding: 28px 26px 22px; background: #141418;
      border: 1px solid rgba(255,255,255,.18); box-shadow: 0 25px 80px rgba(0,0,0,.6);
      animation: cfcIn .3s cubic-bezier(.2,.8,.2,1) both;
    }
    .cfc-close {
      position: absolute; top: 10px; right: 14px; border: 0; background: none;
      color: #fff; font-size: 28px; line-height: 1; cursor: pointer;
    }
    .cfc-cat { padding: 16px 0; border-bottom: 1px solid rgba(241,236,225,.12); }
    .cfc-cat:first-of-type { margin-top: 14px; border-top: 1px solid rgba(241,236,225,.18); }
    .cfc-cat-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .cfc-cat-head strong { font-size: 15.5px; }
    .cfc-cat p { margin: 6px 0 0; color: #a9a49a; font-size: 13.5px; line-height: 1.55; }
    .cfc-always {
      color: #8f8a80; font-family: "JetBrains Mono", monospace; font-size: 11px;
      font-weight: 700; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap;
    }
    .cfc-switch { position: relative; flex-shrink: 0; width: 46px; height: 26px; }
    .cfc-switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
    .cfc-switch span {
      position: absolute; inset: 0; border: 2px solid #f1ece1; background: transparent;
      transition: background .2s;
    }
    .cfc-switch span::after {
      content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px;
      background: #f1ece1; transition: transform .2s, background .2s;
    }
    .cfc-switch input:checked + span { background: #2448e8; border-color: #2448e8; }
    .cfc-switch input:checked + span::after { transform: translateX(20px); background: #fff; }
    .cfc-switch input:focus-visible + span { outline: 2px solid #8fa8ff; outline-offset: 2px; }

    @keyframes cfcIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

    @media (max-width: 600px) {
      .cfc-banner { left: 10px; right: 10px; bottom: 10px; width: auto; padding: 20px 16px 16px; }
      .cfc-btn { flex-basis: calc(50% - 5px); }
      .cfc-btn.cfc-solid { flex-basis: 100%; order: -1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .cfc-banner, .cfc-box { animation: none; }
    }
  `;

  /* ---------- Bandeau ---------- */
  let banner = null;

  function showBanner() {
    if (banner) return;
    banner = document.createElement("div");
    banner.className = "cfc-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Gestion des cookies");
    banner.innerHTML = `
      <h2 class="cfc-title">🍪 Cookies</h2>
      <p class="cfc-text">
        Le Clan Francais utilise des cookies nécessaires au fonctionnement du site et, avec ton accord,
        des cookies de mesure d’audience et de contenus externes. Tu peux changer d’avis à tout moment.
        <a href="politique-confidentialite.html#cookies">En savoir plus</a>
      </p>
      <div class="cfc-actions">
        <button type="button" class="cfc-btn" data-cfc="refuse">Tout refuser</button>
        <button type="button" class="cfc-btn cfc-solid" data-cfc="accept">Tout accepter</button>
        <button type="button" class="cfc-link" data-cfc="custom">Personnaliser mes choix</button>
      </div>`;
    banner.addEventListener("click", (e) => {
      const action = e.target.closest("[data-cfc]");
      if (!action) return;
      if (action.dataset.cfc === "accept") choose(true);
      if (action.dataset.cfc === "refuse") choose(false);
      if (action.dataset.cfc === "custom") openSettings();
    });
    document.body.appendChild(banner);
  }

  function hideBanner() {
    if (banner) banner.remove();
    banner = null;
  }

  function choose(all) {
    const choices = {};
    CATEGORIES.forEach((c) => {
      if (!c.required) choices[c.id] = all;
    });
    saveConsent(choices);
    hideBanner();
  }

  /* ---------- Fenêtre "Personnaliser" ---------- */
  function openSettings() {
    closeSettings();
    const modal = document.createElement("div");
    modal.className = "cfc-modal";
    modal.id = "cfcModal";

    const cats = CATEGORIES.map((c) => {
      const control = c.required
        ? `<span class="cfc-always">Toujours actifs</span>`
        : `<label class="cfc-switch"><input type="checkbox" data-cat="${c.id}" ${allowed(c.id) ? "checked" : ""}
             aria-label="${c.label}" /><span></span></label>`;
      return `
        <div class="cfc-cat">
          <div class="cfc-cat-head"><strong>${c.label}</strong>${control}</div>
          <p>${c.description}</p>
        </div>`;
    }).join("");

    modal.innerHTML = `
      <div class="cfc-box" role="dialog" aria-modal="true" aria-labelledby="cfcTitle">
        <button type="button" class="cfc-close" data-cfc="close" aria-label="Fermer">×</button>
        <h2 class="cfc-title" id="cfcTitle">Préférences cookies</h2>
        <p class="cfc-text">Choisis les cookies que tu acceptes. Tes choix sont gardés 6 mois.</p>
        ${cats}
        <div class="cfc-actions">
          <button type="button" class="cfc-btn" data-cfc="refuse">Tout refuser</button>
          <button type="button" class="cfc-btn" data-cfc="accept">Tout accepter</button>
          <button type="button" class="cfc-btn cfc-solid" data-cfc="save">Enregistrer mes choix</button>
        </div>
      </div>`;

    modal.addEventListener("click", (e) => {
      if (e.target === modal) return closeSettings();
      const action = e.target.closest("[data-cfc]");
      if (!action) return;
      const type = action.dataset.cfc;
      if (type === "close") return closeSettings();
      if (type === "accept") choose(true);
      if (type === "refuse") choose(false);
      if (type === "save") {
        const choices = {};
        modal.querySelectorAll("input[data-cat]").forEach((input) => {
          choices[input.dataset.cat] = input.checked;
        });
        saveConsent(choices);
        hideBanner();
      }
      closeSettings();
    });

    document.body.appendChild(modal);
    modal.querySelector(".cfc-close").focus();
  }

  function closeSettings() {
    const modal = document.getElementById("cfcModal");
    if (modal) modal.remove();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSettings();
  });

  /* ---------- Lien "Gérer les cookies" ---------- */
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-cookie-settings]");
    if (!trigger) return;
    e.preventDefault();
    openSettings();
  });

  /* ---------- Démarrage ---------- */
  function init() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    applyConsent();
    if (!consent) showBanner();
  }

  // Accessible depuis tes autres scripts : CFCookies.allowed("analytics"), CFCookies.open()
  window.CFCookies = { allowed, open: openSettings };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
