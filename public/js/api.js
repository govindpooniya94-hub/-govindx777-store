const API = (() => {
  const BASE = '/api';

  async function get(endpoint) {
    const res = await fetch(BASE + endpoint);
    if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
    return res.json();
  }

  async function post(endpoint, data) {
    const res = await fetch(BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `POST ${endpoint} failed`);
    return json;
  }

  async function req(method, endpoint) {
    const res = await fetch(BASE + endpoint, { method });
    if (!res.ok) throw new Error(`${method} ${endpoint} failed: ${res.status}`);
    return res.json();
  }

  return {
    getProducts: (params = '') => get('/products' + (params ? '?' + params : '')),
    getProduct: (slug) => get('/products/' + slug),
    getTestimonials: () => get('/site/testimonials'),
    getFaqs: () => get('/site/faqs'),
    getStats: () => get('/site/stats'),
    getCategories: () => get('/site/categories'),
    getBlog: () => get('/site/blog'),
    getSettings: () => get('/site/settings'),
    trackVisit: (page) => post('/site/visit', { page }),
    sendContact: (data) => post('/contact', data),
    req,
  };
})();
