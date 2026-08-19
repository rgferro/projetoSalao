/**
 * Segment Theme & Customization Engine
 * BelaGestão Studio - Multi-Segment Dynamic Theming
 */

export const SEGMENT_CONFIGS = {
  barbearia: {
    id: 'barbearia',
    label: 'Barbearia Moderna',
    shortLabel: 'Barbearia',
    badgeLabel: 'Barbearia & Barber Club',
    icon: '💈',
    colorHex: '#f59e0b',
    // Paleta de Cores e Gradientes Tailwind
    theme: {
      primary: 'amber-500',
      primaryDark: 'amber-600',
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      gradientHover: 'hover:from-amber-600 hover:to-orange-700',
      buttonGradient: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black shadow-md shadow-amber-500/20',
      btnSecondary: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100',
      activeTab: 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs',
      textAccent: 'text-amber-600 dark:text-amber-400',
      textAccentLight: 'text-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      borderLight: 'border-amber-200 dark:border-amber-800/50',
      badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      tagBadge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
      tagBadgeSelected: 'bg-amber-500 text-slate-950 font-black shadow-xs',
      glow: 'shadow-amber-500/20',
      activeSidebar: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/25',
    },
    // Textos e Labels Específicos para a Equipe
    team: {
      title: 'Equipe de Barbeiros & Especialistas',
      subtitle: 'Cadeiras, barbeiros especialistas (Fade, Navalha, Barbaterapia) e regras de comissão',
      newMemberBtn: 'Novo Barbeiro',
      newModalTitle: 'Cadastrar Novo Barbeiro / Profissional',
      editModalTitle: 'Editar Barbeiro / Membro da Equipe',
      defaultRole: 'Barbeiro / Corte Masculino',
      placeholderName: 'Ex: Diego Silveira',
      placeholderNickname: 'Ex: Diego Navalha',
      placeholderCustomTag: 'Adicionar especialidade (ex: Visagismo, Nevou, Barbaterapia)...',
      defaultColor: '#f59e0b',
    },
    // Especialidades Sugeridas
    specialties: [
      { id: 'barbeiro', name: 'Barbeiro / Corte Masculino', category: 'Barba & Corte', color: '#f59e0b' },
      { id: 'barba_navalha', name: 'Barba & Toalha Quente', category: 'Barba & Corte', color: '#ea580c' },
      { id: 'fade', name: 'Corte Degradê / Fade', category: 'Estilo & Corte', color: '#d97706' },
      { id: 'pigmentacao', name: 'Pigmentação de Barba & Cabelo', category: 'Química & Barba', color: '#b45309' },
      { id: 'nevou', name: 'Platinado / Nevou', category: 'Química & Barba', color: '#f59e0b' },
      { id: 'selagem_masc', name: 'Selagem / Alisamento Masculino', category: 'Tratamentos', color: '#fbbf24' },
      { id: 'sobrancelha_masc', name: 'Design de Sobrancelha Masculina', category: 'Estética Masculina', color: '#d97706' },
      { id: 'visagismo', name: 'Visagismo & Barbaterapia', category: 'Tratamentos', color: '#ea580c' },
      { id: 'terapia_capilar_masc', name: 'Tratamento Antiqueda / Capilar', category: 'Tratamentos', color: '#f59e0b' },
      { id: 'auxiliar_barbearia', name: 'Auxiliar / Apoio de Barbearia', category: 'Apoio', color: '#78716c' },
    ],
    serviceCategories: [
      { id: 'all', label: 'Todos os Serviços' },
      { id: 'Cabelo', label: '✂️ Corte & Fade' },
      { id: 'Barba', label: '💈 Barba & Navalha' },
      { id: 'Química', label: '⚡ Platinado & Químicas' },
      { id: 'Tratamentos', label: '🧴 Barbaterapia & Spa' },
      { id: 'Estética', label: '🧼 Sobrancelha & Cuidados' },
    ]
  },

  estetica: {
    id: 'estetica',
    label: 'Estética & Spa',
    shortLabel: 'Estética',
    badgeLabel: 'Clínica de Estética & Bem-Estar',
    icon: '✨',
    colorHex: '#10b981',
    theme: {
      primary: 'emerald-600',
      primaryDark: 'emerald-700',
      gradient: 'from-emerald-600 via-teal-500 to-emerald-700',
      gradientHover: 'hover:from-emerald-700 hover:to-teal-700',
      buttonGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20',
      btnSecondary: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100',
      activeTab: 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
      textAccentLight: 'text-emerald-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderLight: 'border-emerald-200 dark:border-emerald-800/50',
      badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      tagBadge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
      tagBadgeSelected: 'bg-emerald-600 text-white font-bold shadow-xs',
      glow: 'shadow-emerald-600/20',
      activeSidebar: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/25',
    },
    team: {
      title: 'Equipe de Estética, Saúde & Terapeutas',
      subtitle: 'Profissionais habilitados (Facial, Corporal, Injetáveis, Drenagem) e regras de comissão',
      newMemberBtn: 'Nova Esteticista',
      newModalTitle: 'Cadastrar Nova Esteticista / Especialista',
      editModalTitle: 'Editar Profissional de Estética',
      defaultRole: 'Esteticista Facial & Corporal',
      placeholderName: 'Ex: Dra. Juliana Matos',
      placeholderNickname: 'Ex: Ju Esteta',
      placeholderCustomTag: 'Adicionar especialidade (ex: Criolipólise, Microagulhamento, Botox)...',
      defaultColor: '#10b981',
    },
    specialties: [
      { id: 'esteticista_facial', name: 'Esteticista Facial & Corporal', category: 'Facial & Corporal', color: '#10b981' },
      { id: 'biomedica', name: 'Biomédica Esteta / Injetáveis', category: 'Injetáveis & Avançada', color: '#059669' },
      { id: 'massoterapeuta', name: 'Massoterapeuta / Bem-Estar', category: 'Massagens & Spa', color: '#0d9488' },
      { id: 'drenagem', name: 'Drenagem Linfática / Pós-Operatório', category: 'Corporal', color: '#14b8a6' },
      { id: 'limpeza_pele', name: 'Limpeza de Pele Profunda & Peeling', category: 'Facial', color: '#10b981' },
      { id: 'depilacao_laser', name: 'Depiladora (Laser / Cera)', category: 'Depilação', color: '#06b6d4' },
      { id: 'harmonizacao', name: 'Harmonização Facial & Toxina', category: 'Injetáveis & Avançada', color: '#047857' },
      { id: 'estrias_celulite', name: 'Tratamento de Estrias & Gordura', category: 'Corporal', color: '#059669' },
      { id: 'spa_relax', name: 'Spa Relaxante & Aromaterapia', category: 'Massagens & Spa', color: '#0d9488' },
      { id: 'auxiliar_estetica', name: 'Auxiliar de Clínica & Cabine', category: 'Apoio', color: '#64748b' },
    ],
    serviceCategories: [
      { id: 'all', label: 'Todos os Serviços' },
      { id: 'Facial', label: '✨ Facial & Peeling' },
      { id: 'Corporal', label: '💆 Corporal & Drenagem' },
      { id: 'Injetáveis', label: '💉 Injetáveis & Harmonização' },
      { id: 'Depilação', label: '🔥 Depilação Laser/Cera' },
      { id: 'Massagens', label: '🌿 Massagens & Spa' },
    ]
  },

  esmalteria: {
    id: 'esmalteria',
    label: 'Esmalteria & Nail Studio',
    shortLabel: 'Esmalteria',
    badgeLabel: 'Studio de Unhas & Alongamento',
    icon: '💅',
    colorHex: '#d946ef',
    theme: {
      primary: 'fuchsia-600',
      primaryDark: 'fuchsia-700',
      gradient: 'from-fuchsia-600 via-pink-500 to-rose-600',
      gradientHover: 'hover:from-fuchsia-700 hover:to-pink-700',
      buttonGradient: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold shadow-md shadow-fuchsia-600/20',
      btnSecondary: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800/60 hover:bg-fuchsia-100',
      activeTab: 'bg-white dark:bg-slate-900 text-fuchsia-600 dark:text-fuchsia-400 shadow-xs',
      textAccent: 'text-fuchsia-600 dark:text-fuchsia-400',
      textAccentLight: 'text-fuchsia-500',
      bgLight: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
      borderLight: 'border-fuchsia-200 dark:border-fuchsia-800/50',
      badge: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800',
      tagBadge: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/40',
      tagBadgeSelected: 'bg-fuchsia-600 text-white font-bold shadow-xs',
      glow: 'shadow-fuchsia-600/20',
      activeSidebar: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold shadow-md shadow-fuchsia-600/25',
    },
    team: {
      title: 'Equipe de Nail Designers & Manicures',
      subtitle: 'Mesas de atendimento, designers em Gel/Fibra, Manicure Russa e repasses',
      newMemberBtn: 'Nova Nail Designer',
      newModalTitle: 'Cadastrar Nova Nail Designer / Manicure',
      editModalTitle: 'Editar Nail Designer / Membro da Equipe',
      defaultRole: 'Nail Designer (Gel/Fibra)',
      placeholderName: 'Ex: Patrícia Alves',
      placeholderNickname: 'Ex: Pati Nails',
      placeholderCustomTag: 'Adicionar especialidade (ex: Fibra de Vidro, Molde F1, Blindagem)...',
      defaultColor: '#d946ef',
    },
    specialties: [
      { id: 'nail_designer_gel', name: 'Nail Designer (Gel / Fibra / Acrílico)', category: 'Alongamento', color: '#d946ef' },
      { id: 'manicure_tradicional', name: 'Manicure & Pedicure Tradicional', category: 'Unhas', color: '#ec4899' },
      { id: 'esmaltacao_gel', name: 'Esmaltação em Gel & Blindagem', category: 'Unhas & Gel', color: '#f43f5e' },
      { id: 'manicure_russa', name: 'Manicure Russa / Hardware', category: 'Cuticulagem Avançada', color: '#c026d3' },
      { id: 'spa_pes', name: 'Spa dos Pés / Plástica dos Pés', category: 'Cuidados & Pés', color: '#db2777' },
      { id: 'polygel', name: 'Alongamento Polygel & Molde F1', category: 'Alongamento', color: '#a21caf' },
      { id: 'nail_art', name: 'Decoração & Nail Art Avançada', category: 'Arte & Estilo', color: '#e11d48' },
      { id: 'cuticulagem', name: 'Cuticulagem Especializada', category: 'Unhas', color: '#d946ef' },
      { id: 'podologia_prev', name: 'Podologia & Saúde das Unhas', category: 'Saúde', color: '#be185d' },
      { id: 'auxiliar_esmalteria', name: 'Auxiliar de Esmalteria', category: 'Apoio', color: '#64748b' },
    ],
    serviceCategories: [
      { id: 'all', label: 'Todos os Serviços' },
      { id: 'Alongamento', label: '💅 Alongamento Gel/Fibra' },
      { id: 'Unhas', label: '✨ Manicure & Pedicure' },
      { id: 'Esmaltação', label: '💎 Esmaltação em Gel' },
      { id: 'Spa dos Pés', label: '🦶 Spa & Plástica dos Pés' },
      { id: 'Nail Art', label: '🎨 Decoração & Nail Art' },
    ]
  },

  lash: {
    id: 'lash',
    label: 'Lash & Sobrancelhas',
    shortLabel: 'Lash & Brow',
    badgeLabel: 'Studio de Cílios & Sobrancelhas',
    icon: '👁️',
    colorHex: '#f43f5e',
    theme: {
      primary: 'rose-600',
      primaryDark: 'rose-700',
      gradient: 'from-rose-600 via-purple-600 to-indigo-600',
      gradientHover: 'hover:from-rose-700 hover:to-purple-700',
      buttonGradient: 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold shadow-md shadow-rose-600/20',
      btnSecondary: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100',
      activeTab: 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs',
      textAccent: 'text-rose-600 dark:text-rose-400',
      textAccentLight: 'text-rose-500',
      bgLight: 'bg-rose-50 dark:bg-rose-950/30',
      borderLight: 'border-rose-200 dark:border-rose-800/50',
      badge: 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      tagBadge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
      tagBadgeSelected: 'bg-rose-600 text-white font-bold shadow-xs',
      glow: 'shadow-rose-600/20',
      activeSidebar: 'bg-gradient-to-r from-rose-600 to-purple-600 text-white font-bold shadow-md shadow-rose-600/25',
    },
    team: {
      title: 'Equipe de Lash Designers & Sobrancelhas',
      subtitle: 'Macas de atendimento, extensões (Fio a Fio, Russo, Brasileiro), Brow e comissões',
      newMemberBtn: 'Nova Lash Designer',
      newModalTitle: 'Cadastrar Nova Lash Designer / Especialista',
      editModalTitle: 'Editar Lash Designer / Membro da Equipe',
      defaultRole: 'Lash Designer / Cílios',
      placeholderName: 'Ex: Larissa Alencar',
      placeholderNickname: 'Ex: Lari Cílios',
      placeholderCustomTag: 'Adicionar especialidade (ex: Volume Híbrido, Henna, Fox Eyes)...',
      defaultColor: '#f43f5e',
    },
    specialties: [
      { id: 'lash_fio_a_fio', name: 'Lash Designer (Fio a Fio Clássico)', category: 'Extensão de Cílios', color: '#f43f5e' },
      { id: 'volume_russo', name: 'Lash Designer (Volume Russo / Mega)', category: 'Extensão de Cílios', color: '#e11d48' },
      { id: 'volume_brasileiro', name: 'Lash Designer (Volume Brasileiro / Y)', category: 'Extensão de Cílios', color: '#ec4899' },
      { id: 'designer_sobrancelhas', name: 'Designer de Sobrancelhas (Henna / Tintura)', category: 'Sobrancelhas', color: '#a855f7' },
      { id: 'brow_lamination', name: 'Brow Lamination & Nutrição', category: 'Sobrancelhas', color: '#9333ea' },
      { id: 'lash_lifting', name: 'Lash Lifting & Botox de Cílios', category: 'Cílios Naturais', color: '#f43f5e' },
      { id: 'micropigmentacao', name: 'Micropigmentação / Microblading', category: 'Micropigmentação', color: '#7e22ce' },
      { id: 'depilacao_egipcia', name: 'Depilação Egípcia Facial (Linha)', category: 'Facial', color: '#d946ef' },
      { id: 'manutencao_cilios', name: 'Manutenção & Remoção de Cílios', category: 'Extensão de Cílios', color: '#fb7185' },
      { id: 'auxiliar_lash', name: 'Auxiliar / Atendimento Lash', category: 'Apoio', color: '#64748b' },
    ],
    serviceCategories: [
      { id: 'all', label: 'Todos os Serviços' },
      { id: 'Cílios', label: '👁️ Extensões de Cílios' },
      { id: 'Sobrancelhas', label: '✨ Sobrancelhas & Henna' },
      { id: 'Lifting', label: '🌸 Lash Lifting & Brow' },
      { id: 'Micropigmentação', label: '🎨 Micropigmentação' },
      { id: 'Manutenção', label: '🔄 Manutenção & Remoção' },
    ]
  },

  salao: {
    id: 'salao',
    label: 'Salão de Beleza & Cabelo',
    shortLabel: 'Salão & Cabelo',
    badgeLabel: 'Salão de Beleza & Centro de Estética',
    icon: '✂️',
    colorHex: '#ec4899',
    theme: {
      primary: 'pink-600',
      primaryDark: 'pink-700',
      gradient: 'from-pink-600 via-rose-500 to-purple-600',
      gradientHover: 'hover:from-pink-700 hover:to-purple-700',
      buttonGradient: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold shadow-md shadow-pink-600/20',
      btnSecondary: 'bg-pink-50 dark:bg-pink-950/50 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60 hover:bg-pink-100',
      activeTab: 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs',
      textAccent: 'text-pink-600 dark:text-pink-400',
      textAccentLight: 'text-pink-500',
      bgLight: 'bg-pink-50 dark:bg-pink-950/30',
      borderLight: 'border-pink-200 dark:border-pink-800/50',
      badge: 'bg-pink-100 text-pink-900 dark:bg-pink-950/60 dark:text-pink-300 border-pink-300 dark:border-pink-800',
      tagBadge: 'bg-pink-50 dark:bg-pink-950/50 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
      tagBadgeSelected: 'bg-pink-600 text-white font-bold shadow-xs',
      glow: 'shadow-pink-600/20',
      activeSidebar: 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-md shadow-pink-600/25',
    },
    team: {
      title: 'Equipe, Especialidades & Repasse de Comissões',
      subtitle: 'Perfis de acesso, funções extensíveis (Cabeleireira, Manicure, Maquiadora) e comissões',
      newMemberBtn: 'Novo Membro da Equipe',
      newModalTitle: 'Cadastrar Novo Profissional',
      editModalTitle: 'Editar Profissional da Equipe',
      defaultRole: 'Cabeleireira / Hair Stylist',
      placeholderName: 'Ex: Camila Silveira',
      placeholderNickname: 'Ex: Camila Hair',
      placeholderCustomTag: 'Adicionar outra função (ex: Escovista, Mega Hair, Lash)...',
      defaultColor: '#ec4899',
    },
    specialties: [
      { id: 'cabeleireira', name: 'Cabeleireira / Hair Stylist', category: 'Cabelo', color: '#ec4899' },
      { id: 'colorista', name: 'Colorista / Terapeuta Capilar', category: 'Cabelo', color: '#d946ef' },
      { id: 'escovista', name: 'Escovista / Penteados', category: 'Cabelo', color: '#f43f5e' },
      { id: 'manicure', name: 'Manicure & Pedicure', category: 'Unhas', color: '#fb7185' },
      { id: 'nail_designer', name: 'Nail Designer (Gel/Fibra)', category: 'Unhas', color: '#db2777' },
      { id: 'depiladora', name: 'Depiladora (Cera / Laser)', category: 'Depilação', color: '#06b6d4' },
      { id: 'esteticista', name: 'Esteticista Facial & Corporal', category: 'Estética', color: '#0ea5e9' },
      { id: 'maquiadora', name: 'Maquiadora Profissional', category: 'Make', color: '#8b5cf6' },
      { id: 'lash', name: 'Lash Designer / Sobrancelha', category: 'Olhar', color: '#a855f7' },
      { id: 'auxiliar', name: 'Auxiliar / Lavatório', category: 'Apoio', color: '#64748b' },
    ],
    serviceCategories: [
      { id: 'all', label: 'Todos os Serviços' },
      { id: 'Cabelo', label: '💇 Cabelo & Mechas' },
      { id: 'Manicure', label: '💅 Manicure & Alongamento' },
      { id: 'Depilação', label: '✨ Depilação' },
      { id: 'Maquiagem', label: '💄 Maquiagem & Estética' },
    ]
  }
};

/**
 * Retorna a configuração completa do segmento com fallback para 'salao'
 */
export function getSegmentConfig(segmentKey) {
  if (!segmentKey) return SEGMENT_CONFIGS.salao;
  const key = String(segmentKey).toLowerCase().trim();
  return SEGMENT_CONFIGS[key] || SEGMENT_CONFIGS.salao;
}

/**
 * Retorna o tema visual do segmento
 */
export function getSegmentTheme(segmentKey) {
  return getSegmentConfig(segmentKey).theme;
}

/**
 * Retorna as especialidades padrão para o segmento
 */
export function getSegmentSpecialties(segmentKey) {
  return getSegmentConfig(segmentKey).specialties;
}

/**
 * Retorna as categorias de serviços para o segmento
 */
export function getSegmentServiceCategories(segmentKey) {
  return getSegmentConfig(segmentKey).serviceCategories || SEGMENT_CONFIGS.salao.serviceCategories;
}

/**
 * Retorna os textos e defaults de equipe para o segmento
 */
export function getSegmentTeamConfig(segmentKey) {
  return getSegmentConfig(segmentKey).team;
}
