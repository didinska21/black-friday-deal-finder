export const sortOptions = [
  ['discount', 'Biggest discount'],
  ['saving', 'Biggest saving ($)'],
  ['price', 'Lowest price'],
  ['verdict', 'Verdict: TRUE LOW first'],
];

export const discountOptions = [0, 20, 40, 50];
const verdictOrder = { 'TRUE LOW': 0, 'STRONG DEAL': 1, 'ROUTINE SALE': 2 };

export function discountOf(deal) {
  return Math.round((1 - deal.price / deal.was) * 100);
}

export function savingOf(deal) {
  return Math.round((deal.was - deal.price) * 100) / 100;
}

export function catalogFor(deals) {
  const categories = [...new Set(deals.map((deal) => deal.category))];
  const stores = [...new Set(deals.map((deal) => deal.store))].sort((a, b) => a.localeCompare(b));
  return { categories, stores, total: deals.length };
}

export function normalizeFilters(input, catalog) {
  return {
    q: String(input.q ?? '').slice(0, 200),
    category: catalog.categories.includes(input.category) ? input.category : '',
    store: catalog.stores.includes(input.store) ? input.store : '',
    discount: discountOptions.includes(Number(input.discount)) ? Number(input.discount) : 0,
    sort: sortOptions.some(([key]) => key === input.sort) ? input.sort : 'discount',
  };
}

export function filtersFromHash(hash, catalog) {
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return normalizeFilters(Object.fromEntries(new URLSearchParams(query)), catalog);
}

export function hashForFilters(state) {
  const params = new URLSearchParams();
  for (const key of ['q', 'category', 'store', 'discount', 'sort']) {
    if (state[key] && !(key === 'sort' && state[key] === 'discount')) params.set(key, state[key]);
  }
  return `#/${params.size ? `?${params}` : ''}`;
}

export function selectDeals(deals, state) {
  const terms = state.q.trim().toLocaleLowerCase('en-US').split(/\s+/).filter(Boolean);
  const selected = deals.filter((deal) => {
    const text = `${deal.title} ${deal.store} ${deal.category}`.toLocaleLowerCase('en-US');
    return terms.every((term) => text.includes(term))
      && (!state.category || deal.category === state.category)
      && (!state.store || deal.store === state.store)
      && discountOf(deal) >= state.discount;
  });
  return selected.sort((a, b) => {
    const byDiscount = discountOf(b) - discountOf(a);
    const bySaving = savingOf(b) - savingOf(a);
    if (state.sort === 'price') return a.price - b.price || byDiscount;
    if (state.sort === 'saving') return bySaving || byDiscount;
    if (state.sort === 'verdict') return verdictOrder[a.verdict] - verdictOrder[b.verdict] || byDiscount || bySaving;
    return byDiscount || bySaving;
  });
}

export function activeFilters(state) {
  return [
    ...(state.q.trim() ? [{ key: 'q', label: `Search: ${state.q.trim()}` }] : []),
    ...(state.category ? [{ key: 'category', label: state.category }] : []),
    ...(state.store ? [{ key: 'store', label: state.store }] : []),
    ...(state.discount ? [{ key: 'discount', label: `${state.discount}%+ off` }] : []),
  ];
}
