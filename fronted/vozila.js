(() => {
  'use strict';
  const SHOP = 'https://hhauto.olx.ba/';
  const $ = (s) => document.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeImage = s => { try { const u = new URL(s, location.href); return ['https:','http:'].includes(u.protocol) ? u.href : './static/hhauto-logo.png'; } catch { return './static/hhauto-logo.png'; } };
  const detailURL = id => `./vozilo.html?id=${encodeURIComponent(id)}`;
  let saved = []; try { const x = JSON.parse(localStorage.getItem('hh-favourites') || '[]'); if(Array.isArray(x)) saved = x.filter(s=>typeof s === 'string'); } catch {}
  let vehicles = [], data = {};
  const status = text => { const el = $('#catalogue-status'); if(el) el.textContent=text; };
  function save(id) {
    saved = saved.includes(id) ? saved.filter(x=>x!==id) : [...saved,id];
    try { localStorage.setItem('hh-favourites',JSON.stringify(saved)); } catch {status('Izbor je sačuvan za ovu posjetu. Preglednik ne dopušta trajno čuvanje.');}
    document.querySelectorAll('[data-save]').forEach(b=>{const yes=saved.includes(b.dataset.save);b.setAttribute('aria-pressed',String(yes));b.classList.toggle('is-saved',yes);b.innerHTML=yes?'♥':'♡';});
    const count=$('#saved-count');if(count)count.textContent=saved.length;
    if($('#saved-only')?.checked) render();
  }
  function price(v) { return `<div class="hh-price">${v.originalPrice && v.originalPrice!==v.price?`<del>${esc(v.originalPrice)}</del>`:''}<strong>${esc(v.price || 'Na upit')}</strong></div>`; }
  function card(v) {
    const a=document.createElement('article'); a.className='hh-card';
    const tag=v.originalPrice && v.originalPrice!==v.price?'Snižena cijena':v.category==='ATV / Quad'?'ATV / Quad':v.condition==='Novo'?'Novo':'Iz ponude';
    a.innerHTML=`<div class="hh-photo"><a href="${detailURL(v.id)}" tabindex="-1" aria-hidden="true"><img src="${esc(safeImage(v.image))}" alt="${esc(v.name)}" loading="lazy" width="640" height="440"></a><span class="hh-tag">${tag}</span><button type="button" class="hh-save ${saved.includes(v.id)?'is-saved':''}" data-save="${esc(v.id)}" aria-label="Sačuvaj ${esc(v.short)}" aria-pressed="${saved.includes(v.id)}">${saved.includes(v.id)?'♥':'♡'}</button></div><div class="hh-card-body"><p class="hh-brand">${esc(v.brand)}</p><h3><a href="${detailURL(v.id)}">${esc(v.short)}</a></h3><div class="hh-specs">${[v.year,v.km,v.fuel,v.transmission].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="hh-card-bottom">${price(v)}<a class="hh-open" href="${detailURL(v.id)}" aria-label="Pogledaj ${esc(v.short)}">Pogledaj <span aria-hidden="true">↗</span></a></div></div>`;
    a.querySelector('[data-save]').addEventListener('click',()=>save(v.id));
    a.querySelector('img').addEventListener('error',function(){this.src='./static/hhauto-logo.png';this.classList.add('hh-image-fallback');},{once:true});
    return a;
  }
  function filters() {const f={};for(const key of ['q','brand','category','price','year','fuel','transmission','sort'])f[key]=$(`[name="${key}"]`)?.value || '';f.saved=$('#saved-only')?.checked || false;return f;}
  function render(updateURL=false) {
    const grid=$('#ponuda'); if(!grid)return;
    const full=!!$('#catalogue-form'), f=filters();const list=full?VehicleCore.select(vehicles,f,saved):vehicles.slice(0,6);
    grid.replaceChildren(...list.map(card));
    if(!list.length)grid.innerHTML=`<div class="hh-empty"><span aria-hidden="true">↗</span><h3>${f.saved?'Nema sačuvanih vozila za ovaj izbor.':'Nema vozila za odabrane kriterije.'}</h3><p>${f.saved?'Dodajte vozila pomoću srca na fotografiji ili proširite pretragu.':'Pokušajte s većim budžetom ili uklonite neki filter.'}</p><button type="button" class="hh-button" id="empty-reset">Prikaži cijelu ponudu</button></div>`;
    $('#empty-reset')?.addEventListener('click',reset);
    if($('#result-count'))$('#result-count').textContent=`${list.length} ${list.length===1?'vozilo':'vozila'}`;
    if($('#saved-count'))$('#saved-count').textContent=saved.length;
    if($('#reset-filters'))$('#reset-filters').hidden=!Object.entries(f).some(([k,v])=>k!=='sort'&&v);
    if(updateURL){const url=new URL(location.href);url.search='';for(const [k,v] of Object.entries(f))if(v)url.searchParams.set(k,String(v));history.replaceState(null,'',url);}
  }
  function reset() {$('#catalogue-form').reset();if($('#sort'))$('#sort').value='';render(true);}
  function fillFilters(){
    for(const key of ['brand','fuel','transmission']){const el=$(`[name="${key}"]`);if(!el)continue;[...new Set(vehicles.map(v=>v[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'bs')).forEach(v=>el.add(new Option(v,v)));}
    const params=new URLSearchParams(location.search);
    for(const key of ['q','brand','category','price','year','fuel','transmission','sort']){const el=$(`[name="${key}"]`);if(el && params.has(key))el.value=params.get(key);}
    $('#saved-only').checked=params.get('saved')==='true';
    $('#catalogue-form').addEventListener('submit',e=>{e.preventDefault();render(true);});
    $('#catalogue-form').addEventListener('input',()=>render(true));
    $('#sort').addEventListener('change',()=>render(true));
    $('#reset-filters').addEventListener('click',reset);
    window.addEventListener('popstate',()=>location.reload());
  }
  function details(){
    const container=$('#vehicle-detail');if(!container)return;
    const v=vehicles.find(x=>x.id===new URLSearchParams(location.search).get('id'));
    if(!v){container.innerHTML='<div class="hh-empty"><h1>Vozilo nije u trenutnoj ponudi.</h1><p>Oglas je možda završen ili je poveznica nepotpuna. Pogledajte ostala vozila ili nas pozovite za provjeru.</p><a class="hh-button" href="./vozila.html">Pogledaj ponudu</a></div>';return;}
    document.title=`${v.short} | HH Auto Travnik`;
    const msg=`Poštovani, zanima me ${v.name} (oglas ${v.id}), cijena ${v.price || 'na upit'}. Molim informacije o dostupnosti i mogućem terminu pregleda.\n${v.url || SHOP}`;
    const mail=`mailto:hhauto.ba@icloud.com?subject=${encodeURIComponent('Upit za '+v.short)}&body=${encodeURIComponent(msg)}`;
    const specs=[['Godište',v.year],['Kilometraža',v.km],['Gorivo',v.fuel],['Mjenjač',v.transmission],['Stanje',v.condition],['Broj oglasa',v.id]].filter(x=>x[1]);
    container.innerHTML=`<nav class="hh-breadcrumb" aria-label="Putanja"><a href="./vozila.html">← Sva vozila</a><span>/ ${esc(v.brand)}</span></nav><div class="hh-detail-layout"><div><div class="hh-detail-photo"><img src="${esc(safeImage(v.image))}" alt="${esc(v.name)}" width="1000" height="700"><span class="hh-tag">${esc(v.condition || 'Iz ponude')}</span></div><p class="hh-caption">Naslovna fotografija vozila. Kompletnu galeriju pogledajte u <a href="${esc(v.url || SHOP)}" target="_blank" rel="noopener">OLX oglasu ↗</a>.</p><section class="hh-detail-section"><p class="hh-eyebrow">Podaci o vozilu</p><h2>Detalji koji su bitni.</h2><dl class="hh-detail-specs">${specs.map(([k,val])=>`<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}</dl>${v.transmission&&!v.transmissionVerified?'<p class="hh-caption">Mjenjač je naveden prema naslovu oglasa. Potvrdite podatak pri upitu.</p>':''}</section><section class="hh-detail-section"><h2>Prije nego krenete na put</h2><p>Javite nam za koje ste vozilo zainteresovani. Provjerite trenutnu dostupnost, stanje i cijenu, zatražite informacije o servisnoj evidenciji i dogovorite pregled u Travniku.</p><p class="hh-listing-title">Naziv oglasa: ${esc(v.name)}</p></section></div><aside class="hh-detail-summary"><p class="hh-eyebrow">HH Auto · Travnik</p><h1>${esc(v.short)}</h1><p class="hh-summary-specs">${[v.year,v.km,v.fuel].filter(Boolean).map(esc).join(' · ')}</p>${price(v)}<p class="hh-caption">Cijena iz posljednjeg ažuriranja ponude. Uključene troškove i dostupnost potvrdite s nama.</p><a class="hh-button" href="tel:+38761696704">Pozovi 061 696 704 ↗</a><a class="hh-button hh-button-outline" href="${mail}">Pošalji upit za ovo vozilo</a><button class="hh-share" id="share-vehicle" type="button">Kopiraj link vozila ↗</button><p id="share-status" role="status"></p><hr><p><strong>Dođite pogledati vozilo.</strong><br>Mostarska bb, Travnik</p><a class="hh-text-link" href="https://www.google.com/maps/search/?api=1&query=HH+Auto+Travnik" target="_blank" rel="noopener">Otvori navigaciju ↗</a><p class="hh-caption" data-vehicles-info></p></aside></div><section class="hh-related"><div class="hh-results"><h2>Još iz naše ponude</h2><a href="./vozila.html">Sva vozila ↗</a></div><div id="related-grid" class="hh-grid"></div></section>`;
    $('#related-grid').replaceChildren(...vehicles.filter(x=>x.id!==v.id&&x.category===v.category).slice(0,3).map(card));
    $('#share-vehicle').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#share-status').textContent='Link je kopiran.';}catch{$('#share-status').textContent='Link možete kopirati iz adresne trake preglednika.';}});
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    try{const response=await fetch('./data/vozila.json',{cache:'no-store'});if(!response.ok)throw Error('Ponuda nije dostupna');data=await response.json();if(!Array.isArray(data.vehicles))throw Error('Neispravni podaci');vehicles=data.vehicles.filter(v=>v.id&&v.name).map(VehicleCore.normalize);if($('#catalogue-form'))fillFilters();details();render();
      const date=new Date(data.updatedAt);const text=Number.isNaN(date.getTime())?'Dostupnost potvrdite prije dolaska.':`Ponuda ažurirana ${date.toLocaleString('bs-BA',{day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}`;
      document.querySelectorAll('[data-vehicles-info]').forEach(el=>el.textContent=text);if($('#total-count'))$('#total-count').textContent=vehicles.length;
    }catch(error){const el=$('#ponuda')||$('#vehicle-detail');if(el)el.innerHTML=`<div class="hh-empty"><h2>Ponuda trenutno nije dostupna.</h2><p>Pokušajte ponovo ili otvorite naše oglase direktno.</p><a class="hh-button" href="${SHOP}" target="_blank" rel="noopener">Otvori OLX ponudu ↗</a></div>`;status('Učitavanje ponude nije uspjelo.');document.querySelectorAll('[data-vehicles-info]').forEach(el=>el.textContent='Dostupnost provjerite pozivom ili na OLX-u.');}
  });
})();
