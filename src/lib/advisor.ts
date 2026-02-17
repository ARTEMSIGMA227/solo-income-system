interface QuestData {
  completed_at: string | null;
  difficulty: string;
  xp_reward: number;
  category: string;
}

interface ProfileData {
  level: number;
  streak: number;
  total_xp: number;
  gold: number;
}

interface BossData {
  defeated: boolean;
  boss_name: string;
}

interface AdviceResult {
  greeting: string;
  tips: string[];
  motivation: string;
  focusArea: string;
}

export function generateAdvice(
  profile: ProfileData | null,
  quests: QuestData[],
  bosses: BossData[]
): AdviceResult {
  const tips: string[] = [];
  let focusArea = "general";

  if (!profile) {
    return {
      greeting: "Добро пожаловать, Охотник!",
      tips: ["Начни с создания первого квеста в разделе Квесты."],
      motivation: "Каждый великий охотник начинал с первого шага.",
      focusArea: "onboarding",
    };
  }

  const level = profile.level;
  const streak = profile.streak;
  const totalXp = profile.total_xp;
  const gold = profile.gold;

  // Streak analysis
  if (streak === 0) {
    tips.push(
      "⚠️ Серия прервана! Выполни хотя бы 1 квест сегодня, чтобы начать новую."
    );
    focusArea = "streak-recovery";
  } else if (streak >= 7) {
    tips.push(
      `🔥 Серия ${streak} дней! Невероятно. Не останавливайся.`
    );
  } else if (streak >= 3) {
    tips.push(
      `🔥 ${streak} дней подряд! До недельной серии осталось ${7 - streak}.`
    );
  }

  // Quest completion analysis
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayQuests = quests.filter(
    (q) => q.completed_at && q.completed_at.startsWith(todayStr)
  );
  const pendingQuests = quests.filter((q) => !q.completed_at);

  if (todayQuests.length === 0 && pendingQuests.length > 0) {
    tips.push(
      `📋 У тебя ${pendingQuests.length} незавершённых квестов. Начни с самого простого.`
    );
    if (focusArea === "general") focusArea = "quests";
  } else if (todayQuests.length >= 5) {
    tips.push("💪 Уже 5+ квестов сегодня! Ты в ударе.");
  }

  // Difficulty analysis
  const hardQuests = quests.filter(
    (q) => q.difficulty === "S" || q.difficulty === "A"
  );
  const easyQuests = quests.filter(
    (q) => q.difficulty === "E" || q.difficulty === "D"
  );

  if (hardQuests.length === 0 && quests.length > 5) {
    tips.push(
      "🎯 Попробуй квесты ранга A или S — больше XP и быстрее рост."
    );
  } else if (easyQuests.length === 0 && quests.length > 3) {
    tips.push(
      "💡 Добавь пару лёгких квестов (D/E) для поддержания streak в тяжёлые дни."
    );
  }

  // Boss analysis
  const defeatedBosses = bosses.filter((b) => b.defeated);
  const activeBosses = bosses.filter((b) => !b.defeated);

  if (activeBosses.length > 0) {
    tips.push(
      `💀 Босс "${activeBosses[0].boss_name}" ждёт! Выполняй квесты, чтобы нанести урон.`
    );
    if (focusArea === "general") focusArea = "boss";
  }

  if (defeatedBosses.length > 0 && activeBosses.length === 0) {
    tips.push(
      "🏆 Все боссы побеждены! Жди нового испытания."
    );
  }

  // Gold analysis
  if (gold >= 500) {
    tips.push(
      `💰 У тебя ${gold} золота. Загляни в магазин — можешь себя наградить.`
    );
  }

  // Level-based advice
  if (level <= 5) {
    tips.push(
      "📈 Фокусируйся на ежедневных квестах — стабильность важнее скорости."
    );
  } else if (level <= 15) {
    tips.push(
      "📊 Проверь аналитику — найди свои лучшие дни и оптимизируй расписание."
    );
  } else {
    tips.push(
      "👑 Высокий уровень! Ставь амбициозные цели и бери S-ранг квесты."
    );
  }

  // Category diversity
  const categories = new Set(quests.map((q) => q.category));
  if (categories.size === 1 && quests.length > 5) {
    tips.push(
      "🔄 Все квесты в одной категории. Попробуй разнообразить — это ускорит рост."
    );
  }

  // Limit tips
  const finalTips = tips.slice(0, 5);

  // Motivation quotes
  const motivations = [
    "Я — охотник, который превращает хаос в систему.",
    "Каждый квест — это шаг к вершине.",
    "Слабые сдаются. Ты — нет.",
    "Система не даёт выходных. И ты не должен.",
    "Level up — это не конец. Это новое начало.",
    "Даже S-ранг охотники начинали с E-квестов.",
    "Боль временна. Ранг — навсегда.",
    "Не жди мотивации. Создавай её действиями.",
  ];

  const greeting = getGreeting(profile);

  return {
    greeting,
    tips: finalTips,
    motivation:
      motivations[Math.floor(Math.random() * motivations.length)],
    focusArea,
  };
}

function getGreeting(profile: ProfileData): string {
  const hour = new Date().getHours();
  const levelTitle = getLevelTitle(profile.level);

  if (hour < 6) return `🌙 Ночной рейд, ${levelTitle}?`;
  if (hour < 12) return `☀️ Доброе утро, ${levelTitle}!`;
  if (hour < 18) return `⚡ Продолжай, ${levelTitle}!`;
  return `🌆 Вечерний гринд, ${levelTitle}!`;
}

function getLevelTitle(level: number): string {
  if (level >= 50) return "Монарх";
  if (level >= 40) return "Национальный охотник";
  if (level >= 30) return "S-ранг охотник";
  if (level >= 20) return "A-ранг охотник";
  if (level >= 15) return "B-ранг охотник";
  if (level >= 10) return "C-ранг охотник";
  if (level >= 5) return "D-ранг охотник";
  return "E-ранг охотник";
}