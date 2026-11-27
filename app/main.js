import { deals } from './data.js';
import { listMarkup, detailMarkup, missingMarkup, cardsMarkup, activeMarkup } from './views.js';
import {
  catalogFor, discountOf, savingOf, selectDeals, normalizeFilters,
  filtersFromHash, hashForFilters, activeFilters, sortOptions, discountOptions,
} from './filters.js';

window.__shotReady = false;
const app = document.querySelector('#app');
const catalog = catalogFor(deals);
const categoryCounts = Object.fromEntries(catalog.categories.map((category) => [category, deals.filter((deal) => deal.category === category).length]));
const desktop = window.matchMedia('(min-width: 761px)');
let state = filtersFromHash(location.hash, catalog);
let lastListHash = hashForFilters(state);
let renderVersion = 0;

const presentationOf = (deal) => ({ ...deal, discount: discountOf(deal), saving: savingOf(deal) });

function beginRender() {
  window.__shotReady = false;
  app.setAttribute('aria-busy', 'true');
  return ++renderVersion;
}

function finishRender(version, anchor) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (version !== renderVersion) return;
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
    app.setAttribute('aria-busy', 'false');
    window.__shotReady = true;
  }));
}

function updateResults() {
  const version = beginRender();
  const entries = selectDeals(deals, state).map(presentationOf);
  const active = activeFilters(state);
  app.querySelector('#deal-grid').innerHTML = cardsMarkup(entries);
  app.querySelector('#result-count').textContent = `${entries.length} of ${catalog.total} deals`;
  app.querySelector('#active-filters').innerHTML = activeMarkup(active);
  app.querySelector('#filter-total').textContent = active.length || '';
  app.querySelector('#ledger-end').textContent = entries.length
    ? `All ${entries.length} matching deals are above. Good prices deserve a closer look.`
    : 'The full ledger is one reset away.';
  for (const button of app.querySelectorAll('[data-category]')) {
    const selected = button.dataset.category === state.category;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  app.querySelector('#search').value = state.q;
  app.querySelector('#store-filter').value = state.store;
  app.querySelector('#sort').value = state.sort;
  for (const radio of app.querySelectorAll('[name="discount"]')) radio.checked = Number(radio.value) === state.discount;
  lastListHash = hashForFilters(state);
  history.replaceState(null, '', lastListHash);
  finishRender(version);
}

function changeFilters(patch) {
  state = normalizeFilters({ ...state, ...patch }, catalog);
  updateResults();
}

function renderRoute() {
  const hash = location.hash || '#/';
  const anchor = hash === '#how-we-check' ? 'how-we-check' : hash === '#main' ? 'main' : null;
  if (anchor && app.hasChildNodes()) {
    finishRender(beginRender(), anchor);
    return;
  }
  const version = beginRender();
  const match = /^#\/deal\/([^/?]+)\/?$/.exec(hash);
  if (match) {
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = ''; }
    const found = deals.find((deal) => deal.id === id);
    app.innerHTML = found ? detailMarkup(presentationOf(found), lastListHash) : missingMarkup();
    document.title = `${found ? found.title : 'Deal not found'} — Midnight Ledger`;
  } else if (hash.startsWith('#/deal/') || (!hash.startsWith('#/?') && hash !== '#/' && !anchor)) {
    app.innerHTML = missingMarkup();
    document.title = 'Deal not found — Midnight Ledger';
  } else {
    state = filtersFromHash(hash, catalog);
    lastListHash = hashForFilters(state);
    app.innerHTML = listMarkup({
      catalog, state, categoryCounts, sorts: sortOptions, discounts: discountOptions,
      active: activeFilters(state), filtersOpen: desktop.matches,
      featured: presentationOf(deals.find((deal) => deal.id === 'hisense-98-qd5')),
      entries: selectDeals(deals, state).map(presentationOf),
    });
    document.title = 'Midnight Ledger — Black Friday Deal Finder';
  }
  window.scrollTo(0, 0);
  finishRender(version, anchor);
}

app.addEventListener('submit', (event) => event.preventDefault());
app.addEventListener('input', (event) => {
  if (event.target.id === 'search') changeFilters({ q: event.target.value });
});
app.addEventListener('change', (event) => {
  if (event.target.id === 'store-filter') changeFilters({ store: event.target.value });
  if (event.target.id === 'sort') changeFilters({ sort: event.target.value });
  if (event.target.name === 'discount') changeFilters({ discount: event.target.value });
});
app.addEventListener('click', (event) => {
  const category = event.target.closest('[data-category]');
  const remove = event.target.closest('[data-remove]');
  if (category) changeFilters({ category: category.dataset.category });
  if (remove) changeFilters({ [remove.dataset.remove]: remove.dataset.remove === 'discount' ? 0 : '' });
  if (event.target.closest('[data-reset]')) changeFilters({ q: '', category: '', store: '', discount: 0, sort: 'discount' });
});
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) {
    const search = app.querySelector('#search');
    if (search) { event.preventDefault(); search.focus(); }
  }
});
desktop.addEventListener('change', () => {
  const panel = app.querySelector('#filters-panel');
  if (panel) panel.open = desktop.matches;
});
window.addEventListener('hashchange', renderRoute);
renderRoute();
