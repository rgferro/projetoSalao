/**
 * Definições dos passos do Tour Guiado Interativo para o BellaGestão Studio
 */
export const PAGE_TOURS = {
  dashboard: {
    title: 'Tour Guiado: Dashboard Geral',
    description: 'Aprenda como acompanhar a saúde operacional e financeira do seu salão em tempo real.',
    steps: [
      {
        title: 'Métricas do Dia & Faturamento',
        content: 'Aqui você acompanha instantaneamente o total faturado no dia, agendamentos confirmados e faturamento mensal acumulado.',
        highlight: 'cards-metricas'
      },
      {
        title: 'Status do Caixa Diário',
        content: 'Visualize se o caixa da recepção está aberto ou fechado com o saldo atual do sistema.',
        highlight: 'status-caixa'
      },
      {
        title: 'Aniversariantes do Dia',
        content: 'Identifique quais clientes fazem aniversário hoje para enviar parabéns e cupons automáticos no WhatsApp.',
        highlight: 'aniversariantes'
      },
      {
        title: 'Próximos Atendimentos',
        content: 'Lista rápida dos atendimentos previstos para as próximas horas com profissionais e procedimentos.',
        highlight: 'proximos-atendimentos'
      }
    ]
  },
  agenda: {
    title: 'Tour Guiado: Agenda Inteligente',
    description: 'Domine a grade visual multisserviços e evite conflitos de horários.',
    steps: [
      {
        title: 'Visão por Profissional e Função',
        content: 'Alterne entre visão geral, lista cronológica ou filtre pelas funções de cada colaborador (Cabelo, Nails, Depilação).',
        highlight: 'abas-funcoes'
      },
      {
        title: 'Novo Agendamento Multisserviços (F2)',
        content: 'Adicione múltiplos procedimentos na mesma comanda com profissionais diferentes. O sistema calcula o tempo total sozinho.',
        highlight: 'btn-novo-agendamento'
      },
      {
        title: 'Ciclo de Status do Atendimento',
        content: 'Avance de Agendado ➔ Confirmado ➔ Em Atendimento ➔ Concluído (Faturar). Ao concluir, o sistema calcula os pontos de fidelidade.',
        highlight: 'status-agendamento'
      },
      {
        title: 'Bloqueio de Horários',
        content: 'Bloqueie intervalos de almoço, folgas ou reuniões para que nenhum cliente seja agendado no período indisponível.',
        highlight: 'bloqueio-horarios'
      }
    ]
  },
  clients: {
    title: 'Tour Guiado: Clientes & Anamnese',
    description: 'Como organizar seu CRM e proteger seu salão com fichas técnicas especializadas.',
    steps: [
      {
        title: 'Cadastro Rápido & Boas-Vindas',
        content: 'Ao cadastrar um novo cliente com WhatsApp, o sistema pode despachar automaticamente uma mensagem de boas-vindas com carinho.',
        highlight: 'cadastro-cliente'
      },
      {
        title: 'Ficha de Anamnese Técnica Especializada',
        content: 'Registre fórmulas de tintura capilar, preferências de unhas em gel e restrições alérgicas de depilação.',
        highlight: 'ficha-anamnese'
      },
      {
        title: 'Programa Fidelidade por Pontos',
        content: 'A cada R$ 10 gastos em serviços o cliente ganha 1 ponto. Você pode consultar o saldo e fazer resgates no balcão.',
        highlight: 'fidelidade-pontos'
      }
    ]
  },
  pdv: {
    title: 'Tour Guiado: Frente de Caixa & PDV',
    description: 'Recebimento de comandas com PIX dinâmico, cartões e fechamento cego de caixa.',
    steps: [
      {
        title: 'Abertura com Fundo de Troco',
        content: 'Abra o turno informando o valor em dinheiro na gaveta. Todas as movimentações ficam registradas com auditoria.',
        highlight: 'abertura-caixa'
      },
      {
        title: 'Checkout em 1 Clique (F3)',
        content: 'Receba comandas avulsas ou de agendamentos. Suporta PIX com QR Code dinâmico na tela, cartões, dinheiro e vouchers.',
        highlight: 'checkout-pdv'
      },
      {
        title: 'Sangrias e Reforços',
        content: 'Retiradas para compras rápidas ou pagamentos devem ser registradas com justificativa para não descompassar o caixa.',
        highlight: 'movimentos-caixa'
      },
      {
        title: 'Fechamento de Caixa com Backup em Nuvem',
        content: 'No final do dia, informe os valores contados. Ao fechar, o sistema envia uma cópia de segurança imediata para o Google Drive.',
        highlight: 'fechamento-caixa'
      }
    ]
  },
  whatsapp: {
    title: 'Tour Guiado: Automação do WhatsApp',
    description: 'Pareamento em 1 clique para disparos silenciosos 100% gratuitos.',
    steps: [
      {
        title: 'Pareamento por QR Code',
        content: 'Aponte o WhatsApp do salão para o QR Code. O microserviço dedicado mantém o socket conectado 24 horas por dia.',
        highlight: 'qr-code-wa'
      },
      {
        title: 'Lembretes 24h e 2h Antes',
        content: 'O robô envia lembretes automáticos com nome, dia, hora e serviços para diminuir faltas (no-show) em até 80%.',
        highlight: 'lembretes-auto'
      },
      {
        title: 'Modelos de Mensagem Personalizáveis',
        content: 'Edite o texto dos modelos usando variáveis dinâmicas como {cliente}, {horario}, {servicos} e {profissional}.',
        highlight: 'modelos-wa'
      }
    ]
  }
};

export const startTour = (tourKey) => {
  return PAGE_TOURS[tourKey] || PAGE_TOURS.dashboard;
};
