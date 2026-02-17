interface AdviceOutput {
  greeting: string;
  advice: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts any stats/profile shape
type AnyRow = Record<string, any>;

interface AdviceInput {
  stats: AnyRow;
  profile: AnyRow;
  todayActions: number;
  todayIncome: number;
  monthIncome: number;
  hour: number;
  dayOfWeek: number;
  dayOfMonth: number;
  daysInMonth: number;
}

export function generateAdvice(input: AdviceInput): AdviceOutput {
  const {
    stats,
    profile,
    todayActions,
    todayIncome,
    monthIncome,
    hour,
    dayOfWeek,
    dayOfMonth,
    daysInMonth,
  } = input;

  const level = Number(stats.level ?? 1);
  const gold = Number(stats.gold ?? 0);
  const totalActions = Number(stats.total_actions ?? 0);
  const totalSales = Number(stats.total_sales ?? 0);

  const streak = Number(profile.streak_current ?? 0);
  const bestStreak = Number(profile.streak_best ?? 0);
  const target = Number(profile.daily_actions_target ?? 30);
  const monthTarget = Number(profile.monthly_income_target ?? 150000);
  const consecutiveMisses = Number(profile.consecutive_misses ?? 0);

  const advice: string[] = [];

  // --- Greeting ---
  const title = getLevelTitle(level);
  const displayName = profile.display_name
    ? String(profile.display_name)
    : title;
  let greeting: string;

  if (hour < 6) greeting = `🌙 Ночной рейд, ${displayName}?`;
  else if (hour < 12) greeting = `☀️ Доброе утро, ${displayName}!`;
  else if (hour < 18) greeting = `⚡ Продолжай, ${displayName}!`;
  else greeting = `🌆 Вечерний гринд, ${displayName}!`;

  // --- Actions progress ---
  const actionsPercent = Math.round((todayActions / target) * 100);

  if (todayActions === 0 && hour >= 10) {
    advice.push(
      "📋 Ни одного действия сегодня. Начни с малого — один звонок."
    );
  } else if (actionsPercent < 30 && hour >= 14) {
    advice.push(
      `⚠️ Только ${todayActions}/${target} действий. До вечера осталось мало времени!`
    );
  } else if (actionsPercent >= 100) {
    advice.push("✅ Дневной план выполнен! Каждое действие сверху — бонус.");
  } else if (actionsPercent >= 70) {
    advice.push(
      `💪 ${todayActions}/${target} — почти готово! Осталось ${target - todayActions}.`
    );
  }

  // --- Streak ---
  if (streak === 0 && consecutiveMisses > 0) {
    advice.push(
      `⚠️ Серия прервана (пропусков подряд: ${consecutiveMisses}). Восстанови streak сегодня!`
    );
  } else if (streak >= 7 && streak === bestStreak) {
    advice.push(
      `🔥 Streak ${streak} дней — личный рекорд! Не останавливайся.`
    );
  } else if (streak >= 3) {
    advice.push(
      `🔥 ${streak} дней подряд! До рекорда (${bestStreak}) осталось ${Math.max(bestStreak - streak, 0)}.`
    );
  }

  if (consecutiveMisses >= 2) {
    advice.push(
      `💀 ${consecutiveMisses} пропуска подряд. Ещё один — потеря уровня!`
    );
  }

  // --- Income ---
  const monthRemaining = daysInMonth - dayOfMonth;
  const monthPercent = Math.round((monthIncome / monthTarget) * 100);

  if (todayIncome > 0) {
    advice.push(
      `💰 Сегодня уже +${formatNum(todayIncome)}₽. Отличный день!`
    );
  }

  if (monthPercent >= 100) {
    advice.push("🏆 Месячный план выполнен! Ставь новый рекорд.");
  } else if (monthPercent < 50 && dayOfMonth > daysInMonth * 0.6) {
    const needed = monthTarget - monthIncome;
    const perDay =
      monthRemaining > 0 ? Math.ceil(needed / monthRemaining) : needed;
    advice.push(
      `📊 ${monthPercent}% плана. Нужно ~${formatNum(perDay)}₽/день до конца месяца.`
    );
  } else if (monthPercent >= 70) {
    advice.push(
      `📈 ${monthPercent}% месячного плана! Осталось ${formatNum(monthTarget - monthIncome)}₽.`
    );
  }

  // --- Day of week ---
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    advice.push(
      "🗓️ Выходной — идеальное время для подготовки и планирования."
    );
  } else if (dayOfWeek === 1) {
    advice.push("🚀 Понедельник — задай темп на всю неделю!");
  } else if (dayOfWeek === 5) {
    advice.push(
      "📅 Пятница — закрой все открытые задачи перед выходными."
    );
  }

  // --- Level-based ---
  if (level <= 5 && totalActions < 50) {
    advice.push(
      "📈 Фокус на стабильность: делай хотя бы минимум каждый день."
    );
  } else if (level >= 20) {
    advice.push("👑 Высокий ранг. Бери S-квесты и сложные задачи.");
  }

  // --- Gold ---
  if (gold >= 500) {
    advice.push(`💰 ${gold} золота. Загляни в магазин — награди себя.`);
  }

  // --- Conversion rate ---
  if (totalActions > 100 && totalSales > 0) {
    const convRate = ((totalSales / totalActions) * 100).toFixed(1);
    advice.push(
      `📊 Конверсия: ${convRate}% (${totalSales} продаж / ${totalActions} действий).`
    );
  } else if (totalActions > 50 && totalSales === 0) {
    advice.push(
      "🎯 Много действий, но продаж нет. Проанализируй подход."
    );
  }

  // --- Time pressure ---
  if (hour >= 21 && actionsPercent < 100) {
    advice.push(
      `🔴 Уже ${hour}:00 — осталось ${target - todayActions} действий до плана!`
    );
  }

  return {
    greeting,
    advice: advice.slice(0, 4),
  };
}

function getLevelTitle(level: number): string {
  if (level >= 50) return "Монарх";
  if (level >= 40) return "Национальный охотник";
  if (level >= 30) return "S-ранг";
  if (level >= 20) return "A-ранг";
  if (level >= 15) return "B-ранг";
  if (level >= 10) return "C-ранг";
  if (level >= 5) return "D-ранг";
  return "E-ранг";
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}