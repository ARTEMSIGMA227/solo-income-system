export const HUNTER_CLASSES = ["striker", "healer", "mage", "assassin", "tank"] as const;
export type HunterClassName = (typeof HUNTER_CLASSES)[number];

export interface ClassBonuses {
  xp_multiplier?: number;
  streak_shields_per_week?: number;
  focus_bonus?: number;
  gold_multiplier?: number;
  penalty_reduction?: number;
}

export interface UserClass {
  id: string;
  class_name: HunterClassName;
  selected_at: string;
  class_bonuses: ClassBonuses;
  created_at: string;
  updated_at: string;
}

export interface HunterClassInfo {
  name: HunterClassName;
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  bonusText: string;
  bonuses: ClassBonuses;
}

export const CLASS_INFO: Record<HunterClassName, HunterClassInfo> = {
  striker: {
    name: "striker",
    title: "Striker",
    emoji: "⚔️",
    color: "text-red-400",
    bgColor: "bg-red-600/20",
    borderColor: "border-red-500/30",
    description: "Мастер атаки. Наносит максимальный урон боссам и получает больше опыта.",
    bonusText: "+20% XP за квесты",
    bonuses: { xp_multiplier: 1.2 },
  },
  healer: {
    name: "healer",
    title: "Healer",
    emoji: "💚",
    color: "text-emerald-400",
    bgColor: "bg-emerald-600/20",
    borderColor: "border-emerald-500/30",
    description: "Хранитель жизни. Поддерживает стрик и защищает от потерь.",
    bonusText: "+1 Streak Shield в неделю",
    bonuses: { streak_shields_per_week: 1 },
  },
  mage: {
    name: "mage",
    title: "Mage",
    emoji: "🔮",
    color: "text-blue-400",
    bgColor: "bg-blue-600/20",
    borderColor: "border-blue-500/30",
    description: "Мастер концентрации. Получает бонус за фокус-сессии.",
    bonusText: "+15% бонус фокуса",
    bonuses: { focus_bonus: 0.15 },
  },
  assassin: {
    name: "assassin",
    title: "Assassin",
    emoji: "🗡️",
    color: "text-yellow-400",
    bgColor: "bg-yellow-600/20",
    borderColor: "border-yellow-500/30",
    description: "Тихий охотник. Зарабатывает больше золота в магазине.",
    bonusText: "+25% золота",
    bonuses: { gold_multiplier: 1.25 },
  },
  tank: {
    name: "tank",
    title: "Tank",
    emoji: "🛡️",
    color: "text-sky-400",
    bgColor: "bg-sky-600/20",
    borderColor: "border-sky-500/30",
    description: "Несокрушимый защитник. Снижает штрафы за пропуски.",
    bonusText: "-50% штраф XP",
    bonuses: { penalty_reduction: 0.5 },
  },
};