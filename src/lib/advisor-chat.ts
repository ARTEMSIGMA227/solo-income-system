import type { TranslationDictionary } from "./i18n/types";

type AnyRow = Record<string, any>;

interface ChatContext {
  stats: AnyRow;
  profile: AnyRow;
  todayActions: number;
  todayIncome: number;
  monthIncome: number;
  t: TranslationDictionary;
  locale: string;
}

interface ChatResponse {
  text: string;
  tips: string[];
}

const TOPICS_EN: Record<string, string[]> = {
  income: ["income", "money", "earn", "salary", "revenue", "profit", "cash", "payment", "dollar", "sell", "sales"],
  motivation: ["motivat", "tired", "lazy", "burnout", "give up", "quit", "bored", "exhausted", "energy", "cant", "hard", "difficult", "struggle"],
  strategy: ["strategy", "plan", "how to", "advice", "what should", "recommend", "suggest", "tip", "help me", "guide", "approach"],
  skills: ["skill", "learn", "study", "improve", "develop", "growth", "knowledge", "course", "practice", "training"],
  productivity: ["productiv", "focus", "time", "efficient", "routine", "habit", "schedule", "discipline", "procrastinat", "distract"],
  goals: ["goal", "target", "milestone", "achieve", "progress", "track", "reach", "objective", "dream", "ambition"],
  streak: ["streak", "consistency", "daily", "miss", "skip", "day off", "break", "continuous"],
  xp: ["xp", "level", "rank", "experience", "upgrade", "points", "boss", "quest"],
};

const TOPICS_RU: Record<string, string[]> = {
  income: ["доход", "деньг", "заработ", "зарплат", "выручк", "прибыл", "оплат", "продаж", "клиент"],
  motivation: ["мотивац", "устал", "лень", "выгоран", "сдать", "бросить", "скучно", "сложно", "трудно", "тяжело", "энерги", "не могу"],
  strategy: ["стратег", "план", "как ", "совет", "что делать", "рекоменд", "подсказ", "помог", "способ"],
  skills: ["навык", "учить", "изуч", "улучш", "развит", "знани", "курс", "практик", "обучен"],
  productivity: ["продуктивн", "фокус", "время", "эффектив", "рутин", "привычк", "расписан", "дисциплин", "прокрастин", "отвлек"],
  goals: ["цель", "цели", "задач", "достиж", "прогресс", "результат", "мечт", "амбици"],
  streak: ["стрик", "серия", "подряд", "пропуск", "ежедневн", "непрерывн", "выходн"],
  xp: ["хп", "опыт", "уровен", "ранг", "очки", "босс", "квест", "левел"],
};

function detectTopic(message: string, locale: string): string {
  const lower = message.toLowerCase();
  const topics = locale === "ru" ? TOPICS_RU : TOPICS_EN;

  let bestTopic = "general";
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(topics)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

export function generateChatResponse(message: string, ctx: ChatContext): ChatResponse {
  const { stats, profile, todayActions, todayIncome, monthIncome, locale } = ctx;
  const topic = detectTopic(message, locale);

  const level = Number(stats.level ?? 1);
  const gold = Number(stats.gold ?? 0);
  const totalActions = Number(stats.total_actions ?? 0);
  const totalIncome = Number(stats.total_income ?? 0);
  const totalSales = Number(stats.total_sales ?? 0);
  const streak = Number(profile.streak_current ?? 0);
  const bestStreak = Number(profile.streak_best ?? 0);
  const target = Number(profile.daily_actions_target ?? 30);
  const monthTarget = Number(profile.monthly_income_target ?? 150000);
  const consecutiveMisses = Number(profile.consecutive_misses ?? 0);
  const actionsPercent = target > 0 ? Math.round((todayActions / target) * 100) : 0;
  const monthPercent = monthTarget > 0 ? Math.round((monthIncome / monthTarget) * 100) : 0;

  const isRu = locale === "ru";

  switch (topic) {
    case "income": {
      const tips: string[] = [];
      if (isRu) {
        tips.push(todayIncome > 0
          ? `Сегодня вы заработали ${fmtNum(todayIncome)}. Отличное начало!`
          : "Сегодня пока нет дохода. Сфокусируйтесь на действиях, приносящих деньги.");
        tips.push(`Месячный прогресс: ${monthPercent}% от цели (${fmtNum(monthIncome)} / ${fmtNum(monthTarget)})`);
        if (totalSales > 0 && totalActions > 0) {
          const conv = ((totalSales / totalActions) * 100).toFixed(1);
          tips.push(`Ваша конверсия: ${conv}%. ${Number(conv) < 5 ? "Попробуйте улучшить скрипты продаж." : "Хороший показатель!"}`);
        }
        tips.push("Совет: выделите 2-3 ключевых действия, которые напрямую приносят доход, и делайте их в первую очередь.");
        return { text: "Давайте разберём вашу финансовую ситуацию:", tips };
      } else {
        tips.push(todayIncome > 0
          ? `You earned ${fmtNum(todayIncome)} today. Great start!`
          : "No income today yet. Focus on revenue-generating actions.");
        tips.push(`Monthly progress: ${monthPercent}% of target (${fmtNum(monthIncome)} / ${fmtNum(monthTarget)})`);
        if (totalSales > 0 && totalActions > 0) {
          const conv = ((totalSales / totalActions) * 100).toFixed(1);
          tips.push(`Your conversion rate: ${conv}%. ${Number(conv) < 5 ? "Try improving your sales scripts." : "Good performance!"}`);
        }
        tips.push("Tip: identify 2-3 key actions that directly generate income and prioritize them.");
        return { text: "Let me analyze your financial situation:", tips };
      }
    }

    case "motivation": {
      const tips: string[] = [];
      if (isRu) {
        if (consecutiveMisses >= 2) {
          tips.push(`Я вижу, что вы пропустили ${consecutiveMisses} дней. Это нормально — все проходят через спады.`);
          tips.push("Начните с малого: сделайте хотя бы 3-5 действий сегодня. Маленькая победа запустит цепную реакцию.");
        } else {
          tips.push(streak > 0 ? `У вас серия ${streak} дней! Не ломайте её — каждый день считается.` : "Начните новую серию сегодня. Первый день — самый важный.");
        }
        tips.push(`Ваш уровень: ${level}. Каждое действие приближает вас к следующему рангу.`);
        tips.push("Правило 2 минут: если задача кажется тяжёлой, начните делать её хотя бы 2 минуты.");
        tips.push("Помните: мотивация приходит ПОСЛЕ начала действий, а не до.");
        return { text: "Понимаю, бывает тяжело. Вот что поможет:", tips };
      } else {
        if (consecutiveMisses >= 2) {
          tips.push(`I see you missed ${consecutiveMisses} days. That is normal — everyone goes through slumps.`);
          tips.push("Start small: do at least 3-5 actions today. A small win triggers a chain reaction.");
        } else {
          tips.push(streak > 0 ? `You have a ${streak}-day streak! Do not break it — every day counts.` : "Start a new streak today. Day one is the most important.");
        }
        tips.push(`Your level: ${level}. Every action brings you closer to the next rank.`);
        tips.push("2-minute rule: if a task feels hard, commit to doing it for just 2 minutes.");
        tips.push("Remember: motivation comes AFTER you start, not before.");
        return { text: "I understand it can be tough. Here is what will help:", tips };
      }
    }

    case "strategy": {
      const tips: string[] = [];
      if (isRu) {
        tips.push(`При вашем уровне (${level}) и ${totalActions} действиях, ${totalSales > 0 ? `конверсия ${((totalSales / totalActions) * 100).toFixed(1)}%` : "пока нет продаж — фокус на увеличение объёма действий"}.`);
        tips.push("Стратегия 3-3-3: 3 часа на главную задачу, 3 коротких задачи, 3 задачи на обслуживание.");
        tips.push(level < 10
          ? "На вашем этапе главное — количество действий. Делайте больше, анализируйте потом."
          : "На вашем уровне пора оптимизировать. Анализируйте что работает и удваивайте это.");
        tips.push(monthPercent < 50
          ? `До цели ${100 - monthPercent}%. Увеличьте ежедневную активность на 20%.`
          : `Вы на ${monthPercent}% от цели. Сохраняйте темп!`);
        return { text: "Вот стратегические рекомендации для вас:", tips };
      } else {
        tips.push(`At level ${level} with ${totalActions} actions, ${totalSales > 0 ? `conversion ${((totalSales / totalActions) * 100).toFixed(1)}%` : "no sales yet — focus on increasing action volume"}.`);
        tips.push("3-3-3 Strategy: 3 hours on main task, 3 short tasks, 3 maintenance tasks.");
        tips.push(level < 10
          ? "At your stage, volume is key. Do more, analyze later."
          : "At your level, it is time to optimize. Analyze what works and double down.");
        tips.push(monthPercent < 50
          ? `${100 - monthPercent}% to goal. Increase daily activity by 20%.`
          : `You are at ${monthPercent}% of goal. Keep the pace!`);
        return { text: "Here are strategic recommendations for you:", tips };
      }
    }

    case "skills": {
      const tips: string[] = [];
      if (isRu) {
        tips.push("Фокусируйтесь на 1-2 навыках одновременно. Распыление снижает прогресс.");
        tips.push("Метод Фейнмана: изучите тему, объясните простыми словами, найдите пробелы, повторите.");
        tips.push("Ежедневная практика 30 минут > редкие марафоны по 5 часов.");
        tips.push("Создавайте цели для навыков в разделе Skills — это помогает отслеживать прогресс.");
        return { text: "Развитие навыков — ключ к росту дохода:", tips };
      } else {
        tips.push("Focus on 1-2 skills at a time. Spreading thin reduces progress.");
        tips.push("Feynman Method: study a topic, explain it simply, find gaps, repeat.");
        tips.push("Daily 30-minute practice > rare 5-hour marathons.");
        tips.push("Create goals for skills in the Skills section to track your progress.");
        return { text: "Skill development is key to income growth:", tips };
      }
    }

    case "productivity": {
      const tips: string[] = [];
      if (isRu) {
        tips.push(`Сегодня: ${todayActions}/${target} действий (${actionsPercent}%). ${actionsPercent >= 100 ? "План выполнен!" : actionsPercent >= 70 ? "Почти готово!" : "Давайте ускоримся!"}`);
        tips.push("Техника Pomodoro: 25 мин работы + 5 мин отдыха. Используйте раздел Focus!");
        tips.push("Уберите уведомления телефона на время работы. Каждое отвлечение стоит 23 минуты.");
        tips.push("Ешьте лягушку: начинайте день с самой неприятной/важной задачи.");
        return { text: "Советы по продуктивности:", tips };
      } else {
        tips.push(`Today: ${todayActions}/${target} actions (${actionsPercent}%). ${actionsPercent >= 100 ? "Plan complete!" : actionsPercent >= 70 ? "Almost there!" : "Let us pick up the pace!"}`);
        tips.push("Pomodoro Technique: 25 min work + 5 min rest. Use the Focus section!");
        tips.push("Silence phone notifications during work. Each distraction costs 23 minutes.");
        tips.push("Eat the frog: start your day with the most unpleasant/important task.");
        return { text: "Productivity tips:", tips };
      }
    }

    case "goals": {
      const tips: string[] = [];
      if (isRu) {
        tips.push(`Месячная цель: ${monthPercent}% выполнено (${fmtNum(monthIncome)} / ${fmtNum(monthTarget)}).`);
        tips.push("SMART цели: Specific, Measurable, Achievable, Relevant, Time-bound.");
        tips.push("Разбивайте большие цели на мини-этапы. Прогресс мотивирует.");
        tips.push("Записывайте цели в разделе Skills — вложенные подцели помогают декомпозировать.");
        return { text: "Давайте поработаем над целями:", tips };
      } else {
        tips.push(`Monthly goal: ${monthPercent}% complete (${fmtNum(monthIncome)} / ${fmtNum(monthTarget)}).`);
        tips.push("SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound.");
        tips.push("Break big goals into milestones. Progress motivates.");
        tips.push("Use the Skills section to set goals — nested sub-goals help decompose.");
        return { text: "Let us work on your goals:", tips };
      }
    }

    case "streak": {
      const tips: string[] = [];
      if (isRu) {
        tips.push(streak > 0
          ? `Текущая серия: ${streak} дней. Рекорд: ${bestStreak} дней. ${streak >= bestStreak ? "Вы на рекорде!" : `До рекорда: ${bestStreak - streak} дней.`}`
          : `Серия прервана. Лучший рекорд: ${bestStreak}. Начните новую серию сегодня!`);
        tips.push("Серии — показатель дисциплины. Даже 1 действие в день сохраняет серию.");
        tips.push("Streak 7 дней = лутбокс! 30 дней = редкий лутбокс!");
        return { text: "О вашей серии:", tips };
      } else {
        tips.push(streak > 0
          ? `Current streak: ${streak} days. Best: ${bestStreak} days. ${streak >= bestStreak ? "You are at your record!" : `${bestStreak - streak} days to beat it.`}`
          : `Streak broken. Best record: ${bestStreak}. Start a new one today!`);
        tips.push("Streaks show discipline. Even 1 action per day keeps it alive.");
        tips.push("7-day streak = lootbox! 30-day streak = rare lootbox!");
        return { text: "About your streak:", tips };
      }
    }

    case "xp": {
      const tips: string[] = [];
      if (isRu) {
        tips.push(`Уровень ${level} | ${fmtNum(Number(stats.total_xp_earned ?? 0))} XP | ${gold} Gold`);
        tips.push("Способы получить XP: квесты, фокус-блоки, убийство боссов, серии.");
        tips.push("Лутбоксы падают за: новый уровень, квест, босса, серии 7/30/100 дней.");
        tips.push(level < 20
          ? "Совет: выполняйте обязательные квесты каждый день для максимума XP."
          : "На вашем уровне боссы дают лучшее соотношение XP к усилию.");
        return { text: "Ваш прогресс:", tips };
      } else {
        tips.push(`Level ${level} | ${fmtNum(Number(stats.total_xp_earned ?? 0))} XP | ${gold} Gold`);
        tips.push("Ways to earn XP: quests, focus blocks, defeating bosses, streaks.");
        tips.push("Lootboxes drop from: level up, quest, boss, 7/30/100 day streaks.");
        tips.push(level < 20
          ? "Tip: complete mandatory quests daily for maximum XP."
          : "At your level, bosses give the best XP-to-effort ratio.");
        return { text: "Your progress:", tips };
      }
    }

    default: {
      const tips: string[] = [];
      if (isRu) {
        tips.push(`Уровень ${level} | Серия: ${streak} дн. | Действий сегодня: ${todayActions}/${target}`);
        tips.push(actionsPercent < 50
          ? "Фокусируйтесь на выполнении дневного плана действий."
          : actionsPercent >= 100
            ? "Дневной план выполнен! Можете взяться за бонусные задачи."
            : "Хороший прогресс! Продолжайте в том же духе.");
        tips.push("Спросите меня про: доход, мотивацию, стратегию, навыки, продуктивность, цели, серии, XP");
        return { text: "Вот ваша текущая ситуация:", tips };
      } else {
        tips.push(`Level ${level} | Streak: ${streak}d | Actions today: ${todayActions}/${target}`);
        tips.push(actionsPercent < 50
          ? "Focus on completing your daily action plan."
          : actionsPercent >= 100
            ? "Daily plan complete! Consider bonus tasks."
            : "Good progress! Keep it up.");
        tips.push("Ask me about: income, motivation, strategy, skills, productivity, goals, streaks, XP");
        return { text: "Here is your current situation:", tips };
      }
    }
  }
}

function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}