export type Locale = 'ru' | 'en';

export interface TranslationDictionary {
  common: {
    hunter: string;
    loading: string;
    save: string;
    cancel: string;
    close: string;
    confirm: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    yes: string;
    no: string;
    error: string;
    success: string;
    level: string;
    gold: string;
    xp: string;
    day: string;
    days: string;
    today: string;
    yesterday: string;
    streak: string;
    actions: string;
    income: string;
    total: string;
    reset: string;
    buy: string;
    equip: string;
    equipped: string;
    locked: string;
    unlocked: string;
    completed: string;
    progress: string;
    reward: string;
    rewards: string;
    requirements: string;
    description: string;
    status: string;
    active: string;
    inactive: string;
    available: string;
    captured: string;
    inProgress: string;
    maxLevel: string;
    currentLevel: string;
    saving: string;
  };

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
    leaderboard: string;
    advisor: string;
    stats: string;
    more: string;
    menu: string;
    openMenu: string;
    closeMenu: string;
  };

  auth: {
    title: string;
    subtitle: string;
    login: string;
    register: string;
    email: string;
    password: string;
    hunterName: string;
    hunterNamePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    loginButton: string;
    registerButton: string;
    loadingButton: string;
    fillEmailPassword: string;
    fillAllFields: string;
    loginError: string;
    registerError: string;
    welcomeHunter: string;
    accountCreated: string;
    footer: string;
  };

  dashboard: {
    loading: string;
    actionsLabel: string;
    todayIncome: string;
    monthIncome: string;
    dayStatus: {
      inProgress: string;
      dayClosed: string;
      lowTime: string;
    };
    quickActions: {
      title: string;
      skillsActive: string;
      call: string;
      callAction: string;
      touch: string;
      touchAction: string;
      lead: string;
      leadAction: string;
      task: string;
      hardTask: string;
      income: string;
    };
    incomePrompt: {
      amount: string;
      source: string;
      invalid: string;
    };
    penalty: {
      missDay: string;
    };
    toast: {
      shieldActivated: (used: number, total: number) => string;
      penaltyReduced: (from: number, to: number) => string;
      passiveGold: (amount: number) => string;
      streak: (days: number) => string;
      critHit: string;
      incomeAdded: (amount: string, xp: number, gold: number) => string;
      territoryCaptured: (icon: string, name: string) => string;
      territoryXP: (xp: number, icon: string) => string;
    };
  };

  quests: {
    title: string;
    dailyMissions: string;
    dailyChallenge: string;
    completed: string;
    claimed: string;
    claim: string;
    progress: string;
    reward: string;
    noMissions: string;
    refreshIn: string;
    loading: string;
    newQuest: string;
    mandatory: string;
    optional: string;
    emptyState: string;
    alreadyDone: string;
    questUpdated: string;
    questCreated: string;
    questDeleted: string;
    deleteConfirm: (title: string) => string;
    enterName: string;
    editTitle: string;
    addTitle: string;
    saveChanges: string;
    createQuest: string;
    form: {
      name: string;
      namePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      questType: string;
      category: string;
      xpReward: string;
      targetCount: string;
      totalForQuest: string;
    };
    types: Record<string, string>;
    typeLabels: Record<string, string>;
    categories: Record<string, string>;
    categoryLabels: Record<string, string>;
  };

  skills: {
    title: string;
    subtitle: string;
    points: string;
    pointsAvailable: string;
    used: string;
    unallocatedHint: string;
    activeEffects: (count: number) => string;
    resetButton: string;
    resetCost: string;
    resetConfirmToast: string;
    resetConfirmButton: string;
    resetButtonLabel: string;
    resetSuccess: string;
    resetNoGold: string;
    loading: string;
    levelUp: string;
    maxed: string;
    effect: string;
    branch: string;
    branches: Record<string, string>;
    effectLabels: Record<string, string>;
  };

  focus: {
    title: string;
    pomodoro: string;
    start: string;
    pause: string;
    resume: string;
    stop: string;
    reset: string;
    workTime: string;
    breakTime: string;
    sessions: string;
    sessionComplete: string;
    breakComplete: string;
    minutes: string;
    seconds: string;
    loading: string;
    sessionsToday: string;
    perBlock: string;
    duration: string;
    focusing: string;
    paused: string;
    blockComplete: (min: number, xp: number, gold: number) => string;
    blockDesc: (min: number) => string;
    rules: {
      title: string;
      rule1: string;
      rule2: string;
      rule3: string;
      rule4: string;
      rule5: (xp: number, gold: number) => string;
    };
  };

  map: {
    title: string;
    subtitle: string;
    territories: string;
    activate: string;
    activateConfirm: string;
    capture: string;
    locked: string;
    foggy: string;
    available: string;
    inProgress: string;
    captured: string;
    xpProgress: string;
    level: string;
    biome: string;
    lore: string;
    connections: string;
    requirement: string;
    loading: string;
    errorLoading: string;
    remaining: string;
    progress: string;
    active: string;
    xpTip: string;
    stats: {
      captured: string;
      remaining: string;
      progress: string;
    };
    biomes: Record<string, string>;
    territories_names: Record<string, string>;
    territories_descriptions: Record<string, string>;
    territories_lore: Record<string, string>;
  };

  shop: {
    title: string;
    balance: string;
    buySuccess: string;
    buyError: string;
    notEnoughGold: string;
    alreadyOwned: string;
    loading: string;
    shopTab: string;
    inventoryTab: string;
    inventory: string;
    emptyInventory: string;
    filterAll: string;
    use: string;
    equip: string;
    unequip: string;
    active: string;
    activeUntil: string;
    activatedFor: (hours: number) => string;
    bought: (icon: string, name: string) => string;
    saved: (amount: number) => string;
    needLevel: (level: number) => string;
    needGold: (need: number, have: number) => string;
    missesReset: string;
    luckyScroll: (amount: number) => string;
    equipped: string;
    unequipped: string;
    discount: (percent: number) => string;
    categories: {
      all: string;
      potion: string;
      artifact: string;
      scroll: string;
    };
    categoryLabels: {
      potion: string;
      artifact: string;
      scroll: string;
    };
    itemNames: Record<string, string>;
    itemDescriptions: Record<string, string>;
  };

  boss: {
    title: string;
    weeklyBoss: string;
    hp: string;
    attack: string;
    timeLeft: string;
    defeated: string;
    reward: string;
    dealDamage: string;
    bossDefeated: string;
    loading: string;
    emptyState: string;
    emptyHint: string;
    weekly: string;
    monthly: string;
    daysLeft: (days: number) => string;
    notReady: string;
    finish: string;
    allDone: string;
    notAllDone: string;
    bossKilled: (name: string, xp: number) => string;
    bonusText: (bonus: number) => string;
    dmgBonus: (percent: number) => string;
    reduced: string;
    metrics: {
      actions: string;
      clients: string;
      income: string;
      sales: string;
    };
    bossNames: Record<string, string>;
    bossDescriptions: Record<string, string>;
  };

  guilds: {
    title: string;
    subtitle: string;
    subtitleHasGuild: string;
    members: string;
    join: string;
    leave: string;
    create: string;
    guildName: string;
    noGuild: string;
    ranking: string;
    loading: string;
    overview: string;
    dashboard: {
      level: string;
      copyInvite: string;
      leaveGuild: string;
      leaveLeaderWarning: string;
      leaveConfirm: string;
      kickConfirm: (name: string) => string;
      promoteToOfficer: string;
      demoteToMember: string;
      kick: string;
      roles: {
        leader: string;
        officer: string;
        member: string;
      };
      tabs: {
        members: string;
        chat: string;
        quests: string;
        requests: string;
      };
    };
    browser: {
      searchPlaceholder: string;
      notFound: string;
      full: string;
      joinSuccess: string;
      requestSent: string;
    };
    createForm: {
      title: string;
      nameLabel: string;
      namePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      maxMembers: string;
      type: string;
      public: string;
      private: string;
      creating: string;
      submit: string;
    };
    joinByCode: {
      title: string;
      placeholder: string;
      submit: string;
      joining: string;
      success: string;
    };
    guildQuests: {
      createQuest: string;
      questTitle: string;
      questTitlePlaceholder: string;
      questDescription: string;
      questDescriptionPlaceholder: string;
      target: string;
      xpReward: string;
      goldReward: string;
      creating: string;
      create: string;
      cancel: string;
      loading: string;
      activeQuests: string;
      completedQuests: string;
      emptyState: string;
      emptyCanManage: string;
      emptyMember: string;
      questCompleted: string;
    };
    guildRequests: {
      loading: string;
      empty: string;
      accept: string;
      reject: string;
      hunterLabel: (id: string) => string;
    };
    chat: {
      empty: string;
      placeholder: string;
    };
  };

  achievements: {
    title: string;
    unlocked: string;
    locked: string;
    progress: string;
    total: string;
    secret: string;
    loading: string;
    claim: string;
    filters: {
      all: string;
      actions: string;
      income: string;
      streak: string;
      level: string;
      special: string;
    };
    rarity: {
      common: string;
      rare: string;
      epic: string;
      legendary: string;
    };
    achievementClaimed: (name: string, xp: number, gold: number) => string;
  };

  analytics: {
    title: string;
    loading: string;
    thisMonth: string;
    income: string;
    actions: string;
    avgActions: string;
    avgIncome: string;
    weekActions: string;
    weekXP: string;
    weekIncome: string;
    bySource: string;
    analysis: string;
    exportPdf: string;
    exporting: string;
    sources: {
      sale: string;
      contract: string;
      freelance: string;
      bonus: string;
      other: string;
    };
    tips: {
      lowActions: string;
      goodPace: string;
      lowIncome: string;
      goalReached: string;
      zeroDays: string;
      noConversion: string;
      upTrend: string;
      downTrend: string;
      forecast: string;
      onTrack: string;
      needSpeed: string;
      perDay: string;
    };
    period: string;
    week: string;
    month: string;
    allTime: string;
    xpEarned: string;
    xpLost: string;
    goldEarned: string;
    actionsCount: string;
    incomeTotal: string;
    salesCount: string;
    avgDaily: string;
    bestDay: string;
    chart: string;
  };

  settings: {
    title: string;
    saveBtn: string;
    saved: string;
    saveError: string;
    profile: {
      title: string;
      name: string;
      namePlaceholder: string;
      email: string;
    };
    language: {
      title: string;
      label: string;
      en: string;
      ru: string;
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
    telegram: {
      title: string;
      connected: string;
      linkedTo: string;
      unlink: string;
      unlinkConfirm: string;
      unlinked: string;
      step1: string;
      step2: string;
      getCode: string;
      generating: string;
      goToBot: string;
      codeExpiry: string;
      copied: string;
      errorCode: string;
      errorConnection: string;
      errorUnlink: string;
    };
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
    displayName: string;
    dailyTarget: string;
    monthlyTarget: string;
    penaltyXP: string;
    character: string;
    editCharacter: string;
    logout: string;
    logoutConfirm: string;
    dangerZone: string;
    resetProgress: string;
    theme: string;
  };
  
  titles: Record<string, string>;

    streakBanner: {
    currentStreak: string;
    notStarted: string;
    atRiskWarning: string;
  };

  effects: {
    levelUp: string;
    levelUpTitle: string;
    streakDays: string;
    streakBest: string;
    streakFire: string;
    streakRecord: string;
    streakSeries: string;
    streakDay1: string;
    streakDay234: string;
    streakDay5plus: string;
  };

  death: {
    missTitle: string;
    levelDownTitle: string;
    xpLost: string;
    consecutiveMisses: string;
    warning: string;
    accept: string;
    penalty: string;
    levelLost: string;
    missDescription: (misses: number) => string;
    levelDownDescription: (misses: number) => string;
    unacceptable: string;
    missWarning: (left: number) => string;
    quoteLevelDown: string;
    quoteMiss: string;
    acceptPunishment: string;
    willFix: string;
  };

  levelUp: {
    title: string;
    tapToContinue: string;
  };

  dailyMissions: {
    title: string;
    loading: string;
    empty: string;
    emptyHint: string;
    allComplete: string;
    allCompleteBonus: (xp: number) => string;
    claim: string;
    claimed: string;
    rewardReceived: string;
    leveledUp: (level: number) => string;
    goldAwarded: (gold: number) => string;
    error: string;
    bonusSlots: string;
    difficultyLabels: {
      easy: string;
      medium: string;
      hard: string;
    };
    missionTitles: Record<string, string>;
    missionDescriptions: Record<string, string>;
  };

  dailyChallenge: {
    title: string;
    completed: string;
    progress: string;
    reward: string;
    bonus: string;
  };

  advisor: {
    title: string;
    collapse: string;
    moreAdvice: (count: number) => string;
  };

  mapView: {
    landTitle: string;
    legend: {
      locked: string;
      foggy: string;
      available: string;
      inBattle: string;
      captured: string;
    };
  };

  territoryNode: {
    statuses: {
      locked: string;
      foggy: string;
      available: string;
      in_progress: string;
      captured: string;
    };
    captureProgress: string;
    nextLevel: string;
    territoryCaptured: string;
    requirements: string;
    rewards: string;
    linkedBranch: string;
    activating: string;
    startCapture: string;
    makeActive: string;
    activeTerritory: string;
  };

  skillBranch: Record<string, never>;

  achievementsLib: {
    rarityLabels: {
      common: string;
      rare: string;
      epic: string;
      legendary: string;
    };
    names: Record<string, string>;
    descriptions: Record<string, string>;
  };

  advisorLib: {
    greetings: {
      night: (name: string) => string;
      morning: (name: string) => string;
      afternoon: (name: string) => string;
      evening: (name: string) => string;
    };
    levelTitles: {
      monarch: string;
      national: string;
      sRank: string;
      aRank: string;
      bRank: string;
      cRank: string;
      dRank: string;
      eRank: string;
    };
    advice: {
      noActions: string;
      lowActions: (done: number, target: number) => string;
      planDone: string;
      almostDone: (done: number, target: number, left: number) => string;
      streakBroken: (misses: number) => string;
      streakRecord: (streak: number) => string;
      streakGoing: (streak: number, best: number, left: number) => string;
      missWarning: (misses: number) => string;
      todayIncome: (amount: string) => string;
      monthlyDone: string;
      monthlyBehind: (percent: number, perDay: string) => string;
      monthlyAlmost: (percent: number, left: string) => string;
      weekend: string;
      monday: string;
      friday: string;
      lowLevel: string;
      highLevel: string;
      goldTip: (gold: number) => string;
      conversion: (rate: string, sales: number, actions: number) => string;
      noConversion: string;
      timePressure: (hour: number, left: number) => string;
    };
  };

  challengesLib: {
    templates: {
      title: Record<string, string>;
      description: Record<string, string>;
    };
  };

  skillTreeLib: {
    branchNames: Record<string, string>;
    branchDescriptions: Record<string, string>;
    skillNames: Record<string, string>;
    skillDescriptions: Record<string, string>;
    canAllocateReasons: {
      notFound: string;
      maxLevel: string;
      noPoints: string;
      requires: (name: string) => string;
    };
    effectDescriptions: Record<string, string>;
  };

  character: {
    rank: string;
    clickToAdd: string;
    tiers: {
      novice: string;
      hunter: string;
      warrior: string;
      knight: string;
      srank: string;
      monarch: string;
    };
    equipment: Record<string, string>;
    editor: {
      title: string;
      bodyType: string;
      male: string;
      female: string;
      singleTab: string;
      levelsTab: string;
      levelsHint: string;
      clickToUpload: string;
      uploadFromDevice: string;
      uploading: string;
      deleteImage: string;
      replace: string;
      upload: string;
      save: string;
      saved: string;
      uploadError: string;
      fileTooLarge: string;
      onlyImages: string;
      imageUploaded: string;
    };
  };

  xpBar: {
    level: string;
  };

  classBadge: {
    selectClass: string;
    classes: Record<string, string>;
  };

  skillNodeCard: {
    locked: string;
  };

  leaderboard: {
    title: string;
    loading: string;
    empty: string;
    xp: string;
    level: string;
    streak: string;
    actions: string;
    income: string;
    you: string;
    tabXp: string;
    tabStreak: string;
    tabActions: string;
    tabIncome: string;
    bestStreak: string;
    sales: string;
  };
}