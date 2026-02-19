import { z } from 'zod/v4'

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Имя не может быть пустым')
    .max(50, 'Максимум 50 символов')
    .optional(),
  timezone: z.string().min(1, 'Выберите таймзону').optional(),
  daily_income_target: z
    .number()
    .min(0, 'Минимум 0')
    .max(10_000_000, 'Максимум 10 000 000')
    .optional(),
  monthly_income_target: z
    .number()
    .min(0, 'Минимум 0')
    .max(100_000_000, 'Максимум 100 000 000')
    .optional(),
  daily_actions_target: z
    .number()
    .int('Должно быть целым')
    .min(1, 'Минимум 1')
    .max(100, 'Максимум 100')
    .optional(),
  penalty_xp: z
    .number()
    .int('Должно быть целым')
    .min(0, 'Минимум 0')
    .max(10_000, 'Максимум 10 000')
    .optional(),
  focus_duration_minutes: z
    .number()
    .int('Должно быть целым')
    .min(1, 'Минимум 1 минута')
    .max(240, 'Максимум 240 минут')
    .optional(),
  notifications_enabled: z.boolean().optional(),
  streak_shield_active: z.boolean().optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>