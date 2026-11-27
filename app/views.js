const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const htmlText = (value) => String(value).replace(/[&<>"']/g, (character) => entities[character]);
const priceFormats = [0, 2].map((digits) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: 2,
}));

export function dollars(value) {
  return priceFormats[Number.isInteger(value) ? 0 : 1].format(value);
}

function priceText(deal, value) {
  return `${dollars(value)}${deal.category === 'Streaming' ? '/mo' : ''}`;
}

function verdictBadge(deal) {
  const tone = { 'TRUE LOW': 'low', 'STRONG DEAL': 'strong', 'ROUTINE SALE': 'routine' }[deal.verdict];
  return `<span class="verdict verdict-${tone}"><span aria-hidden="true">${tone === 'low' ? '◆' : tone === 'strong' ? '↘' : '—'}</span> ${htmlText(deal.verdict)}</span>`;
}

function storeLink(deal, className = 'store-link') {
  return `<a class="${className}" href="${htmlText(deal.url)}" target="_blank" rel="noopener noreferrer">View at ${htmlText(deal.store)} <span aria-hidden="true">↗</span></a>`;
}

function dealNotes(deal) {
  const notes = (deal.notes ?? []).map((note) => `<span>${htmlText(note)}</span>`).join('');
  return deal.code || notes ? `<div class="deal-notes">${deal.code ? `<span>Use code <code>${htmlText(deal.code)}</code></span>` : ''}${notes}</div>` : '';
}

export function cardMarkup(deal) {
  return `<article class="deal-card" data-deal-id="${htmlText(deal.id)}">
    <div class="card-top"><span class="store-name">${htmlText(deal.store)} <span class="card-category">/ ${htmlText(deal.category)}</span></span><span class="discount-badge">${deal.discount}% OFF</span></div>
    <h3><a href="#/deal/${encodeURIComponent(deal.id)}">${htmlText(deal.title)}</a></h3>
    <div class="card-prices"><strong class="price">${priceText(deal, deal.price)}</strong><span class="usual">usual <s>${priceText(deal, deal.was)}</s></span></div>
    <div class="card-verdict">${verdictBadge(deal)}<span class="saving">Save ${priceText(deal, deal.saving)}</span></div>
    <p class="evidence">${htmlText(deal.evidence)}</p>
    ${dealNotes(deal)}
    <div class="card-actions">${storeLink(deal)}<a href="#/deal/${encodeURIComponent(deal.id)}" class="detail-link" aria-label="Details for ${htmlText(deal.title)}">Details <span aria-hidden="true">→</span></a></div>
    <div class="card-receipt"><time datetime="${deal.checked}"><span aria-hidden="true">✓</span> Checked 27 Nov 2026</time><p class="source" title="${htmlText(deal.source)}">Source: ${htmlText(deal.source)}</p></div>
  </article>`;
}

export function cardsMarkup(deals) {
  if (!deals.length) return `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">∅</span><h3>No deals in this corner.</h3><p>Try a broader search or remove a filter to see more of the ledger.</p><button type="button" class="gold-button" data-reset>Clear search &amp; filters</button></div>`;
  return deals.map(cardMarkup).join('');
}

export function activeMarkup(active) {
  return active.length ? `<div class="active-filters" aria-label="Active filters">${active.map(({ key, label }) => `<button class="filter-chip" type="button" data-remove="${key}" aria-label="Remove ${htmlText(label)}">${htmlText(label)} <span aria-hidden="true">×</span></button>`).join('')}<button class="text-button" type="button" data-reset>Clear all</button></div>` : '';
}

function optionMarkup(value, label, selected) {
  return `<option value="${htmlText(value)}"${value === selected ? ' selected' : ''}>${htmlText(label)}</option>`;
}

function filterMarkup({ catalog, state, categoryCounts, discounts, filtersOpen, active }) {
  return `<aside class="filter-sidebar"><details id="filters-panel"${filtersOpen ? ' open' : ''}>
    <summary><span><span class="filter-symbol" aria-hidden="true">≡</span> Refine deals <span id="filter-total" class="filter-total">${active.length || ''}</span></span><span class="summary-indicator" aria-hidden="true">+</span></summary>
    <div class="filter-body">
      <label class="field-label" for="store-filter">Store<select id="store-filter" name="store">${optionMarkup('', `All ${catalog.stores.length} stores`, state.store)}${catalog.stores.map((store) => optionMarkup(store, store, state.store)).join('')}</select></label>
      <fieldset class="discount-fieldset"><legend>Minimum discount</legend><div class="discount-options">${discounts.map((value) => `<label><input type="radio" name="discount" value="${value}"${state.discount === value ? ' checked' : ''}><span>${value ? `${value}%+` : 'All'}</span></label>`).join('')}</div></fieldset>
      <fieldset class="category-fieldset"><legend>Category</legend><div class="category-list">
        <button class="category-button${!state.category ? ' is-selected' : ''}" type="button" data-category="" aria-pressed="${!state.category}"><span>All categories</span><span>${catalog.total}</span></button>
        ${catalog.categories.map((category) => `<button class="category-button${state.category === category ? ' is-selected' : ''}" type="button" data-category="${htmlText(category)}" aria-pressed="${state.category === category}"><span>${htmlText(category)}</span><span>${categoryCounts[category]}</span></button>`).join('')}
      </div></fieldset>
      <button class="reset-filters" type="button" data-reset>Reset all filters <span aria-hidden="true">↺</span></button>
    </div>
  </details></aside>`;
}

export function listMarkup(model) {
  const { catalog, featured, entries, state, sorts, active } = model;
  return `<section class="intro" aria-labelledby="page-title">
    <div><div class="eyebrow"><span class="gold-dash" aria-hidden="true"></span> BLACK FRIDAY, CLEAR AS DAY</div><h1 id="page-title">The sale. <span>With receipts.</span></h1></div>
    <div class="intro-meta"><p class="catalog-count">${catalog.total} deals · ${catalog.stores.length} stores · ${catalog.categories.length} categories</p><p>Every price checked. Every saving explained.</p></div>
  </section>
  <section class="hero-strip" aria-label="Featured deal">
    <div class="hero-discount"><strong>${featured.discount}<span>%</span></strong><span>OFF THE USUAL PRICE</span></div>
    <div class="hero-product"><div class="eyebrow">THE BIG FIND <span class="hero-divider">/</span> ${htmlText(featured.store)}</div><h2><a href="#/deal/${featured.id}">${htmlText(featured.title)}</a></h2><p>${verdictBadge(featured)}<span>Save ${dollars(featured.saving)} · Checked <time datetime="${featured.checked}">27 Nov 2026</time></span></p></div>
    <div class="hero-price"><strong>${dollars(featured.price)}</strong><span>was <s>${dollars(featured.was)}</s></span></div>
    <a class="hero-arrow" href="#/deal/${featured.id}" aria-label="See the Hisense 98-inch TV deal">↗</a>
  </section>
  <form class="search-toolbar" id="deal-search" role="search">
    <div class="search-field"><span class="search-symbol" aria-hidden="true"></span><label class="sr-only" for="search">Search product, store, or category</label><input type="search" id="search" name="q" placeholder="Search a product, store, or category…" value="${htmlText(state.q)}" autocomplete="off"><kbd aria-hidden="true">/</kbd></div>
    <label class="sort-field" for="sort">Sort by<select id="sort" name="sort">${sorts.map(([value, label]) => optionMarkup(value, label, state.sort)).join('')}</select></label>
  </form>
  <div class="browse-layout">
    ${filterMarkup(model)}
    <section class="results" aria-labelledby="results-title">
      <div class="results-heading"><h2 id="results-title">The deal ledger <span id="result-count" aria-live="polite" aria-atomic="true">${entries.length} of ${catalog.total} deals</span></h2><span class="currency-note">USD · SOURCE CHECKED</span></div>
      <div class="verdict-legend" aria-label="Verdict guide"><span><i class="legend-low"></i> True low</span><span><i class="legend-strong"></i> Strong deal</span><span><i class="legend-routine"></i> Routine sale</span><a href="#how-we-check">What’s the difference? ↗</a></div>
      <div id="active-filters">${activeMarkup(active)}</div>
      <div class="deal-grid" id="deal-grid">${cardsMarkup(entries)}</div>
      <p class="ledger-end" id="ledger-end">${entries.length ? `All ${entries.length} matching deals are above. Good prices deserve a closer look.` : 'The full ledger is one reset away.'}</p>
    </section>
  </div>`;
}

export function detailMarkup(deal, backHash) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${htmlText(backHash)}">← Back to deals</a><span>/</span><span>${htmlText(deal.category)}</span></nav>
  <article class="deal-detail" data-deal-id="${deal.id}">
    <div class="detail-main">
      <div class="eyebrow">${htmlText(deal.category)} <span class="hero-divider">/</span> ${htmlText(deal.store)}</div>
      <h1>${htmlText(deal.title)}</h1>
      <div class="detail-verdict">${verdictBadge(deal)}<p>${htmlText(deal.evidence)}</p></div>
      <div class="detail-conditions"><h2>Before you buy</h2>${dealNotes(deal) || '<p>No extra code or condition is listed in the cited report.</p>'}<p>Check the matching model, final price, and availability at the store. Store search results may include other versions.</p></div>
    </div>
    <aside class="price-receipt" aria-label="Deal price and store link">
      <div class="receipt-top"><span class="eyebrow">THE PRICE BREAKDOWN</span><span class="discount-badge">${deal.discount}% OFF</span></div>
      <strong class="detail-price">${priceText(deal, deal.price)}</strong>
      <p class="detail-usual">usual <s>${priceText(deal, deal.was)}</s></p>
      <dl class="receipt-lines"><div><dt>Your saving${deal.category === 'Streaming' ? ' per month' : ''}</dt><dd>${dollars(deal.saving)}</dd></div><div><dt>Store</dt><dd>${htmlText(deal.store)}</dd></div><div><dt>Price checked</dt><dd><time datetime="${deal.checked}">27 Nov 2026</time></dd></div><div><dt>Check time</dt><dd>07:00 UTC</dd></div></dl>
      ${storeLink(deal, 'gold-button receipt-cta')}
      <p class="checkout-note">Prices can change — check at checkout.</p>
    </aside>
    <section class="detail-source" aria-labelledby="source-title"><div><span class="eyebrow">FOLLOW THE PAPER TRAIL</span><h2 id="source-title">The source</h2></div><div><p>${htmlText(deal.source)}</p><p class="source-check"><span aria-hidden="true">✓</span> Checked 27 Nov 2026 · 07:00 UTC · Prices in USD${deal.category === 'Streaming' ? ' · per month' : ''}</p></div></section>
  </article>
  <div class="detail-bottom"><a href="${htmlText(backHash)}">← Keep browsing the ledger</a><a href="#how-we-check">How we check our prices ↗</a></div>`;
}

export function missingMarkup() {
  return `<section class="empty-state missing-page"><span class="eyebrow">NOT IN THE LEDGER</span><h1>That deal isn’t here.</h1><p>The address may be incomplete. All 57 deals are in the main ledger.</p><a class="gold-button" href="#/">Browse every deal →</a></section>`;
}
