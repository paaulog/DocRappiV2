export const TECHNOLOGIES = [
  { id: 'foundations', label: 'Fundamentos', description: 'Introdução e padrões comuns', defaultPage: 'overview', category: 'foundations' },

  { id: 'orders', label: 'Open Orders', description: 'Pedidos e ciclo de vida', defaultPage: 'intro', category: 'integrations' },
  { id: 'catalog', label: 'Open Catalog', description: 'Catálogo e produtos', defaultPage: 'overview', category: 'integrations' },
  { id: 'inventory', label: 'Inventory', description: 'Estoque e disponibilidade', defaultPage: 'overview', category: 'integrations' },
  { id: 'payless', label: 'Payless', description: 'Pagamentos e conciliação', defaultPage: 'overview', category: 'integrations' },
  { id: 'loyalty', label: 'Loyalty', description: 'Programa de fidelidade', defaultPage: 'overview', category: 'integrations' },
  { id: 'discounts', label: 'Descontos complexos', description: 'Promoções e descontos', defaultPage: 'overview', category: 'integrations' },
];

export const TECHNOLOGY_CATEGORIES = [
  { id: 'foundations', label: 'Antes de começar' },
  { id: 'integrations', label: 'Integrações de negócio' },
];

export function getTechnologyLabel(techId) {
  return TECHNOLOGIES.find(tech => tech.id === techId)?.label || techId;
}

export function getTechnologyDefaultPage(techId) {
  return TECHNOLOGIES.find(tech => tech.id === techId)?.defaultPage || 'overview';
}

export function getTechnologiesByCategory(category) {
  return TECHNOLOGIES.filter(tech => tech.category === category);
}
