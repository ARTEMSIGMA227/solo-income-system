import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  displayName: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
});

export const quickActionSchema = z.object({
  type: z.enum(['action', 'task', 'hard_task', 'sale', 'client_closed']),
  count: z.number().int().min(1).max(100).default(1),
  notes: z.string().max(500).optional(),
});

export const incomeEventSchema = z.object({
  amount: z.number().positive('Сумма должна быть положительной'),
  source: z.enum(['sale', 'contract', 'freelance', 'bonus', 'other']),
  clientName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  eventDate: z.string().optional(),
});

export const questSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(1000).optional(),
  questType: z.enum(['daily_mandatory', 'daily_optional', 'weekly', 'custom']),
  category: z.enum(['income_action', 'strategy', 'skill', 'fitness', 'other']),
  xpReward: z.number().int().min(1).max(1000).default(25),
  targetCount: z.number().int().min(1).max(1000).default(1),
});

export const habitSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  category: z.enum(['income_action', 'strategy', 'skill', 'fitness', 'other']),
  frequency: z.enum(['daily', 'weekday', 'weekly']),
  xpReward: z.number().int().min(1).max(100).default(10),
});

export const settingsSchema = z.object({
  displayName: z.string().min(2).max(50),
  timezone: z.string().default('Europe/Berlin'),
  dailyIncomeTarget: z.number().int().min(0),
  monthlyIncomeTarget: z.number().int().min(0),
  dailyActionsTarget: z.number().int().min(1).max(200),
  penaltyXp: z.number().int().min(0).max(1000),
  focusDurationMinutes: z.number().int().min(15).max(240),
  notificationsEnabled: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type QuickActionInput = z.infer<typeof quickActionSchema>;
export type IncomeEventInput = z.infer<typeof incomeEventSchema>;
export type QuestInput = z.infer<typeof questSchema>;
export type HabitInput = z.infer<typeof habitSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;