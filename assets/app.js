(function(){
const D = window.DATA, $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const parse = s => { const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(s || ''); return m ? new Date(+m[3], +m[2]-1, +m[1]) : null; };
const today = new Date(); today.setHours(0,0,0,0);
const jours = s => { const d = parse(s); return d ? Math.round((d - today) / 864e5) : null; };
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2600); };
const copier = (txt, msg) => {
  const ok = () => toast(msg);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, () => fallback());
  else fallback();
  function fallback(){ const t = document.createElement('textarea'); t.value = txt; t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select(); try{document.execCommand('copy'); ok();}catch(e){toast('Copie impossible sur cet appareil');} t.remove(); }
};
document.querySelectorAll('#maj, .maj-d').forEach(e => e.textContent = (e.id === 'maj' ? 'Mis à jour le ' : '') + D.maj);

const ouverts = D.ao.filter(a => (jours(a.limite) ?? 1) >= 0);
$('#kpis').innerHTML = [
  [ouverts.length, "appels d'offres ouverts"],
  [D.marques.length, 'marques avec un signal récent'],
  [D.sponsors.length, 'sponsors possibles pour ADICOM Days']
].map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join('');

/* Appels d'offres */
const ZONES = [['Tous', () => true], ["Côte d'Ivoire", a => /Ivoire|UEMOA/.test(a.pays)], ["Afrique de l'Ouest", a => /Ivoire|UEMOA|Sénégal|Burkina|Nigeria/.test(a.pays)], ['Reste du continent', a => !/Ivoire|UEMOA|Sénégal|Burkina|Nigeria/.test(a.pays)]];
let zone = 0;
function ao(){
  const L = D.ao.filter(ZONES[zone][1]).slice().sort((a, b) => (parse(a.limite) || 0) - (parse(b.limite) || 0));
  $('#ao-f').innerHTML = ZONES.map(([n, f], i) => `<button class="chip ${i === zone ? 'on' : ''}" data-z="${i}">${n}<i>${D.ao.filter(f).length}</i></button>`).join('');
  $('#ao-list').innerHTML = L.length ? L.map((a, i) => {
    const j = jours(a.limite), clos = j !== null && j < 0, urg = j !== null && j >= 0 && j <= 7;
    const lab = j === null ? '' : clos ? 'clos' : j === 0 ? "aujourd'hui" : j === 1 ? 'jour restant' : 'jours restants';
    return `<article class="card"><div class="dl ${urg ? 'urgent' : ''} ${clos ? 'clos' : ''}"><b>${j === null ? '?' : clos ? '–' : j}</b><span>${lab}</span><small>${esc(a.limite)}</small></div>
    <div><span class="tag">${esc(a.pole)}</span><h3 style="margin-top:8px">${esc(a.titre)}</h3>
    <div class="meta"><span><b>${esc(a.acheteur)}</b></span><span>${esc(a.pays)}</span><span>${esc(a.type)}</span><span>Réf. ${esc(a.ref)}</span><span>Publié : ${esc(a.publie)}</span></div>
    <p class="note">${a.heure ? 'Limite : ' + esc(a.limite) + ', ' + esc(a.heure) + '. ' : ''}${esc(a.note)} Contact : ${esc(a.contact)}.</p></div>
    <div class="acts"><a class="btn" href="${esc(a.lien)}" target="_blank" rel="noopener">Ouvrir l'avis</a><button class="btn ghost" data-cu="ao:${D.ao.indexOf(a)}">Ajouter à ClickUp</button></div></article>`;
  }).join('') : '<p class="vide">Aucun avis dans cette zone.</p>';
}
$('#ao-f').addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (b){ zone = +b.dataset.z; ao(); } });
ao();

/* Marques */
$('#ma-list').innerHTML = D.marques.map((m, i) => `<article class="card"><div class="dl">${parse(m.date) ? `<b style="font-size:20px">${esc(m.date.slice(0, 5))}</b><span>${esc(m.date.slice(6))}</span>` : `<b style="font-size:15px">${esc(m.date)}</b>`}</div>
  <div><span class="tag ${m.statut === 'Client' ? 'client' : ''}">${m.statut === 'Client' ? 'Déjà client' : esc(m.secteur)}</span><h3 style="margin-top:8px">${esc(m.marque)}</h3>
  <p class="note" style="margin-top:6px">${esc(m.signal)}.</p>
  <div class="meta"><span><b>Angle :</b> ${esc(m.angle)}</span></div>
  <div class="meta"><span><b>Contact :</b> ${esc(m.contact)}</span></div></div>
  <div class="acts"><a class="btn" href="${esc(m.lien)}" target="_blank" rel="noopener">Voir la source</a><button class="btn ghost" data-cu="ma:${i}">Ajouter à ClickUp</button></div></article>`).join('');

/* Sponsors */
const SF = [['Tous', () => true], ['Déjà partenaires', s => s.statut !== 'Nouvelle cible'], ['Nouvelles cibles', s => s.statut === 'Nouvelle cible']];
let sf = 0;
function sp(){
  $('#sp-f').innerHTML = SF.map(([n, f], i) => `<button class="chip ${i === sf ? 'on' : ''}" data-s="${i}">${n}<i>${D.sponsors.filter(f).length}</i></button>`).join('');
  $('#sp-list').innerHTML = D.sponsors.filter(SF[sf][1]).map(s => { const i = D.sponsors.indexOf(s); const ask = /demander/.test(s.contact);
    return `<div class="sp"><span class="tag ${s.statut === 'Nouvelle cible' ? '' : 'client'}">${s.statut === 'Nouvelle cible' ? 'Nouvelle cible' : 'Déjà partenaire'}</span><h3>${esc(s.nom)}</h3><span class="sec">${esc(s.secteur)}</span><p class="why">${esc(s.pourquoi)}</p><p class="ct ${ask ? 'ask' : ''}">${ask ? 'Contact : à demander' : esc(s.contact)}</p><button class="btn ghost" data-cu="sp:${i}">Ajouter à ClickUp</button></div>`; }).join('');
}
$('#sp-f').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b){ sf = +b.dataset.s; sp(); } });
sp();
$('#sp-src').innerHTML = `Partenaires des éditions passées : page « Partenaires / Sponsors » d'ADICOM Days, <a href="${esc(D.source_sponsors)}" target="_blank" rel="noopener">copie archivée le 10/07/2026</a>.`;

/* ClickUp */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cu]'); if (!b) return;
  const [k, i] = b.dataset.cu.split(':'); let t;
  if (k === 'ao'){ const a = D.ao[i]; t = `[Appel d'offres] ${a.titre}\nAcheteur : ${a.acheteur} (${a.pays})\nType : ${a.type} · Réf. ${a.ref}\nDate limite : ${a.limite}${a.heure ? ', ' + a.heure : ''}\nPôle : ${a.pole}\nContact : ${a.contact}\nAvis : ${a.lien}`; }
  if (k === 'ma'){ const m = D.marques[i]; t = `[Prospect] ${m.marque}\nSignal : ${m.signal} (${m.date})\nAngle : ${m.angle}\nContact : ${m.contact}\nSource : ${m.lien}`; }
  if (k === 'sp'){ const s = D.sponsors[i]; t = `[Sponsor ADICOM Days] ${s.nom}\nSecteur : ${s.secteur}\nStatut : ${s.statut}\nPourquoi : ${s.pourquoi}\nContact : ${s.contact}`; }
  copier(t, 'Fiche copiée : collez-la dans une nouvelle tâche ClickUp');
});

/* Pitch */
const F = s => `<span class="fill">[${s}]</span>`;
$('#pitch-doc').innerHTML = `<img class="p-logo" src="assets/logo.png" alt="Totem Experience">
<h3>${F('Marque')} : ${F('le lancement ou le projet repéré')}, porté jusqu'à votre public</h3>
<p>Bonjour ${F('Prénom')}, nous avons vu ${F('le signal public : lancement, ouverture, nomination')}. C'est exactement le type de moment que nous accompagnons à Abidjan et en Afrique francophone.</p>
<h4>Ce que nous proposons</h4>
<ul><li>${F('Idée en une phrase, adaptée à la marque')}</li><li>${F('Ce que le public verra : campagne, contenus, événement')}</li><li>${F('Le résultat attendu, sans chiffre promis avant cadrage')}</li></ul>
<h4>Trois pôles, un seul interlocuteur</h4>
<div class="poles"><div><b>TX Agency</b>Stratégie, campagnes, réseaux sociaux</div><div><b>TX Factory</b>Production vidéo, photo et contenus</div><div><b>ADICOM Days</b>Événement, créateurs et communauté digitale</div></div>
<h4>Ils nous font confiance</h4>
<p>Orange, Canal+, Air France, Glovo, Coca-Cola. ${F('Cas le plus proche de la marque, en une ligne')}</p>
<h4>Prochaine étape</h4>
<p>Trente minutes pour vous présenter deux pistes concrètes, ${F('jour proposé')} ou ${F('second jour')}. Le budget se cadre ensemble, en FCFA, après cet échange.</p>
<p style="margin-top:18px"><b>${F('Prénom Nom')}</b> · ${F('Fonction')} · Totem Experience · ${F('téléphone')} · ${F('e-mail')}</p>`;
$('#copy-pitch').addEventListener('click', () => copier($('#pitch-doc').innerText.trim(), 'Texte du pitch copié'));

/* Onglets */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
  document.querySelectorAll('.onglet').forEach(s => s.hidden = s.id !== t.dataset.t);
  history.replaceState(null, '', '#' + t.dataset.t);
}));
const h = location.hash.slice(1); const t0 = document.querySelector(`.tab[data-t="${h}"]`); if (t0) t0.click();
})();
