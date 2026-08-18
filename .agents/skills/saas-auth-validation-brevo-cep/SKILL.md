---
name: saas-auth-validation-brevo-cep
description: Arquitetura completa e reutilizável de autenticação Multi-Tenant para SaaS Web com cadastro de proprietário, login unificado com e-mail e senha segura, validação oficial de CPF/CNPJ (Módulo 11), busca de endereço automática via CEP (ViaCEP), padrão de segurança de senha forte e verificação de e-mail por código de 6 dígitos via Brevo REST API v3 nativa sem SDKs pesados.
---

# 🚀 Skill: SaaS Multi-Tenant Auth com Validação CPF/CNPJ, ViaCEP e Brevo

Esta skill fornece uma arquitetura enterprise de autenticação, onboarding e cadastro para aplicações **Next.js / Node.js Multi-Tenant SaaS**.

---

## 🎯 Principais Capacidades

1. **🏢 Multi-Tenant Onboarding (Cadastro do Dono/Empresa):**
   - Cria o Tenant (empresa/oficina) automaticamente no plano inicial/gratuito.
   - Cria o Dono como Primeiro Administrador daquela organização.
   - Suporte a múltiplos colaboradores subordinados com controle de perfis (Admin, Gerente, Operador).
2. **👑 Reconhecimento Automático de Super Admin Master:**
   - E-mail do proprietário da plataforma é identificado no login (`isMaster: true`), liberando acesso irrestrito ao painel `/master-admin` e tenant de testes matriz.
3. **🔑 Login Unificado com E-mail e Senha Segura:**
   - Campo de entrada limpo e direto (`E-mail ou Usuário` e `Senha`).
4. **🆔 Validação Oficial de Documentos Brasileiros (Receita Federal):**
   - **CPF:** Cálculo dos 2 dígitos verificadores e rejeição de sequências repetidas.
   - **CNPJ:** Cálculo oficial com **Módulo 11** para os 2 dígitos verificadores e máscaras automáticas.
5. **📍 Preenchimento Automático de Endereço via CEP (ViaCEP):**
   - Ao digitar os 8 dígitos do CEP, busca e preenche em tempo real: Rua, Bairro, Cidade e UF.
6. **🔒 Padrão de Segurança de Senha Forte:**
   - Exige e valida: 8+ caracteres, maiúscula, minúscula, número e caractere especial (`@$!%*?&`).
   - Medidor visual e checklist dinâmico em tempo real no frontend + bloqueio no backend.
7. **📧 Confirmação de E-mail por Código de 6 Dígitos (Brevo REST API v3):**
   - Disparo instantâneo sem SDKs usando a API REST nativa `https://api.brevo.com/v3/smtp/email`.
   - Códigos numéricos com expiração de 15 minutos salvos na tabela `EmailVerification`.
8. **🎯 UX com Alertas no Ponto de Clique & Auto-Scroll:**
   - Mensagens de erro posicionadas imediatamente acima do botão de submissão e no campo com problema, com scroll suave automático até o erro.

---

## 📦 1. Schema Prisma (`prisma/schema.prisma`)

```prisma
model Tenant {
  id                      String                @id @default(cuid())
  name                    String                // Razão Social / Nome da Empresa
  document                String?               // CNPJ ou CPF
  plan                    String                @default("STARTER")
  subscriptionStatus      String                @default("active")
  subscriptionExpiresAt   DateTime?
  maxUsers                Int                   @default(2)
  ownerEmail              String                @unique
  ownerPassword           String?               // Hash PBKDF2/Salt
  ownerName               String
  ownerPhone              String?
  cep                     String?
  street                  String?
  number                  String?
  complement              String?
  neighborhood            String?
  city                    String?
  state                   String?
  isMaster                Boolean               @default(false)
  active                  Boolean               @default(true)
  createdAt               DateTime              @default(now())
  updatedAt               DateTime              @updatedAt

  employees               Employee[]
}

model Employee {
  id             String    @id @default(cuid())
  tenantId       String?
  tenant         Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name           String
  role           String
  accessLevel    String    @default("MECANICO") // ADMIN, GERENTE, ATENDENTE, OPERADOR
  email          String?
  phone          String?
  password       String?
  active         Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model EmailVerification {
  email     String   @id
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## 🛠️ 2. Validações de Documentos e Senha Forte (`src/lib/validation.ts`)

```typescript
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === parseInt(clean.charAt(10));
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14 || /^(\d)\1{13}$/.test(clean)) return false;

  let length = 12, numbers = clean.substring(0, length), digits = clean.substring(length), sum = 0, pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = 13; numbers = clean.substring(0, length); sum = 0; pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

export function validatePasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { isValid: score === 5, score, checks };
}

export function maskDocument(v: string) {
  const c = v.replace(/\D/g, "");
  return c.length <= 11
    ? c.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14)
    : c.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").slice(0, 18);
}

export function maskPhone(v: string) {
  const c = v.replace(/\D/g, "");
  return c.length <= 10
    ? c.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2").slice(0, 14)
    : c.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
}

export function maskCEP(v: string) {
  return v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
}
```

---

## ✉️ 3. Integração Nativa Brevo REST API v3 (`src/lib/email.ts`)

```typescript
import https from "https";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "contato@torquerp.com.br";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Torque ERP";

export async function sendBrevoEmail(payloadData: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}) {
  if (!BREVO_API_KEY) return { success: true, simulated: true };

  const payload = JSON.stringify({
    sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
    to: payloadData.to,
    subject: payloadData.subject,
    htmlContent: payloadData.htmlContent,
  });

  const options = {
    hostname: "api.brevo.com",
    port: 443,
    path: "/v3/smtp/email",
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ success: res.statusCode === 201, raw: data }));
    });
    req.on("error", (e) => resolve({ success: false, error: e.message }));
    req.write(payload);
    req.end();
  });
}
```

---

## 🔐 4. Hash Seguro de Senha & Sessão JWT (`src/lib/auth.ts`)

```typescript
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "TORQUE_SECURE_SECRET_2026";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

export function createSessionToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
```
