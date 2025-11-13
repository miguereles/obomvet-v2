// 1. Interface para o medidor de força
export interface PasswordStrength {
  score: number; // 0 a 4
  label: string;
  color: string;
  width: string;
}

/**
 * Verifica a força de uma senha.
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "", color: "bg-gray-200", width: "0%" };
  }

  // Regra 1: Comprimento
  if (password.length < 8) {
    return { score: 0, label: "Fraca (mín. 8 caracteres)", color: "bg-red-500", width: "10%" };
  }

  // Regra 2: Tipos de caracteres
  let score = 0;
  if (/[a-z]/.test(password)) score++; // minúsculas
  if (/[A-Z]/.test(password)) score++; // maiúsculas
  if (/[0-9]/.test(password)) score++; // números
  if (/[^A-Za-z0-9]/.test(password)) score++; // símbolos

  switch (score) {
    case 1:
      // Tem 8+ caracteres, mas só um tipo (ex: "aaaaaaaa" ou "12345678")
      return { score: 1, label: "Fraca", color: "bg-red-500", width: "25%" };
    case 2:
      // Tem 8+ caracteres e dois tipos (ex: "senha123" ou "SenhaBoa")
      return { score: 2, label: "Média", color: "bg-yellow-500", width: "50%" };
    case 3:
      // Tem 8+ caracteres e três tipos (ex: "Senha123")
      return { score: 3, label: "Forte", color: "bg-green-500", width: "75%" };
    case 4:
      // Tem 8+ caracteres e todos os tipos (ex: "Senha@123")
      return { score: 4, label: "Muito Forte", color: "bg-green-700", width: "100%" };
    default:
      // Fallback
      return { score: 1, label: "Fraca", color: "bg-red-500", width: "25%" };
  }
}


/**
 * Valida um CPF.
 * (Sua função original, agora exportada)
 */
export function isValidCPF(cpf: string) {
  if (typeof cpf !== 'string') return false;
  
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');

  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Calcula dígitos verificadores
  let sum = 0;
  let remainder;

  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}