import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  X,
  Mail,
  Lock,
  Building,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Clock,
  Loader2,
  Home
} from 'lucide-react';
import {
  validateCPF,
  validateCNPJ,
  validatePasswordStrength,
  maskDocument,
  maskPhone,
  maskCEP,
  fetchViaCEP,
} from '../lib/validation';
import { useAuth } from '../context/AuthContext';
import { getCsrfToken } from '../services/api';
import { Link } from '../components/Link';

export default function Register({ onNavigateLogin, onNavigateLanding, onRegisteredSuccess }) {
  const { login } = useAuth();

  const getInitialSegment = () => {
    if (typeof window !== 'undefined') {
      const seg = new URLSearchParams(window.location.search).get('segment');
      if (['barbearia', 'estetica', 'esmalteria', 'lash', 'salao'].includes(seg)) return seg;
    }
    return 'salao';
  };

  const [formData, setFormData] = useState({
    name: '', // Nome do Salão / Empresa
    segment: getInitialSegment(),
    document: '', // CPF ou CNPJ
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    confirmPassword: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Modal de Verificação do Código de 6 Dígitos da Brevo
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  const passwordCheck = validatePasswordStrength(formData.password);

  const handleInputChange = (field, value) => {
    setErrorMsg('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (e) => {
    const masked = maskDocument(e.target.value);
    handleInputChange('document', masked);
  };

  const handlePhoneChange = (e) => {
    const masked = maskPhone(e.target.value);
    handleInputChange('ownerPhone', masked);
  };

  const handleCepChange = async (e) => {
    const masked = maskCEP(e.target.value);
    handleInputChange('cep', masked);

    if (masked.replace(/\D/g, '').length === 8) {
      setLoadingCep(true);
      const address = await fetchViaCEP(masked);
      setLoadingCep(false);
      if (address) {
        setFormData((prev) => ({
          ...prev,
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        }));
      }
    }
  };

  // Etapa 1: Validar formulário e disparar código de 6 dígitos via Brevo
  const handlePreSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) return setErrorMsg('Informe o nome do seu salão.');
    if (!formData.ownerName.trim()) return setErrorMsg('Informe seu nome completo.');
    if (!formData.ownerEmail.trim()) return setErrorMsg('Informe um e-mail válido.');

    if (formData.document) {
      const cleanDoc = formData.document.replace(/\D/g, '');
      if (cleanDoc.length === 11 && !validateCPF(cleanDoc)) {
        return setErrorMsg('CPF inválido. Verifique os dígitos informados.');
      } else if (cleanDoc.length === 14 && !validateCNPJ(cleanDoc)) {
        return setErrorMsg('CNPJ inválido. Verifique os dígitos informados.');
      }
    }

    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg('As senhas digitadas não coincidem.');
    }

    if (!passwordCheck.isValid) {
      return setErrorMsg('A senha precisa atender aos critérios de segurança.');
    }
    if (!acceptTerms) {
      return setErrorMsg('Leia e aceite os Termos de Uso e a Política de Privacidade para continuar.');
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await getCsrfToken() },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: formData.ownerEmail,
          salonName: formData.name,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        return setErrorMsg(data.error || 'Falha ao despachar código de confirmação.');
      }

      setShowCodeModal(true);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Erro de conexão ao enviar código. Verifique se o servidor está ativo.');
    }
  };

  // Etapa 2: Confirmar código de 6 dígitos e concluir cadastro
  const handleConfirmCodeAndRegister = async (e) => {
    e.preventDefault();
    setCodeError('');

    if (!verificationCode.trim() || verificationCode.length < 4) {
      return setCodeError('Digite o código de confirmação recebido.');
    }

    try {
      setVerifyingCode(true);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: verificationCode.trim(),
          acceptTerms,
        }),
      });

      const data = await res.json();
      setVerifyingCode(false);

      if (!res.ok) {
        return setCodeError(data.error || 'Falha ao concluir cadastro.');
      }

      setShowCodeModal(false);
      login(data.user, data.token);
      if (onRegisteredSuccess) onRegisteredSuccess(data.user);
    } catch (err) {
      setVerifyingCode(false);
      setCodeError('Erro ao finalizar cadastro.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Botão Superior para Voltar à Página Inicial */}
      <div className="max-w-2xl w-full mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-pink-600 text-xs font-bold shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </button>

        <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
          BelaGestão Studio
        </span>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-3xl border border-pink-100 shadow-xl p-6 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 text-white text-2xl shadow-md shadow-pink-500/20 mb-2">
            ✨
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Crie sua Conta no BelaGestão Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Experimente Grátis • Sem Cartão de Crédito • Setup Instantâneo
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* Segmento de Atuação */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-600" /> Selecione o Segmento da sua Empresa:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'salao', label: '✂️ Salão & Cabelo', desc: 'Mechas, colorimetria, química' },
                { id: 'barbearia', label: '💈 Barbearia', desc: 'Barba, corte, estilo masculino' },
                { id: 'estetica', label: '✨ Estética & Spa', desc: 'Facial, corporal, harmonização' },
                { id: 'esmalteria', label: '💅 Esmalteria', desc: 'Unhas, gel, fibra de vidro' },
                { id: 'lash', label: '👁️ Lash & Sobrancelhas', desc: 'Extensão, mapping, henna' },
              ].map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => handleInputChange('segment', seg.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    formData.segment === seg.id
                      ? 'border-pink-600 bg-pink-50 text-pink-950 font-bold ring-2 ring-pink-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold">{seg.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{seg.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dados do Salão */}
          <div className="space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
              <Building className="w-4 h-4" /> 1. Dados da Empresa
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nome do Salão / Studio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bela Arte Studio & Cabelo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">CNPJ ou CPF do Salão</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* CEP e Endereço */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>CEP</span>
                  {loadingCep && <span className="text-[10px] text-pink-600 animate-pulse font-normal">Buscando...</span>}
                </label>
                <input
                  type="text"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={handleCepChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Rua / Logradouro</label>
                <input
                  type="text"
                  placeholder="Av. Principal, 123"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Número</label>
                <input
                  type="text"
                  placeholder="123"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bairro</label>
                <input
                  type="text"
                  placeholder="Centro"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cidade</label>
                <input
                  type="text"
                  placeholder="São Paulo"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium text-center"
                />
              </div>
            </div>
          </div>

          {/* Dados do Dono */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-black uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 2. Dados do Proprietário & Acesso
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Camila Silveira"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">WhatsApp para Contato</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={formData.ownerPhone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Seu E-mail Principal *</label>
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={formData.ownerEmail}
                onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
              />
            </div>

            {/* Senha e Confirmação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Senha Segura *</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 dígitos"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirmar Senha *</label>
                <input
                  type="password"
                  required
                  placeholder="Repita sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
                />
              </div>
            </div>

            {/* Checklist de Senha Forte */}
            {formData.password && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1.5">
                <div className="font-bold text-slate-700">Requisitos de Segurança:</div>
                <div className="grid grid-cols-2 gap-1 text-slate-600">
                  <div className={`flex items-center gap-1.5 ${passwordCheck.checks?.length ? 'text-emerald-600 font-bold' : ''}`}>
                    {passwordCheck.checks?.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    6+ Caracteres
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCheck.checks?.number ? 'text-emerald-600 font-bold' : ''}`}>
                    {passwordCheck.checks?.number ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    Ao menos 1 número
                  </div>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-0.5" />
            <span>Li e aceito os <Link to="/termos" className="font-bold text-pink-700 underline">Termos de Uso</Link> e a <Link to="/privacidade" className="font-bold text-pink-700 underline">Política de Privacidade</Link>.</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando Código de Verificação...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-current" />
                <span>Avançar para Confirmação de E-mail →</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Já tem uma conta no BelaGestão?{' '}
          <button
            onClick={onNavigateLogin}
            className="text-pink-600 font-bold hover:underline"
          >
            Fazer login agora
          </button>
        </div>

      </div>

      {/* Modal de Código de 6 Dígitos (Brevo REST API v3) */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✉️
              </div>
              <h3 className="text-xl font-black text-slate-900">Confirme seu E-mail</h3>
              <p className="text-xs text-slate-500">
                Enviamos um código de 6 dígitos para o e-mail: <br />
                <strong className="text-slate-800">{formData.ownerEmail}</strong>
              </p>
            </div>

            {codeError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200">
                {codeError}
              </div>
            )}

            <form onSubmit={handleConfirmCodeAndRegister} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-pink-300 focus:outline-none focus:ring-4 focus:ring-pink-500/20 text-pink-600 font-mono bg-pink-50/50"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={verifyingCode}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar & Ativar Salão'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handlePreSubmit}
                  className="text-xs text-pink-600 font-bold hover:underline"
                >
                  Não recebeu? Clique para reenviar o código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
