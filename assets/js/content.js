/**
 * Conteúdo das páginas de API geradas em JS (exceto Open Catalog — estático em pages/open-catalog.html).
 * Não é importação automática de ReadMe ou outros portais: guias de referência a manter/atualizar aqui.
 * Edite aqui ou migre a página para HTML + data-static-api como em open-catalog.
 */
var API_DOCS = {
  inventory: {
    slug: 'inventory',
    title: 'Inventory (Basic Inventory)',
    shortName: 'Inventory',
    dependencyNote: 'Requer: Open Catalog',
    basicRequirements: [
      'Open Catalog integrado e estável — os IDs de produto devem coincidir.',
      'Atualizações de estoque em tempo real ou quase real são recomendadas.',
    ],
    overview:
      'O Inventário mantém estoque e preço alinhados entre seus sistemas e a Rappi. Depende do Open Catalog para que cada SKU mapeie para um item de catálogo conhecido.',
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/inventory/example',
        description: 'Substitua este bloco pelo conteúdo real da API.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
  },

  'complex-discounts': {
    slug: 'complex-discounts',
    title: 'Complex Discounts',
    shortName: 'Complex Discounts',
    dependencyNote: 'Requer: Inventory',
    basicRequirements: ['Inventory estável.', 'Credenciais válidas.'],
    overview: 'Descontos e promoções complexas — preencha endpoints e exemplos aqui.',
    endpoints: [
      {
        id: 'example',
        method: 'POST',
        path: '/v1/discounts/example',
        description: 'Endpoint de exemplo.',
        requestBody: '{}',
        responseExample: '{}',
      },
    ],
  },

  'open-orders': {
    slug: 'open-orders',
    title: 'Open Orders',
    shortName: 'Open Orders',
    dependencyNote: 'Requer: Inventory',
    basicRequirements: ['Inventory integrado.', 'Credenciais válidas.'],
    overview: 'Pedidos abertos — preencha endpoints e exemplos aqui.',
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/orders/example',
        description: 'Endpoint de exemplo.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
  },

  payless: {
    slug: 'payless',
    title: 'Payless',
    shortName: 'Payless',
    dependencyNote: 'Requer: Inventory',
    basicRequirements: ['Inventory integrado.', 'Credenciais válidas.'],
    overview: 'Payless — preencha endpoints e exemplos aqui.',
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/payless/example',
        description: 'Endpoint de exemplo.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
  },

  loyalty: {
    slug: 'loyalty',
    title: 'Loyalty',
    shortName: 'Loyalty',
    dependencyNote: 'Requer: Open Orders ou Payless',
    basicRequirements: ['Integração upstream estável.', 'Credenciais válidas.'],
    overview: 'Fidelidade — preencha endpoints e exemplos aqui.',
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/loyalty/example',
        description: 'Endpoint de exemplo.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
  },
};
