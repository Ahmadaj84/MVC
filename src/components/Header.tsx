import React from 'react';
import { RefreshCw, FileText, Plus, Database, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenNewDecision: (type: 'facility' | 'staff') => void;
  onResetDb: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenNewDecision,
  onResetDb,
  isResetting
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'لوحة المؤشرات والرقابة';
      case 'facility-decisions': return 'قرارات مخالفات المنشآت (MVC_FAC_DECISION)';
      case 'staff-decisions': return 'قرارات مخالفات الممارسين (MVC_MSTAFF_DECISION)';
      case 'facilities': return 'دليل المنشآت الصحية (MVC_VPI_FACILITIES)';
      case 'staff': return 'سجل الكادر والممارسين (MVC_MSTAFF_DATA)';
      case 'articles': return 'لائحة مواد المخالفات (MVC_PENAITY_ARTICAL)';
      case 'erd': return 'مخطط قاعدة البيانات والربط البرمجي (MVC_DB)';
      default: return 'نظام إدارة قرارات المخالفات';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark / Section Context */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-700 text-white font-bold text-base shadow-sm">
          MVC
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 whitespace-nowrap">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-slate-500 whitespace-nowrap">
            منظومة لجان النظر في مخالفات المؤسسات والمهن الصحية
          </p>
        </div>
      </div>

      {/* Zone 2: Navigation Info / System Status */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600">
        <span className="font-mono tabular-nums text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          منصة سهل · الربط الإلكتروني نشط
        </span>
        <span aria-hidden="true" className="text-slate-300">|</span>
        <span className="text-slate-500">
          قاعدة البيانات: <span className="font-mono text-slate-700 font-semibold">Oracle 19c (MVC_DB)</span>
        </span>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onResetDb}
          disabled={isResetting}
          title="إعادة تعيين البيانات الافتراضية"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>إعادة ضبط البيانات</span>
        </button>

        <button
          onClick={() => onOpenNewDecision('facility')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>قرار منشأة جديد</span>
        </button>

        <button
          onClick={() => onOpenNewDecision('staff')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>قرار ممارس جديد</span>
        </button>
      </div>
    </header>
  );
};
