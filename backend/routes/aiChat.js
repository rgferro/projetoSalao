const express = require('express');
const router = express.Router();
const logger = require('../services/logger');

/**
 * Base de Conhecimento e Especialista do BelaGestão Studio
 */
const SYSTEM_KNOWLEDGE_BASE = [
  {
    topics: ['agendamento', 'marcar', 'agenda', 'f2', 'comanda', 'multiservico', 'horario', 'grade'],
    response: `### 📅 Como funciona a **Agenda Inteligente & Multisserviços**:
1. **Novo Agendamento Rápido:** Pressione a tecla **F2** no teclado ou toque no botão **"+ Novo Agendamento (F2)"** no topo da tela.
2. **Multisserviços na Mesma Comanda:** Você pode vincular múltiplos procedimentos (ex: *Corte + Barba + Hidratação*) com profissionais diferentes no mesmo atendimento. O sistema soma a duração e bloqueia a grade automaticamente.
3. **Ciclo do Atendimento:**
   - 🟡 **Agendado:** Horário reservado.
   - 🔵 **Confirmado:** Cliente confirmou presença via WhatsApp.
   - 🟣 **Em Atendimento:** Cliente na cadeira/sala.
   - 🟢 **Concluído:** Atendimento finalizado pronto para faturamento no Caixa/PDV.
4. **Bloqueio de Horários:** Bloqueie intervalos de almoço ou folgas diretamente na grade para evitar agendamentos indevidos.`,
    tourKey: 'appointments',
  },
  {
    topics: ['caixa', 'pdv', 'fechar caixa', 'abrir caixa', 'f3', 'sangria', 'reforco', 'pix', 'gaveta'],
    response: `### 💳 Como operar a **Frente de Caixa & PDV (F3)**:
1. **Abertura de Caixa:** Ao iniciar o expediente, informe o **Fundo de Troco** (dinheiro físico na gaveta).
2. **Recebimento de Comandas (F3):**
   - Aceita **PIX Dinâmico com QR Code na tela**, Cartão de Débito, Cartão de Crédito, Dinheiro e Pontos Fidelidade.
   - O rateio de comissões dos profissionais é calculado automaticamente no momento do recebimento.
3. **Sangrias & Reforços:**
   - **Sangria:** Saída de dinheiro da gaveta para pagamentos ou despesas avulsas (com justificativa obrigatória).
   - **Reforço:** Entrada de troco ou dinheiro extra no caixa.
4. **Fechamento Cego de Caixa:**
   - No final do turno, clique em **"Fechar Caixa"** e conte os valores físicos.
   - Ao fechar, o sistema gera o resumo diário de entradas/saídas e dispara um **Backup Automático em Nuvem**.`,
    tourKey: 'cash-register',
  },
  {
    topics: ['whatsapp', 'qrcode', 'qr code', 'lembrete', 'desconectar', 'robo', 'automacao', 'faltas', 'no-show'],
    response: `### 💬 Como funciona a **Automação do WhatsApp**:
1. **Pareamento em 1 Clique:** Acesse a aba **WhatsApp Automático** e aponte o WhatsApp do salão para o QR Code gerado na tela.
2. **Microserviço Silencioso (Baileys 24/7):** Uma vez pareado, o sistema roda em segundo plano sem necessidade de manter o WhatsApp Web aberto.
3. **Disparos Automáticos:**
   - **Lembrete 24h Antes:** Notifica o cliente um dia antes com data e horário.
   - **Lembrete 2h Antes:** Alerta de última hora para evitar atrasos e esquecimentos.
   - **Boas-Vindas:** Mensagem acolhedora enviada assim que um novo cliente é cadastrado.
4. **Modelos Customizáveis:** Você pode personalizar os textos usando tags automáticas: \`{cliente}\`, \`{horario}\`, \`{servicos}\` e \`{salao}\`.`,
    tourKey: 'whatsapp',
  },
  {
    topics: ['cliente', 'anamnese', 'fidelidade', 'pontos', 'f4', 'historico', 'tintura', 'alergia'],
    response: `### 👥 Gestão de **Clientes, Anamnese & Fidelidade (F4)**:
1. **Cadastro Rápido (F4):** Salve nome, WhatsApp, aniversário e preferências.
2. **Ficha de Anamnese Técnica:**
   - Registre histórico capilar, fórmulas de química/coloração, mapeamento de curvatura (Lash) ou tipos de alongamento (Unhas).
   - Registre restrições alérgicas e termos de consentimento.
3. **Programa de Pontos Fidelidade:**
   - A cada R$ 10,00 consumidos em serviços, o cliente acumula 1 ponto de fidelidade.
   - Os pontos podem ser abatidos como desconto no caixa (ex: 20 pontos = R$ 20,00 de desconto).`,
    tourKey: 'clients',
  },
  {
    topics: ['profissional', 'equipe', 'comissao', 'porcentagem', 'lei salao parceiro', 'colaborador', 'vaga'],
    response: `### ✂️ Gestão de **Equipe & Comissões (Lei Salão Parceiro)**:
1. **Cadastro de Profissionais:** Defina nome, especialidade (*Cabeleireira, Barbeiro, Manicure, Esteticista, Lash Designer*), login e comissão percentual.
2. **Lei do Salão Parceiro:** O sistema deduz automaticamente insumos e produtos antes do cálculo de comissão líquida do parceiro.
3. **Extrato Individual de Comissões:** Cada profissional pode ter acesso restrito para visualizar apenas sua própria agenda e seus extratos de comissão diários/semanais.`,
    tourKey: 'professionals',
  },
  {
    topics: ['financeiro', 'dre', 'lucro', 'despesa', 'fluxo de caixa', 'contas a pagar', 'faturamento'],
    response: `### 📊 **Financeiro, Fluxo de Caixa & DRE**:
1. **DRE de Lucratividade Real:** Visualize receitas brutas, deduções de comissões, custos operacionais fixos e lucro líquido do período.
2. **Contas a Pagar & Receber:** Agende despesas com fornecedores, aluguel, luz e produtos para receber alertas de contas a vencer no Dashboard.
3. **Gráficos de Performance:** Acompanhe o tíquete médio por cliente, faturamento acumulado no mês e curva de crescimento anual.`,
    tourKey: 'financial',
  },
  {
    topics: ['plano', 'assinatura', 'starter', 'studio', 'premier', 'solo', 'pix', 'renovar', 'upgrade', 'mensalidade', 'preco', 'vagas'],
    response: `### ⭐ **Planos & Assinatura do Salão**:
1. **Plano Solo (R$ 0,00/mês):** Para profissional autônoma com agenda única e até 40 agendamentos/mês.
2. **Starter (R$ 69,90/mês):** Até 2 profissionais, agendamentos ilimitados, PDV e lembretes de WhatsApp.
3. **Studio Pro (R$ 139,90/mês - Mais Escolhido):** Até 5 profissionais inclusos (+R$ 15/extra), comissões Lei Salão Parceiro, WhatsApp automático 24h/2h, DRE financeiro e backup Google Drive.
4. **Premier Club (R$ 229,90/mês):** Até 15 profissionais inclusos, redes/múltiplas filiais, CRM de reativação e suporte VIP.
5. **Pagamento Instantâneo via PIX:** A liberação ocorre na hora assim que o QR Code do Mercado Pago é pago.`,
    tourKey: 'subscription',
  },
  {
    topics: ['backup', 'drive', 'nuvem', 'google drive', 'seguranca', 'perder dados', 'restaurar'],
    response: `### ☁️ **Backup Automático & Nuvem**:
1. **Backup Diário Automático:** Executado todas as noites às 23h e a cada fechamento de caixa.
2. **Integração Google Drive:** O arquivo criptografado do banco de dados SQLite com hash de integridade SHA-256 é enviado diretamente para o Drive.
3. **Restauração em 1 Clique:** Na aba **Backup & Nuvem**, você pode baixar qualquer cópia histórica ou forçar um backup imediato.`,
    tourKey: 'backup',
  },
  {
    topics: ['atalhos', 'teclado', 'f1', 'f2', 'f3', 'f4', 'rapidez'],
    response: `### ⌨️ **Teclas de Atalho de Alta Produtividade**:
- **F1:** Abre a Central de Atalhos e Ajuda Rápida.
- **F2:** Abre o modal de **Novo Agendamento Multisserviços**.
- **F3:** Abre a tela de **Frente de Caixa & PDV**.
- **F4:** Abre o modal de **Novo Cadastro de Cliente**.
- **ESC:** Fecha qualquer janela modal aberta.`,
    tourKey: 'dashboard',
  },
];

/**
 * Processador Inteligente com Fallback Semântico e Suporte a Modelos LLM Externos
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, activeTab, userContext } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem não informada.' });
    }

    const cleanMsg = message.trim().toLowerCase();
    const segment = userContext?.segment || 'salao';
    const userName = userContext?.name || 'Gestor(a)';

    // 1. Tentar chamada à API externa (Gemini) se chave configurada
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Você é a IA Especialista e Assistente de Suporte Oficial do sistema "BelaGestão Studio", um SaaS completo para Salões de Beleza, Barbearias, Clínicas de Estética, Esmalterias e Lash Designers.
O usuário se chama ${userName} e o segmento do seu espaço é "${segment}". A tela atual que ele está visualizando é "${activeTab || 'dashboard'}".
Responda de forma extremamente cordial, prática e objetiva em Português do Brasil com formatação rica em Markdown (tópicos, negrito, ícones).
Instrua como usar o sistema (atalhos F2 para agendamento, F3 para caixa/PDV, F4 para clientes, F1 para atalhos, módulo WhatsApp com Baileys sem taxas, comissões Lei Salão Parceiro, Planos Solo/Starter/Studio/Premier, Backups em nuvem).
Pergunta do usuário: "${message}"`
                    }
                  ]
                }
              ]
            })
          }
        );
        const geminiData = await geminiRes.json();
        const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.json({
            success: true,
            reply,
            source: 'gemini',
            tourSuggestion: activeTab || 'dashboard',
          });
        }
      } catch (geminiErr) {
        logger.warn('Fallback para motor semântico local do chatbot:', { error: geminiErr.message });
      }
    }

    // 2. Motor Semântico Local Integrado (24/7 sem falhas nem dependências de rede externa)
    let bestMatch = null;
    let maxScore = 0;

    for (const item of SYSTEM_KNOWLEDGE_BASE) {
      let score = 0;
      for (const topic of item.topics) {
        if (cleanMsg.includes(topic)) {
          score += 2;
        }
      }
      // Bônus se o tópico corresponde à tela atual
      if (item.tourKey === activeTab || (activeTab === 'appointments' && item.tourKey === 'appointments')) {
        score += 1;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && maxScore >= 2) {
      return res.json({
        success: true,
        reply: `Olá, **${userName}**! Aqui está a orientação que você precisa:\n\n${bestMatch.response}\n\n💡 *Dica:* Você também pode clicar no botão **"Iniciar Tour desta Tela"** para ver o passo a passo interativo!`,
        tourSuggestion: bestMatch.tourKey,
        source: 'knowledge_engine',
      });
    }

    // Resposta padrão contextual inteligente
    const defaultResponse = `Olá, **${userName}**! Sou o **Assistente Inteligente do BelaGestão Studio** 🌸.

Posso te orientar em qualquer funcionalidade do sistema para o seu espaço de **${segment.toUpperCase()}**:
- 📅 **Agenda & Agendamentos Multisserviços (F2)**
- 💳 **Frente de Caixa, PDV & Baixa por PIX (F3)**
- 💬 **Conexão de WhatsApp Automático com QR Code**
- 👥 **Cadastro de Clientes, Anamnese & Pontos Fidelidade (F4)**
- ✂️ **Cálculo de Comissões (Lei do Salão Parceiro)**
- 📊 **DRE Financeiro e Contas a Pagar/Receber**
- ⭐ **Gerenciamento de Planos e Assinatura**

Como posso te ajudar especificamente hoje? Você também pode clicar nas perguntas rápidas sugeridas abaixo!`;

    return res.json({
      success: true,
      reply: defaultResponse,
      tourSuggestion: activeTab || 'dashboard',
      source: 'knowledge_engine_greeting',
    });
  } catch (err) {
    logger.error('Erro no chatbot IA:', { error: err.message });
    res.status(500).json({ error: 'Erro ao processar mensagem do assistente.' });
  }
});

module.exports = router;
