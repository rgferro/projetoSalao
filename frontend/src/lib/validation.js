export function validateCPF(cpf) {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, '');
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

export function validateCNPJ(cnpj) {
  if (!cnpj) return false;
  const clean = cnpj.replace(/\D/g, '');
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

export function validatePasswordStrength(password) {
  if (!password) return { isValid: false, score: 0, checks: {} };
  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { isValid: password.length >= 6, score, checks };
}

export function maskDocument(v) {
  if (!v) return '';
  const c = v.replace(/\D/g, '');
  return c.length <= 11
    ? c.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)
    : c.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
}

export function maskPhone(v) {
  if (!v) return '';
  const c = v.replace(/\D/g, '');
  return c.length <= 10
    ? c.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14)
    : c.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
}

export function maskCEP(v) {
  if (!v) return '';
  return v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

export async function fetchViaCEP(cep) {
  const clean = (cep || '').replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch (e) {
    return null;
  }
}
