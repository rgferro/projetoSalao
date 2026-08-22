import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Play,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Zap,
  CheckCircle2,
  Calendar,
  CreditCard,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Perguntas sugeridas dinâmicas conforme a aba ativa
 */
const CONTEXTUAL_PROMPTS = {
  dashboard: [
    'Como interpretar as métricas do dia?',
    'Como abrir e fechar o caixa?',
    'Quais são as teclas de atalho rápidas?'
  ],
  appointments: [
    'Como marcar agendamento multisserviços (F2)?',
    'Como bloquear folgas e intervalos?',
    'Como funciona a confirmação por WhatsApp?'
  ],
  clients: [
    'Como preencher a ficha de anamnese?',
    'Como funciona o programa de pontos fidelidade?',
    'Como cadastrar novo cliente com atalho F4?'
  ],
  'cash-register': [
    'Como receber comanda via PIX com QR Code?',
    'Como fazer sangria e reforço no caixa?',
    'Como fazer o fechamento cego de caixa?'
  ],
  financial: [
    'Como funciona o DRE de Lucratividade Real?',
    'Como cadastrar contas a pagar?',
    'Como é feito o rateio de comissões?'
  ],
  professionals: [
    'Como cadastrar profissionais na equipe?',
    'Como funciona a Lei do Salão Parceiro?',
    'Como definir permissões de acesso?'
  ],
  services: [
    'Como configurar duração dos serviços?',
    'Como definir comissões por procedimento?'
  ],
  whatsapp: [
    'Como conectar o WhatsApp pelo QR Code?',
    'Como funcionam os lembretes 24h e 2h antes?',
    'Como personalizar os modelos de mensagem?'
  ],
  subscription: [
    'Quais as diferenças dos planos Solo, Starter e Studio?',
    'Como adicionar vagas extras de profissionais?',
    'Como pagar a mensalidade via PIX?'
  ],
  backup: [
    'Como funciona o backup automático no Google Drive?',
    'Como restaurar dados em caso de emergência?'
  ]
};

export default function AIChatWidget({ activeTab, onStartTour, onNavigateTab }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Olá, **${user?.name || 'Gestor(a)'}**! 👋 Sou seu **Assistente Inteligente BelaGestão**.\n\nEstou aqui para tirar qualquer dúvida sobre agenda, caixa/PDV, WhatsApp, comissões ou financeiro.\n\nComo posso te ajudar agora?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Rolagem automática ao enviar mensagem
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focar no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('bella_token') || ''}`,
        },
        body: JSON.stringify({
          message: text,
          activeTab,
          userContext: {
            name: user?.name,
            segment: user?.segment || 'salao',
            plan: user?.plan || 'STARTER',
          },
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success && data.reply) {
        const aiMessage = {
          id: `msg_${Date.now()}_a`,
          sender: 'ai',
          text: data.reply,
          tourSuggestion: data.tourSuggestion,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Falha ao processar resposta da IA.');
      }
    } catch (err) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          sender: 'ai',
          text: 'Desculpe, tive uma instabilidade temporária. Você pode tentar novamente ou consultar o **Manual do Usuário** na barra lateral!',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Conversa reiniciada! Como posso te ajudar com o **BelaGestão Studio** agora?`,
        timestamp: new Date(),
      },
    ]);
  };

  const suggestedPrompts = CONTEXTUAL_PROMPTS[activeTab] || CONTEXTUAL_PROMPTS.dashboard;

  return (
    <>
      {/* Botão Flutuante (Launcher) - Posicionado de forma segura para não sobrepor botões em telas mobile */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-full p-3.5 sm:px-4 sm:py-3 shadow-xl shadow-pink-600/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group"
          title="Abrir Assistente Inteligente IA"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="font-black text-xs hidden sm:inline tracking-wide">
            Assistente IA
          </span>
        </button>
      )}

      {/* Janela de Chat da IA */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex items-end sm:items-center justify-center p-0 sm:p-0">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-200/90 dark:border-slate-800 w-full sm:w-[420px] h-[92vh] sm:h-[580px] flex flex-col overflow-hidden animate-slideUp sm:animate-scaleIn pb-safe">
            
            {/* Header do Chat */}
            <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 p-4 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm">Assistente BelaGestão</h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black uppercase">
                      IA
                    </span>
                  </div>
                  <p className="text-[11px] text-pink-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    Online 24/7 • Suporte Imediato
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Limpar Conversa"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Fechar Assistente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl space-y-2 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-xs shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                    }`}
                  >
                    {/* Renderização simples e limpa de Markdown (negritos, listas e tópicos) */}
                    <div className="whitespace-pre-line font-normal space-y-1">
                      {msg.text.split('\n').map((line, i) => {
                        // Título h3
                        if (line.startsWith('### ')) {
                          return (
                            <h4 key={i} className="font-black text-[13px] text-pink-600 dark:text-pink-400 mt-2 mb-1">
                              {line.replace('### ', '').replace(/\*\*/g, '')}
                            </h4>
                          );
                        }
                        // Lista ordenada ou com traço
                        if (line.match(/^\d+\./) || line.startsWith('- ')) {
                          return (
                            <div key={i} className="flex items-start gap-1.5 pl-1 my-0.5">
                              <span className="text-pink-600 font-bold shrink-0">•</span>
                              <span>
                                {line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').split('**').map((part, pIdx) =>
                                  pIdx % 2 === 1 ? <strong key={pIdx} className="font-black text-slate-950 dark:text-white">{part}</strong> : part
                                )}
                              </span>
                            </div>
                          );
                        }
                        // Linha normal com negrito
                        return (
                          <p key={i} className="my-0.5">
                            {line.split('**').map((part, pIdx) =>
                              pIdx % 2 === 1 ? <strong key={pIdx} className="font-black text-slate-950 dark:text-white">{part}</strong> : part
                            )}
                          </p>
                        );
                      })}
                    </div>

                    {/* Botão de Ação para Iniciar Tour sugerido pela IA */}
                    {msg.tourSuggestion && onStartTour && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <button
                          onClick={() => {
                            if (onNavigateTab && msg.tourSuggestion) {
                              onNavigateTab(msg.tourSuggestion === 'agenda' ? 'appointments' : msg.tourSuggestion);
                            }
                            setTimeout(() => {
                              onStartTour(msg.tourSuggestion);
                            }, 300);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/60 dark:hover:bg-pink-900/60 text-pink-700 dark:text-pink-300 font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-pink-600" />
                          <span>Iniciar Tour Interativo Desta Tela</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-400 px-1 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Indicador de Digitando... */}
              {loading && (
                <div className="flex items-center gap-2 text-slate-500 bg-white dark:bg-slate-800 p-3 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <Bot className="w-4 h-4 text-pink-600 animate-spin" />
                  <span className="text-[11px] font-bold">Assistente analisando sua dúvida...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sugestões Rápidas de Perguntas (Chips) */}
            <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[10px] font-black text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-500" />
                  Sugestões:
                </span>
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-pink-50 dark:bg-slate-800 dark:hover:bg-pink-950/40 text-slate-700 dark:text-slate-300 hover:text-pink-600 text-[10px] font-semibold whitespace-nowrap transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input e Envio de Mensagens */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte sobre qualquer tela ou recurso..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-pink-500 border border-transparent dark:border-slate-700"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
