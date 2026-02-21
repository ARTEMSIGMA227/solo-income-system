export type Locale = 'en' | 'ru';

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    back: string;
    confirm: string;
    error: string;
    success: string;
    yes: string;
    no: string;
    close: string;
    hunter: string;
    actions: string;
    today: string;
    month: string;
    streak: string;
    level: string;
    gold: string;
    xp: string;
    income: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    quests: string;
    skills: string;
    focus: string;
    map: string;
    shop: string;
    bosses: string;
    guilds: string;
    achievements: string;
    analytics: string;
    settings: string;
    more: string;
    menu: string;
    openMenu: string;
    closeMenu: string;
  };

  // Dashboard
  dashboard: {
    loading: string;
    dayStatus: {
      inProgress: string;
      dayClosed: string;
      lowTime: string;
    };
    skillsActive: string;
    actionsLabel: string;
    todayIncome: string;
    monthIncome: string;
    quickActions: {
      title: string;
      skillsActive: string;
      call: string;
      touch: string;
      lead: string;
      task: string;
      hardTask: string;
      income: string;
      callAction: string;
      touchAction: string;
      leadAction: string;
    };
    incomePrompt: {
      amount: string;
      source: string;
      invalid: string;
    };
    toast: {
      critHit: string;
      streak: (days: number) => string;
      passiveGold: (amount: number) => string;
      shieldActivated: (used: number, total: number) => string;
      penaltyReduced: (from: number, to: number) => string;
      territoryCaptured: (icon: string, name: string) => string;
      territoryXP: (xp: number, icon: string) => string;
      incomeAdded: (amount: string, xp: number, gold: number) => string;
    };
    penalty: {
      missDay: string;
    };
    territory: {
      xpTip: string;
    };
  };

  // Settings
  settings: {
    title: string;
    profile: {
      title: string;
      name: string;
      namePlaceholder: string;
      email: string;
    };
    goals: {
      title: string;
      dailyActions: string;
      monthlyIncome: string;
      penaltyXP: string;
    };
    notifications: {
      title: string;
      push: string;
    };
    language: {
      title: string;
      label: string;
      en: string;
      ru: string;
    };
    telegram: {
      title: string;
      connected: string;
      linkedTo: string;
      unlink: string;
      unlinkConfirm: string;
      getCode: string;
      generating: string;
      step1: string;
      step2: string;
      goToBot: string;
      codeExpiry: string;
      copied: string;
      errorCode: string;
      errorConnection: string;
      errorUnlink: string;
      unlinked: string;
    };
    saveBtn: string;
    saved: string;
    saveError: string;
    danger: {
      title: string;
      logout: string;
      logoutConfirm: string;
      logoutYes: string;
      reset: string;
      resetConfirm: string;
      resetYes: string;
      resetDone: string;
      delete: string;
      deleteConfirm: string;
      deleteTyping: string;
      deleteForever: string;
      deleted: string;
    };
  };
}
