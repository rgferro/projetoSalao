# 💈 BellaGestão Studio - Sistema de Gestão para Salão de Beleza e Estética

> Sistema completo, moderno e robusto de gestão para salões de beleza e centros de estética (Cabelo, Manicure/Pedicure, Depilação e Maquiagem), projetado para **execução 100% local** com persistência segura em **SQLite** e rotinas de backup local e em nuvem (**Google Drive**).

---

## 🌟 Principais Funcionalidades

### 1. 👥 Gestão de Clientes & CRM Avançado
* **Cadastro Completo**: Nome, WhatsApp com link direto de chat, e-mail, data de nascimento, CPF e endereço.
* **Ficha de Anamnese Técnica Especializada**:
  * **Cabelo**: Tipo de fio, fórmulas químicas de coloração salvas, sensibilidades e histórico capilar.
  * **Depilação**: Fototipo, tipo de cera/método, histórico de foliculite e alergias.
  * **Manicure & Maquiagem**: Formato de unha preferido, restrições a gel/monômeros e tipo de pele.
* **Programa de Fidelidade**: Acúmulo de 1 ponto a cada R$ 10 gastos em serviços com resgate e controle de saldo.
* **Histórico Completo**: Visualização de todos os atendimentos e serviços passados de cada cliente.

### 2. 📅 Agenda & Grade Inteligente
* **Grade Visual por Profissional**: Visão em colunas simultâneas lado a lado ou lista cronológica.
* **Atendimento Multisserviços**: Adicione múltiplos procedimentos em uma única reserva com profissionais distintos e horários calculados automaticamente.
* **Ciclo de Status**: `Agendado` ➔ `Confirmado` ➔ `Em Atendimento` ➔ `Concluído (Faturar)` ➔ `Cancelado` / `No-show`.
* **Bloqueio de Horários**: Intervalos de almoço, folgas, cursos e eventos do salão.
* **Validação de Conflitos**: Detecção automática de sobreposições de agenda.

### 3. 💬 Módulo de Automação do WhatsApp (100% Gratuito)
* **Status e Conexão Local**: Interface com QR Code e disparador local.
* **Disparos Automáticos**:
  * Lembrete de agendamento (24h e 2h antes) com dados completos e link de confirmação.
  * Mensagem de boas-vindas no primeiro cadastro.
  * Felicitações e cupons de aniversário automáticos na data festiva.
* **Gerenciador de Modelos**: Edição dinâmica com variáveis `{cliente}`, `{data}`, `{horario}`, `{servicos}`, `{profissional}`, `{endereco}`.

### 4. 👩‍🎨 Equipe, Profissionais & Comissões
* **Cadastro da Equipe**: Especialidades, cor de identificação na grade e horários de trabalho.
* **Cálculo Automático de Comissões**:
  * Porcentagem (%) ou valor fixo (R$) diferenciado por profissional ou por serviço.
* **Relatório de Repasse & Quitação**:
  * Demonstrativo detalhado com total faturado, deduções e valor líquido a repassar.
  * Botão de **Quitação Imediata** com lançamento automático de despesa no financeiro.

### 5. 💰 Gestão Financeira Completa & PDV (Frente de Caixa)
* **Frente de Caixa / PDV**:
  * Abertura com fundo de troco, sangrias (retiradas) e reforços (suprimentos) com justificativa.
  * Fechamento de caixa com conferência física (esperado vs. informado).
  * Checkout rápido com múltiplos meios de pagamento (PIX com QR Code dinâmico, Cartão de Crédito/Débito, Dinheiro com cálculo de troco, Voucher).
* **Contas a Pagar e a Receber**: Controle de despesas fixas (aluguel, água, energia) e variáveis (produtos).
* **Relatórios Gerenciais & DRE**:
  * DRE Simplificado com Receita Bruta, Comissões, Custos e Lucro Líquido Real.
  * Faturamento por Categoria (Cabelo, Manicure, Depilação, Maquiagem).
  * Ranking dos Serviços Mais Lucrativos.

### 6. 🔒 Backup Automático & Google Drive
* **Cópia Local Compactada**: Geração instantânea de backups `.zip` ou `.db` com timestamp.
* **Restauração em 1 Clique**: Carregue um arquivo de backup para restaurar o sistema imediatamente.
* **Google Drive Cloud Sync**: Integração para envio de cópias de segurança para a nuvem.
* **Rotina Cron Agendada**: Backup automático diário às 23:00.

---

## ⚡ Como Iniciar no Windows

### Método 1: Inicialização 1-Clique (Recomendado)
* **Para instalar e configurar em um novo computador**: Dê duplo clique em [`INSTALADOR_BELLAGESTAO.bat`](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoSalao/INSTALADOR_BELLAGESTAO.bat)
* **Para iniciar no dia a dia**: Dê duplo clique no atalho da Área de Trabalho ou em [`INICIAR_SISTEMA.bat`](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoSalao/INICIAR_SISTEMA.bat)
O sistema abrirá automaticamente no seu navegador padrão (`http://localhost:3001`).

---

### Método 2: Modo de Desenvolvimento

1. **Iniciar Backend:**
   ```bash
   cd backend
   npm install
   node server.js
   ```

2. **Iniciar Frontend (Vite):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Acesse em seu navegador: `http://localhost:5173`.

---

## ⌨️ Atalhos de Teclado (Produtividade Rápida)

| Tecla | Ação |
| :--- | :--- |
| **`F1`** | Abrir Guia de Atalhos de Teclado |
| **`F2`** | Abrir Modal de Novo Agendamento Multisserviços |
| **`F3`** | Abrir Frente de Caixa & PDV Balcão |
| **`F4`** | Abrir Cadastro Rápido de Novo Cliente com Anamnese |
| **`ESC`** | Fechar qualquer janela ou modal aberto |

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Vanilla Design Tokens (Dark / Light Mode).
* **Backend**: Node.js, Express, SQLite3 (WAL mode, Foreign Keys ACID), Multer, Archiver, Node-Cron, QRCode.
* **Banco de Dados**: SQLite local autônomo e portátil (`salao.db`).
