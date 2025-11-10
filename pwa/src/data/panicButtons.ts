import { EmergencyForm } from "../types/emergency.types";

export interface PanicButtonData {
  /** O texto curto que aparece no botão. */
  label: string;
  /** Um emoji para ilustrar o botão. */
  icon: string;
  /** O nível de urgência pré-definido para este cenário. */
  urgencia: EmergencyForm["nivel_urgencia"];
  /** O relatório detalhado que será enviado para a IA analisar. */
  relatorio: string;
}

/**
 * Banco de dados central para os Botões de Pânico.
 * O campo 'relatorio' é escrito como se o tutor estivesse digitando,
 * para dar à IA o máximo de contexto possível.
 */
export const PANIC_BUTTONS: PanicButtonData[] = [
  {
    label: "Atropelamento",
    icon: "🚗",
    urgencia: "critica",
    relatorio: "Vítima de atropelamento por veículo. Animal em decúbito lateral (deitado de lado), incapaz de se levantar. Apresenta dor aguda ao toque, ferimento visível no membro posterior e respiração curta e rápida (taquipneia). Suspeita de fraturas múltiplas e hemorragia interna.",
  },
  {
    label: "Intoxicação (Química)",
    icon: "🧪",
    urgencia: "critica",
    relatorio: "Ingestão suspeita de produto químico (veneno de rato ou produto de limpeza). Apresenta vômitos incoercíveis, tremores musculares severos, mucosas pálidas e salivação excessiva (sialorreia). Animal desorientado. Necessidade de atendimento imediato.",
  },
  {
    label: "Intoxicação (Comida)",
    icon: "🍫",
    urgencia: "alta",
    relatorio: "Ingestão acidental de alta dose de chocolate (ou uvas). Animal apresenta hiperexcitabilidade, taquicardia, vômito e diarreia. Preocupação com toxicidade.",
  },
  {
    label: "Dificuldade de Respirar",
    icon: "😮‍💨",
    urgencia: "critica",
    relatorio: "Quadro agudo de dificuldade respiratória. Animal apresenta mucosas azuladas (cianose), esforço respiratório visível (dispneia) e sons respiratórios altos. Animal em pânico. Suspeita de obstrução de vias aéreas ou reação anafilática.",
  },
  {
    label: "Convulsão",
    icon: "⚡",
    urgencia: "alta",
    relatorio: "Animal apresentando episódio convulsivo. Movimentos tónico-clónicos (debate-se), salivação intensa e perda de consciência. O episódio dura mais de um minuto. Primeiro episódio observado.",
  },
  {
    label: "Sangramento Intenso",
    icon: "🩸",
    urgencia: "critica",
    relatorio: "Laceração profunda (suspeita de corte por vidro) com sangramento ativo (hemorragia arterial/venosa) no membro. A pressão local não está a conseguir estancar o sangue. Animal demonstra sinais de fraqueza e palidez.",
  },
  {
    label: "Vômito/Diarreia Grave",
    icon: "🤢",
    urgencia: "media",
    relatorio: "Episódios múltiplos de vômito e diarreia persistentes nas últimas 12 horas. Animal prostrado, apático e apresenta sinais de desidratação (olhos fundos, gengivas secas). Recusa ingestão de água.",
  },
  {
    label: "Reação Alérgica (Picada)",
    icon: "🐝",
    urgencia: "alta",
    relatorio: "Início súbito de edema facial (inchaço no focinho e ao redor dos olhos) após possível picada de inseto. Animal apresenta prurido intenso (coceira) e início de dificuldade respiratória.",
  },
  {
    label: "Não consegue urinar",
    icon: "💧",
    urgencia: "critica",
    relatorio: "Gato macho apresentando comportamento de micção frequente sem sucesso (disúria/estrangúria). Visitas repetidas à caixa de areia, vocalização de dor e eliminação de apenas gotas de urina. Abdómen sensível. Suspeita de obstrução uretral.",
  },
  {
    label: "Dificuldade no Parto",
    icon: "🤰",
    urgencia: "alta",
    relatorio: "Fêmea (gata) em trabalho de parto. Apresenta contrações abdominais fortes e visíveis por mais de uma hora sem expulsão do filhote. Animal demonstra exaustão e dor intensa. Suspeita de distocia (parto difícil).",
  },
  {
    label: "Briga com outro animal",
    icon: "🐾",
    urgencia: "alta",
    relatorio: "Animal envolvido em briga com outro animal. Apresenta múltiplas lacerações por mordida, sangramento ativo em alguns pontos e claudicação (mancar) evidente. Um dos ferimentos parece profundo.",
  },
  {
    label: "Fraqueza / Não levanta",
    icon: "😵",
    urgencia: "alta",
    relatorio: "Animal idoso apresentou fraqueza súbita e incapacidade de se levantar (paraparesia/tetraparesia), principalmente nos membros posteriores. Está consciente e alerta, mas não consegue ficar de pé. Apresenta anorexia e recusa água.",
  },
];