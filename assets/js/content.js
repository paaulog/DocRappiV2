/**
 * Conteúdo das páginas de API geradas em JS (exceto Open Catalog — estático em pages/open-catalog.html).
 * Não é importação automática de ReadMe ou outros portais: guias de referência a manter/atualizar aqui.
 *
 * Estrutura por API:
 *   - title / shortName / lead
 *   - basicRequirements: lista (Requisitos básicos)
 *   - endpoints: lista de endpoints (Endpoints)
 *   - relevantFlows: lista de parágrafos (Fluxos relevantes)
 *   - guide: lista de parágrafos (Guia)
 *   - labels.sections: rótulos PT-BR de cada seção
 */
var API_DOCS = {
  inventory: {
    slug: 'inventory',
    title: 'Inventory (Basic Inventory)',
    shortName: 'Inventory',
    lead: 'Mantenha estoque e preço de cada produto sincronizados entre o seu sistema e a Rappi.',
    labels: {
      sections: {
        basicRequirements: 'Requisitos básicos',
        endpoints: 'Endpoints',
        relevantFlows: 'Fluxos relevantes',
        guide: 'Guia',
      },
      copy: 'Copiar',
      noRequestBody: 'Sem corpo de requisição.',
      trySoon: 'Experimentar (em breve)',
      trySoonTitle: 'Em breve',
    },
    basicRequirements: [
      'Open Catalog integrado: cada SKU já tem id de produto Rappi e está vinculado a uma loja.',
      'Credenciais Bearer válidas para chamadas autenticadas.',
      'Capacidade do seu sistema de enviar atualizações em tempo real ou com baixa latência.',
    ],
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/inventory/example',
        description: 'Endpoint de exemplo. Substitua pelo contrato real assim que disponível.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
    relevantFlows: [
      'Fluxo de atualização recorrente: a cada mudança de preço ou estoque no seu ERP, dispare a chamada de atualização para a loja correspondente.',
      'Fluxo de reconciliação: ao detectar divergência entre o app e o seu sistema, busque o estado atual antes de sobrescrever.',
    ],
    guide: [
      'Inventário trabalha sempre por loja: o mesmo produto pode ter preços e estoques diferentes em unidades distintas.',
      'Mantenha o mapeamento SKU ↔ id Rappi sempre atualizado — é a chave para todas as chamadas.',
      'Erros comuns: enviar estoque para um produto sem vínculo de loja, ou ignorar atualizações de preço durante promoções.',
    ],
  },

  'complex-discounts': {
    slug: 'complex-discounts',
    title: 'Complex Discounts',
    shortName: 'Complex Discounts',
    lead: 'Crie promoções e descontos com regras avançadas (combos, escalonados, por público).',
    labels: {
      sections: {
        basicRequirements: 'Requisitos básicos',
        endpoints: 'Endpoints',
        relevantFlows: 'Fluxos relevantes',
        guide: 'Guia',
      },
      copy: 'Copiar',
      noRequestBody: 'Sem corpo de requisição.',
      trySoon: 'Experimentar (em breve)',
      trySoonTitle: 'Em breve',
    },
    basicRequirements: [
      'Inventário ativo e estável — descontos só fazem sentido sobre produtos com preço base atualizado.',
      'Credenciais Bearer válidas.',
      'Definição prévia das regras de negócio (vigência, segmento, limite por pedido).',
    ],
    endpoints: [
      {
        id: 'example',
        method: 'POST',
        path: '/v1/discounts/example',
        description: 'Endpoint de exemplo. Substitua pelo contrato real assim que disponível.',
        requestBody: '{}',
        responseExample: '{}',
      },
    ],
    relevantFlows: [
      'Fluxo de criação de promoção: defina regra → publique no escopo (loja/produto) → monitore ativações.',
      'Fluxo de encerramento: agende fim ou desative manualmente para evitar descontos fora de campanha.',
    ],
    guide: [
      'Descontos complexos rodam sobre o preço já carregado no inventário; se o preço base estiver desatualizado, o desconto também ficará.',
      'Sempre teste a promoção em ambiente de homologação antes de ativar em produção.',
      'Documente vigência e regras junto da KAM — facilita auditoria e suporte ao parceiro.',
    ],
  },

  'open-orders': {
    slug: 'open-orders',
    title: 'Open Orders',
    shortName: 'Open Orders',
    lead: 'Receba e acompanhe pedidos da Rappi diretamente no seu sistema de gestão.',
    labels: {
      sections: {
        basicRequirements: 'Requisitos básicos',
        endpoints: 'Endpoints',
        relevantFlows: 'Fluxos relevantes',
        guide: 'Guia',
      },
      copy: 'Copiar',
      noRequestBody: 'Sem corpo de requisição.',
      trySoon: 'Experimentar (em breve)',
      trySoonTitle: 'Em breve',
    },
    basicRequirements: [
      'Inventário integrado: pedidos só são gerados sobre produtos com estoque/preço sincronizados.',
      'Credenciais Bearer válidas.',
      'Webhook ativo para receber notificações de novos pedidos.',
    ],
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/orders/example',
        description: 'Endpoint de exemplo. Substitua pelo contrato real assim que disponível.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
    relevantFlows: [
      'Fluxo de pedido: notificação chega via webhook → você confirma/aceita → envia atualizações de status (preparando, pronto, enviado).',
      'Fluxo de cancelamento: cancele com motivo padronizado para garantir reembolso correto ao cliente.',
    ],
    guide: [
      'Open Orders e Payless são exclusivos: cada parceiro escolhe um dos dois para o ciclo de pedido.',
      'Confirme cada pedido dentro do SLA combinado — atrasos prejudicam a experiência do cliente final.',
      'Mantenha o status sempre atualizado: o app do entregador depende dessas atualizações.',
    ],
  },

  payless: {
    slug: 'payless',
    title: 'Payless',
    shortName: 'Payless',
    lead: 'Modelo de pagamento integrado em que a Rappi gerencia a cobrança ao cliente final.',
    labels: {
      sections: {
        basicRequirements: 'Requisitos básicos',
        endpoints: 'Endpoints',
        relevantFlows: 'Fluxos relevantes',
        guide: 'Guia',
      },
      copy: 'Copiar',
      noRequestBody: 'Sem corpo de requisição.',
      trySoon: 'Experimentar (em breve)',
      trySoonTitle: 'Em breve',
    },
    basicRequirements: [
      'Inventário integrado.',
      'Credenciais Bearer válidas.',
      'Acordo comercial Payless ativo com a Rappi.',
    ],
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/payless/example',
        description: 'Endpoint de exemplo. Substitua pelo contrato real assim que disponível.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
    relevantFlows: [
      'Fluxo de venda: cliente paga na Rappi → Rappi consolida valores e repassa ao parceiro conforme contrato.',
      'Fluxo de reconciliação financeira: utilize os relatórios periódicos para conferir repasses.',
    ],
    guide: [
      'Payless e Open Orders são exclusivos — cada parceiro adota apenas um.',
      'Não exija pagamento adicional na entrega: o cliente já pagou pela plataforma.',
      'Acompanhe o ciclo financeiro junto ao time comercial Rappi para evitar divergências.',
    ],
  },

  loyalty: {
    slug: 'loyalty',
    title: 'Loyalty',
    shortName: 'Loyalty',
    lead: 'Programa de fidelidade vinculado às compras feitas via Rappi.',
    labels: {
      sections: {
        basicRequirements: 'Requisitos básicos',
        endpoints: 'Endpoints',
        relevantFlows: 'Fluxos relevantes',
        guide: 'Guia',
      },
      copy: 'Copiar',
      noRequestBody: 'Sem corpo de requisição.',
      trySoon: 'Experimentar (em breve)',
      trySoonTitle: 'Em breve',
    },
    basicRequirements: [
      'Open Orders ou Payless já em produção.',
      'Credenciais Bearer válidas.',
      'Regras de pontuação e resgate definidas com o time comercial.',
    ],
    endpoints: [
      {
        id: 'example',
        method: 'GET',
        path: '/v1/loyalty/example',
        description: 'Endpoint de exemplo. Substitua pelo contrato real assim que disponível.',
        requestBody: null,
        responseExample: '{}',
      },
    ],
    relevantFlows: [
      'Fluxo de pontuação: a cada compra elegível, registre os pontos atribuídos ao cliente.',
      'Fluxo de resgate: valide saldo, debite pontos e confirme o benefício liberado.',
    ],
    guide: [
      'Fidelidade depende de um histórico de pedidos confiável — por isso pressupõe Open Orders ou Payless.',
      'Comunique claramente as regras (validade, taxas, exclusões) ao cliente final.',
      'Monitore taxas de resgate para ajustar a economia do programa.',
    ],
  },
};
