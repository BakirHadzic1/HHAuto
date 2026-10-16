const assert = require('node:assert/strict');
const { normalize, select } = require('../fronted/vehicle-core.js');
const rows = [
  {id:'1', name:'Škoda Octavia DSG', price:'18.500 KM', year:'2018', km:'250.757 km'},
  {id:'2', name:'Audi A4', price:'Na upit', year:'2020'},
  {id:'3', name:'Volkswagen Golf', price:'9.999 KM', year:'2012', km:'303.235 km'},
  {id:'4', name:'BENDA REDSTONE ATV', price:'15.900 KM'}
].map(normalize);
assert.deepEqual(select(rows,{q:'skoda',price:'20000',year:'2015',transmission:'Automatik'}).map(v=>v.id),['1']);
assert.deepEqual(select(rows,{price:'20000',sort:'price-asc'}).map(v=>v.id),['3','4','1']);
assert.deepEqual(select(rows,{sort:'price-desc'}).map(v=>v.id),['1','4','3','2']);
assert.deepEqual(select(rows,{category:'ATV / Quad'}).map(v=>v.id),['4']);
assert.deepEqual(select(rows,{saved:true},['2']).map(v=>v.id),['2']);
assert.equal(rows[1].transmission,'');
assert.equal(rows[3].yearNumber,null);
assert.equal(select(rows,{q:'nonexistent'}).length,0);
console.log('Catalogue rules passed: combined filters, unknown prices, sorting, categories, favourites and missing values.');
