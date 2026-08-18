import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from '../components/Link';
import api from '../services/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Por favor, preencha nome, e-mail e sua mensagem.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao despachar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-pink-600 selection:text-white pb-20">
      {/* Header institucional */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20">
              ✂️
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                BellaGestão<span className="text-pink-600 font-bold">Studio</span>
              </span>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Fale Conosco
              </div>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-black uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Atendimento Especializado</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Como podemos ajudar o seu salão hoje?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Dúvidas comerciais, suporte técnico ou parcerias? Envie sua mensagem e nossa equipe responderá com prioridade via e-mail e WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Informações de Contato Rápidas */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm">Canais Oficiais</h3>
              
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">E-mail Suporte</div>
                    <div>contato@bellagestao.com.br</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">WhatsApp Comercial</div>
                    <div>(11) 98765-4321</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Sede Corporativa</div>
                    <div>Av. Paulista, 1000 • São Paulo - SP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-pink-400 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Horário de Atendimento</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Segunda a Sábado, das <strong>08h às 20h</strong>. Suporte a incidentes críticos e rotinas de backup 24/7.
              </p>
            </div>
          </div>

          {/* Formulário de Mensagem */}
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            {success ? (
              <div className="text-center py-10 space-y-4 animate-scaleIn">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Mensagem Despachada com Sucesso!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Agradecemos o contato! Nossa equipe já recebeu sua notificação via Brevo e retornará em breve.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                >
                  Enviar Nova Mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-2xl">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seu Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Camila Silveira"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seu Melhor E-mail *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ex: camila@seusalao.com.br"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assunto</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">Selecione um assunto...</option>
                      <option value="Dúvidas Comerciais e Planos">Dúvidas Comerciais e Planos</option>
                      <option value="Suporte Técnico">Suporte Técnico</option>
                      <option value="Sugestão de Funcionalidade">Sugestão de Funcionalidade</option>
                      <option value="Parcerias e Integrações">Parcerias e Integrações</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Como podemos te ajudar? *</label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Descreva detalhadamente sua dúvida ou necessidade..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Despachando Mensagem...' : 'Enviar Mensagem Agora'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
