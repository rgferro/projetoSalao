const siteUrl = 'https://belagestaostudio.com.br';

const pages = {
  landing: { path: '/', title: 'BelaGestão Studio | Gestão para Salões', description: 'Sistema de gestão para salões, barbearias, estética, esmalterias e lash designers.' },
  'sistema-salao': { path: '/sistema-para-salao-de-beleza', title: 'Sistema para Salão de Beleza | BelaGestão', description: 'Agenda, caixa, comissões e anamnese para salões de beleza.' },
  'sistema-barbearia': { path: '/sistema-para-barbearia', title: 'Sistema para Barbearia | BelaGestão', description: 'Gestão de agenda, caixa e comissões para barbearias modernas.' },
  'sistema-estetica': { path: '/sistema-para-estetica', title: 'Sistema para Estética | BelaGestão', description: 'Gestão para clínicas de estética, spa e bem-estar.' },
  'sistema-esmalteria': { path: '/sistema-para-esmalteria-e-unhas', title: 'Sistema para Esmalteria | BelaGestão', description: 'Agenda e gestão para esmalterias e nail designers.' },
  'sistema-lash': { path: '/sistema-para-lash-designer-e-sobrancelhas', title: 'Sistema para Lash Designer | BelaGestão', description: 'Gestão de agenda para lash designers e sobrancelhas.' },
};

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const [, name] = selector.match(/="([^"]+)"/) || [];
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
};

export function updateSeo(view) {
  const page = pages[view] || pages.landing;
  const url = `${siteUrl}${page.path}`;
  document.title = page.title;
  setMeta('meta[name="description"]', 'name', page.description);
  setMeta('meta[property="og:title"]', 'property', page.title);
  setMeta('meta[property="og:description"]', 'property', page.description);
  setMeta('meta[property="og:url"]', 'property', url);
  setMeta('meta[name="twitter:title"]', 'name', page.title);
  setMeta('meta[name="twitter:description"]', 'name', page.description);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}