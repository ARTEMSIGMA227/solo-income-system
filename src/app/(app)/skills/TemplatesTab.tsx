'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Download, Trash2, Globe, Lock } from 'lucide-react';

interface TemplateData {
  name: string;
  emoji: string;
  description?: string;
  goal?: string;
  checklist?: { text: string; done: boolean }[];
}

interface Template {
  id: string;
  user_id: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  description_ru: string | null;
  template_type: string;
  template_data: TemplateData;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

interface TemplatesTabProps {
  userId: string;
  locale: string;
  isPro: boolean;
  onCreateFromTemplate: (data: TemplateData) => void;
}

export default function TemplatesTab({ userId, locale, isPro, onCreateFromTemplate }: TemplatesTabProps) {
  const ru = locale === 'ru';
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'my' | 'public'>('my');

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function loadTemplates() {
    setLoading(true);
    let query = supabase.from('templates').select('*').eq('template_type', 'skill');

    if (filter === 'my') {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('is_public', true);
    }

    const { data } = await query.order('created_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm(ru ? 'Удалить шаблон?' : 'Delete template?')) return;
    await supabase.from('templates').delete().eq('id', id);
    toast.success(ru ? 'Шаблон удалён' : 'Template deleted');
    loadTemplates();
  }

  async function useTemplate(template: Template) {
    await supabase
      .from('templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id);
    onCreateFromTemplate(template.template_data);
  }

  if (!isPro) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">👑</div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {ru ? 'Шаблоны — PRO функция' : 'Templates — PRO Feature'}
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          {ru
            ? 'Сохраняйте и делитесь шаблонами навыков с PRO-подпиской'
            : 'Save and share skill templates with PRO subscription'}
        </p>
        <a
          href="/subscription"
          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500"
        >
          {ru ? 'Узнать о PRO' : 'Learn about PRO'}
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('my')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'my'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5 inline mr-1.5" />
          {ru ? 'Мои шаблоны' : 'My Templates'}
        </button>
        <button
          onClick={() => setFilter('public')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'public'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 inline mr-1.5" />
          {ru ? 'Публичные' : 'Public'}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">
            {filter === 'my'
              ? ru
                ? 'У вас нет шаблонов. Сохраните навык как шаблон!'
                : 'No templates yet. Save a skill as template!'
              : ru
                ? 'Публичных шаблонов пока нет'
                : 'No public templates yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.template_data.emoji}</span>
                  <div>
                    <h4 className="font-semibold text-white">
                      {ru && template.name_ru ? template.name_ru : template.name}
                    </h4>
                    {(template.description || template.description_ru) && (
                      <p className="text-sm text-gray-400 mt-0.5">
                        {ru && template.description_ru
                          ? template.description_ru
                          : template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {template.template_data.goal && (
                        <span className="text-xs text-gray-500">
                          🎯 {template.template_data.goal}
                        </span>
                      )}
                      {template.template_data.checklist &&
                        template.template_data.checklist.length > 0 && (
                          <span className="text-xs text-gray-500">
                            ✅ {template.template_data.checklist.length}{' '}
                            {ru ? 'пунктов' : 'items'}
                          </span>
                        )}
                      <span className="text-xs text-gray-600">
                        {ru ? 'Использований:' : 'Uses:'} {template.usage_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => useTemplate(template)}
                    className="p-2 text-purple-400 hover:text-purple-300"
                    title={ru ? 'Использовать' : 'Use'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {template.user_id === userId && (
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 text-gray-500 hover:text-red-400"
                      title={ru ? 'Удалить' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}