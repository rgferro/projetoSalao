/**
 * Definições completas e detalhadas dos passos do Tour Guiado Interativo por Funcionalidade
 * BelaGestão Studio - Multi-Segmento
 */
export const PAGE_TOURS = {
  dashboard: {
    id: 'dashboard',
    title: 'Visão Geral & Indicadores (Dashboard)',
    description: 'Aprenda como acompanhar a saúde operacional e financeira do seu salão em tempo real.',
    icon: 'LayoutDashboard',
    steps: [
      {
        element: '#tour-metricas-faturamento',
        title: 'Métricas do Dia & Faturamento',
        content: 'Acompanhe instantaneamente o total faturado no dia, agendamentos confirmados e faturamento mensal acumulado.',
        badge: 'Financeiro Diário',
        side: 'bottom',
      },
      {
        element: '#tour-status-caixa',
        title: 'Status do Caixa da Recepção',
        content: 'Visualize se o caixa da recepção está Aberto ou Fechado e o saldo atual movimentado.',
        badge: 'Frente de Caixa',
        side: 'bottom',
      },
      {
        element: '#tour-aniversariantes',
        title: 'Aniversariantes do Dia',
        content: 'Identifique quais clientes fazem aniversário hoje para enviar parabéns e cupons de retorno no WhatsApp.',
        badge: 'Fidelização',
        side: 'left',
      },
      {
        element: '#tour-proximos-atendimentos',
        title: 'Contas a Vencer & Próximos Atendimentos',
        content: 'Alertas de contas pendentes e lista dos próximos horários agendados para a equipe.',
        badge: 'Gestão Ágil',
        side: 'top',
      },
    ],
  },

  appointments: {
    id: 'appointments',
    title: 'Agenda & Horários Inteligente',
    description: 'Domine a grade visual multisserviços, comanda combinada e bloqueio de folgas.',
    icon: 'Calendar',
    steps: [
      {
        element: '#tour-novo-agendamento',
        title: 'Novo Agendamento Multisserviços (F2)',
        content: 'Pressione F2 para marcar horários. Você pode vincular múltiplos procedimentos (ex: Corte + Barba) com profissionais diferentes na mesma comanda.',
        badge: 'Atalho F2',
        side: 'bottom',
      },
      {
        element: '#tour-filtros-agenda',
        title: 'Filtro por Especialidade & Profissional',
        content: 'Alterne a grade para focar na agenda de um colaborador específico ou filtre por Cabelo, Unhas, Barba ou Estética.',
        badge: 'Visão da Equipe',
        side: 'bottom',
      },
      {
        element: '#tour-grade-agenda',
        title: 'Ciclo de Status do Atendimento',
        content: 'Avance o status de Agendado ➔ Confirmado (WhatsApp) ➔ Em Atendimento ➔ Concluído. Ao concluir, vá direto ao Caixa.',
        badge: 'Fluxo em 1 Clique',
        side: 'top',
      },
      {
        element: '#tour-bloqueio-horarios',
        title: 'Bloqueio de Intervalos e Folgas',
        content: 'Bloqueie horários de almoço, reuniões e folgas diretamente na grade para impedir agendamentos no período.',
        badge: 'Controle de Horários',
        side: 'left',
      },
    ],
  },

  clients: {
    id: 'clients',
    title: 'Clientes & Ficha de Anamnese Técnica',
    description: 'Como organizar seu CRM, histórico de atendimentos e proteção com anamnese.',
    icon: 'Users',
    steps: [
      {
        element: '#tour-novo-cliente',
        title: 'Cadastro Rápido de Clientes (F4)',
        content: 'Pressione F4 para cadastrar novos clientes em segundos. Ao cadastrar, o sistema pode enviar mensagem de boas-vindas no WhatsApp.',
        badge: 'Atalho F4',
        side: 'bottom',
      },
      {
        element: '#tour-anamnese-cliente',
        title: 'Ficha de Anamnese Técnica & Fotos',
        content: 'Registre fórmulas de química capilar, mapping de cílios, formato de unhas ou restrições alérgicas para cada procedimento.',
        badge: 'Proteção & Qualidade',
        side: 'left',
      },
      {
        element: '#tour-fidelidade-cliente',
        title: 'Programa Fidelidade por Pontos',
        content: 'A cada R$ 10 consumidos, o cliente acumula 1 ponto de fidelidade. Acompanhe o saldo e faça resgates no Caixa.',
        badge: 'Retenção',
        side: 'top',
      },
    ],
  },

  'cash-register': {
    id: 'cash-register',
    title: 'Frente de Caixa & PDV Balcão',
    description: 'Recebimento de comandas com PIX dinâmico, cartões e fechamento cego de caixa.',
    icon: 'CreditCard',
    steps: [
      {
        element: '#tour-status-caixa-detalhe',
        title: 'Abertura com Fundo de Troco',
        content: 'Abra o turno informando o valor inicial em dinheiro na gaveta para controle auditado de troco.',
        badge: 'Abertura Segura',
        side: 'bottom',
      },
      {
        element: '#tour-checkout-pix',
        title: 'Checkout em 1 Clique (F3) & PIX Instantâneo',
        content: 'Pressione F3 para cobrar comandas. Gere QR Code PIX dinâmico com valor exato na tela ou receba em cartões.',
        badge: 'Atalho F3',
        side: 'bottom',
      },
      {
        element: '#tour-sangrias-reforcos',
        title: 'Sangrias & Reforços Auditados',
        content: 'Registre saídas avulsas de dinheiro (sangrias) ou entradas de troco (reforços) com justificativa.',
        badge: 'Auditoria Diária',
        side: 'top',
      },
      {
        element: '#tour-fechamento-caixa',
        title: 'Fechamento Cego com Backup em Nuvem',
        content: 'Ao fechar o caixa, confira os valores contados. O sistema gera o relatório diário e salva cópia de segurança em nuvem.',
        badge: 'Fechamento & Nuvem',
        side: 'left',
      },
    ],
  },

  financial: {
    id: 'financial',
    title: 'Financeiro, DRE & Contas',
    description: 'Gestão completa de lucratividade, despesas fixas e comissões do salão.',
    icon: 'DollarSign',
    steps: [
      {
        element: '#tour-dre-lucro',
        title: 'DRE de Lucratividade Real',
        content: 'Visualize o faturamento bruto, total de comissões deduzidas, despesas operacionais e o lucro líquido real do mês.',
        badge: 'DRE Financeiro',
        side: 'bottom',
      },
      {
        element: '#tour-contas-pagar',
        title: 'Contas a Pagar & Fornecedores',
        content: 'Controle despesas fixas (aluguel, luz, produtos) e receba alertas preventivos de vencimentos.',
        badge: 'Fluxo de Caixa',
        side: 'top',
      },
      {
        element: '#tour-comissoes-equipe',
        title: 'Relatórios de Comissões da Equipe',
        content: 'Consulte o extrato consolidado de comissões calculadas automaticamente conforme a Lei do Salão Parceiro.',
        badge: 'Comissões Transparentes',
        side: 'top',
      },
    ],
  },

  professionals: {
    id: 'professionals',
    title: 'Equipe & Profissionais Parceiros',
    description: 'Controle de equipe, permissões de acesso e regras de comissionamento.',
    icon: 'UserCheck',
    steps: [
      {
        element: '#tour-novo-profissional',
        title: 'Cadastro do Colaborador & Especialidades',
        content: 'Adicione novos profissionais, fotos, funções e especialidades (Cabelo, Barba, Unhas, Estética, Lash).',
        badge: 'Equipe Especializada',
        side: 'bottom',
      },
      {
        element: '#tour-permissoes-equipe',
        title: 'Níveis de Acesso & RBAC',
        content: 'Defina permissões: Administrador, Gerente, Recepção ou Profissional (que visualiza apenas a própria agenda).',
        badge: 'Segurança & Sigilo',
        side: 'bottom',
      },
      {
        element: '#tour-regras-comissao',
        title: 'Regras de Comissão Personalizadas',
        content: 'Defina comissão individual por porcentagem fixa ou dedução de insumos de bancada.',
        badge: 'Lei do Salão Parceiro',
        side: 'top',
      },
    ],
  },

  services: {
    id: 'services',
    title: 'Catálogo de Serviços & Tabela de Preços',
    description: 'Organização de procedimentos, tempos de execução e preços por categoria.',
    icon: 'Scissors',
    steps: [
      {
        element: '#tour-novo-servico',
        title: 'Serviços por Categoria do Nicho',
        content: 'Crie serviços com duração estimada (ex: 30min, 60min) para que a grade calcule o tempo de atendimento perfeitamente.',
        badge: 'Duração Automática',
        side: 'bottom',
      },
      {
        element: '#tour-categorias-servicos',
        title: 'Comissões Específicas por Procedimento',
        content: 'Defina valores diferenciados de comissão para químicas complexas ou procedimentos rápidos.',
        badge: 'Flexibilidade',
        side: 'top',
      },
    ],
  },

  whatsapp: {
    id: 'whatsapp',
    title: 'Automação do WhatsApp (Baileys 24/7)',
    description: 'Lembretes automáticos 24h e 2h antes sem pagar taxas por mensagem.',
    icon: 'MessageSquare',
    steps: [
      {
        element: '#tour-qr-whatsapp',
        title: 'Pareamento em 1 Clique por QR Code',
        content: 'Aponte o WhatsApp do salão para o QR Code. O microserviço dedicado mantém a conexão contínua 24h por dia.',
        badge: 'Sem Mensalidades Extras',
        side: 'bottom',
      },
      {
        element: '#tour-lembretes-whatsapp',
        title: 'Lembretes Inteligentes 24h e 2h Antes',
        content: 'Reduza faltas e no-shows em até 80% disparando lembretes automáticos com nome, dia e serviços agendados.',
        badge: 'Redução de Faltas',
        side: 'bottom',
      },
      {
        element: '#tour-templates-whatsapp',
        title: 'Modelos Personalizáveis',
        content: 'Edite o conteúdo das mensagens usando tags dinâmicas como {cliente}, {horario}, {servicos} e {profissional}.',
        badge: 'Personalização',
        side: 'top',
      },
    ],
  },

  subscription: {
    id: 'subscription',
    title: 'Assinatura & Planos do Salão',
    description: 'Gerencie o plano contratado por capacidade operacional e vagas de profissionais.',
    icon: 'Sparkles',
    steps: [
      {
        element: '#tour-grade-planos',
        title: 'Planos Transparentes por Vagas de Cadeiras',
        content: 'Escolha entre Solo (grátis), Starter (até 2 vagas), Studio Pro (até 5 vagas + add-ons) e Premier Club (até 15 vagas).',
        badge: 'Preço Justo',
        side: 'bottom',
      },
      {
        element: '#tour-vagas-extras',
        title: 'Add-on de Vagas Extras de Profissionais',
        content: 'Expanda a capacidade do seu salão adicionando novas vagas por apenas +R$ 15/mês por profissional.',
        badge: 'Escalabilidade',
        side: 'top',
      },
      {
        element: '#tour-metodos-pagamento',
        title: 'Cartão de Crédito Recorrente & PIX',
        content: 'Assine com Débito Mensal Automático no Cartão (sem travar o limite total) ou pague via PIX Instantâneo com liberação em segundos.',
        badge: 'Cartão ou PIX',
        side: 'top',
      },
    ],
  },

  backup: {
    id: 'backup',
    title: 'Backup & Nuvem (Google Drive)',
    description: 'Segurança absoluta para nunca perder dados de clientes e financeiro.',
    icon: 'HardDrive',
    steps: [
      {
        element: '#tour-backup-google-drive',
        title: 'Backup Diário Automático & Integridade SHA-256',
        content: 'O sistema gera cópia de segurança todas as noites e no fechamento do caixa com hash criptográfico.',
        badge: 'Criptografia Segura',
        side: 'bottom',
      },
      {
        element: '#tour-backup-historico',
        title: 'Download & Restauração em 1 Clique',
        content: 'Baixe qualquer arquivo de backup ou restaure seu salão com facilidade caso troque de computador.',
        badge: 'Prontidão Total',
        side: 'top',
      },
    ],
  },
};

// Aliases para garantir compatibilidade com qualquer rota
PAGE_TOURS.agenda = PAGE_TOURS.appointments;
PAGE_TOURS.pdv = PAGE_TOURS['cash-register'];
PAGE_TOURS.caixa = PAGE_TOURS['cash-register'];
PAGE_TOURS.clientes = PAGE_TOURS.clients;
PAGE_TOURS.equipe = PAGE_TOURS.professionals;
PAGE_TOURS.servicos = PAGE_TOURS.services;
PAGE_TOURS.planos = PAGE_TOURS.subscription;

/**
 * Obtém a definição do Tour para qualquer chave ou aba ativa
 */
export const getTour = (tourKey) => {
  if (!tourKey) return PAGE_TOURS.dashboard;
  const normalized = String(tourKey).toLowerCase().trim();
  return PAGE_TOURS[normalized] || PAGE_TOURS.dashboard;
};

export const startTour = (tourKey) => {
  return getTour(tourKey);
};
