/* Shared catalogue rules. Unknown values remain unknown. */
(function(root) {
  const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const number = value => { const s = String(value || ''); return /\d/.test(s) ? Number(s.replace(/[^\d]/g, '')) : null; };
  const brands = ['Volkswagen','Mercedes-Benz','Land Rover','Škoda','Audi','BMW','Ford','Seat','Porsche','Peugeot','Kia','Renault','Citroen','Volvo','Opel','Toyota','BENDA','LINHAI'];
  function normalize(v, index = 0) {
    const name = String(v.name || 'Vozilo');
    const brand = brands.find(b => fold(name).startsWith(fold(b))) || (/^vw\b/i.test(name) ? 'Volkswagen' : name.split(' ')[0]);
    const auto = /\b(automatik|automatic|automatski|dsg|s[ -]?tronic|tiptronic|tiptronik|[789]g[ -]?tronic)\b/i.test(name);
    const manual = /\b(manuelni|rucni|ručni)\b/i.test(name);
    const transmission = v.transmission || (auto ? 'Automatik' : manual ? 'Manuelni' : '');
    const category = /\b(benda|linhai|atv|quad|utv)\b/i.test(name) ? 'ATV / Quad' : 'Automobili i kombiji';
    const short = name.replace(/\s+(UVOZ|REG(?:ISTROVAN|IST)?\.?|SERVISIRANO|GARANCIJA)\b.*$/i, '').replace(/\s*[-–]\s*$/, '');
    return {...v, name, brand, transmission, category, short, index, priceNumber:number(v.price), kmNumber:number(v.km), yearNumber:number(v.year)};
  }
  function select(vehicles, f, saved = []) {
    const list = vehicles.filter(v => (!f.q || fold(v.name).includes(fold(f.q))) && (!f.brand || v.brand === f.brand) && (!f.category || v.category === f.category) && (!f.fuel || v.fuel === f.fuel) && (!f.transmission || v.transmission === f.transmission) && (!f.price || (v.priceNumber !== null && v.priceNumber <= Number(f.price))) && (!f.year || (v.yearNumber !== null && v.yearNumber >= Number(f.year))) && (!f.saved || saved.includes(v.id)));
    const numeric = (key, descending = false) => (a,b) => a[key] === null ? (b[key] === null ? 0 : 1) : b[key] === null ? -1 : (a[key]-b[key])*(descending?-1:1);
    if(f.sort === 'price-asc') list.sort(numeric('priceNumber'));
    if(f.sort === 'price-desc') list.sort(numeric('priceNumber',true));
    if(f.sort === 'year') list.sort(numeric('yearNumber',true));
    if(f.sort === 'km') list.sort(numeric('kmNumber'));
    return list;
  }
  const api = {fold,number,normalize,select};
  if(typeof module !== 'undefined') module.exports = api;
  else root.VehicleCore = api;
})(typeof window === 'undefined' ? globalThis : window);
