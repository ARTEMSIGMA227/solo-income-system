"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserClass } from "@/hooks/use-user-class";
import { useSelectClass } from "@/hooks/use-select-class";
import { useToast } from "@/hooks/use-toast";
import {
  CLASS_INFO,
  HUNTER_CLASSES,
  type HunterClassName,
  type HunterClassInfo,
} from "@/types/hunter-class";

function daysUntilChange(selectedAt: string): number {
  const diff = 30 - (Date.now() - new Date(selectedAt).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(diff));
}

function ClassCard({
  info,
  selected,
  current,
  onSelect,
}: {
  info: HunterClassInfo;
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all ${
        selected
          ? `${info.borderColor} ${info.bgColor} ring-2 ring-violet-500/50 shadow-lg`
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      {current && (
        <span className="absolute top-3 right-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
          ТЕКУЩИЙ
        </span>
      )}

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
        {info.emoji}
      </div>

      <div>
        <h3 className={`text-lg font-bold ${info.color}`}>{info.title}</h3>
        <p className="mt-1 text-sm text-gray-400">{info.description}</p>
      </div>

      <div
        className={`mt-auto rounded-lg px-3 py-1.5 text-xs font-semibold ${info.bgColor} ${info.color}`}
      >
        {info.bonusText}
      </div>
    </button>
  );
}

export default function ClassSelectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: userClass, isLoading: classLoading } = useUserClass();
  const selectClass = useSelectClass();

  const [selectedClass, setSelectedClass] = useState<HunterClassName | null>(null);

  const cooldownDays = userClass ? daysUntilChange(userClass.selected_at) : 0;
  const canChange = !userClass || cooldownDays === 0;

  const handleConfirm = () => {
    if (!selectedClass) return;

    selectClass.mutate(
      { className: selectedClass },
      {
        onSuccess: () => {
          const info = CLASS_INFO[selectedClass];
          toast({
            title: `${info.emoji} Класс ${info.title} выбран!`,
            description: info.bonusText,
          });
          router.push("/dashboard");
        },
        onError: (error) => {
          toast({
            title: "Ошибка",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (classLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white">⚡ Выбери свой класс</h1>
        <p className="mt-2 text-gray-400">
          Каждый класс даёт уникальный бонус. Сменить можно раз в 30 дней.
        </p>
        {userClass && cooldownDays > 0 && (
          <p className="mt-2 text-sm text-yellow-400">
            ⏳ Смена класса доступна через {cooldownDays} дн.
          </p>
        )}
      </div>

      {/* Class grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HUNTER_CLASSES.map((cls) => {
          const info = CLASS_INFO[cls];
          return (
            <ClassCard
              key={cls}
              info={info}
              selected={selectedClass === cls}
              current={userClass?.class_name === cls}
              onSelect={() => {
                if (canChange) setSelectedClass(cls);
              }}
            />
          );
        })}
      </div>

      {/* Confirm */}
      {canChange && selectedClass && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectClass.isPending}
            className="rounded-xl bg-violet-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
          >
            {selectClass.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Сохраняю...
              </span>
            ) : userClass ? (
              `Сменить на ${CLASS_INFO[selectedClass].title}`
            ) : (
              `Выбрать ${CLASS_INFO[selectedClass].title}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}