export type MBTIGroup = 'Analysts' | 'Diplomats' | 'Sentinels' | 'Explorers';

export interface MBTIType {
  id: string;
  name: string;
  chineseName: string;
  group: MBTIGroup;
  color: string;
  description: string;
}

export const MBTI_TYPES: MBTIType[] = [
  // Analysts
  { id: 'INTJ', name: 'Architect', chineseName: '建筑师', group: 'Analysts', color: '#6b4c9a', description: '富有想象力和战略性的思想家，一切皆在计划之中。' },
  { id: 'INTP', name: 'Logician', chineseName: '逻辑学家', group: 'Analysts', color: '#6b4c9a', description: '具有创造力的发明家，对知识有着止步不前的渴望。' },
  { id: 'ENTJ', name: 'Commander', chineseName: '指挥官', group: 'Analysts', color: '#6b4c9a', description: '大胆、富有想象力且意志强大的领导者，总能找到或创造出路。' },
  { id: 'ENTP', name: 'Debater', chineseName: '辩论家', group: 'Analysts', color: '#6b4c9a', description: '聪明且好奇的思想家，无法抗拒智力上的挑战。' },
  
  // Diplomats
  { id: 'INFJ', name: 'Advocate', chineseName: '提倡者', group: 'Diplomats', color: '#33a474', description: '安静而神秘，同时也是鼓舞人心且不知疲倦的理想主义者。' },
  { id: 'INFP', name: 'Mediator', chineseName: '调解员', group: 'Diplomats', color: '#33a474', description: '诗意、善良且利他的人，总是渴望帮助正义的事业。' },
  { id: 'ENFJ', name: 'Protagonist', chineseName: '主人公', group: 'Diplomats', color: '#33a474', description: '富有魅力且鼓舞人心的领导者，能够让听众着迷。' },
  { id: 'ENFP', name: 'Campaigner', chineseName: '竞选者', group: 'Diplomats', color: '#33a474', description: '热情、创造力强且爱交际的自由灵魂，总能找到理由微笑。' },

  // Sentinels
  { id: 'ISTJ', name: 'Logistician', chineseName: '物流师', group: 'Sentinels', color: '#4298b4', description: '务实且注重事实的人，其可靠性不容置疑。' },
  { id: 'ISFJ', name: 'Defender', chineseName: '守卫者', group: 'Sentinels', color: '#4298b4', description: '非常专注且温暖的守护者，时刻准备保护其爱的人。' },
  { id: 'ESTJ', name: 'Executive', chineseName: '总经理', group: 'Sentinels', color: '#4298b4', description: '出色的管理者，在管理事务或人方面无与伦比。' },
  { id: 'ESFJ', name: 'Consul', chineseName: '执政官', group: 'Sentinels', color: '#4298b4', description: '极度关怀、社交性强且受欢迎的人，总是渴望提供帮助。' },

  // Explorers
  { id: 'ISTP', name: 'Virtuoso', chineseName: '鉴赏家', group: 'Explorers', color: '#e4a42c', description: '大胆且实际的实验家，擅长使用各类工具。' },
  { id: 'ISFP', name: 'Adventurer', chineseName: '探险家', group: 'Explorers', color: '#e4a42c', description: '灵活且富有魅力的艺术家，时刻准备探索和体验新鲜事物。' },
  { id: 'ESTP', name: 'Entrepreneur', chineseName: '企业家', group: 'Explorers', color: '#e4a42c', description: '聪明、精力充沛且感知力极强的人，真心享受生活在边缘。' },
  { id: 'ESFP', name: 'Entertainer', chineseName: '表演者', group: 'Explorers', color: '#e4a42c', description: '自发、精力充沛且热情的表演者——生活在他们周围永不枯燥。' },
];
