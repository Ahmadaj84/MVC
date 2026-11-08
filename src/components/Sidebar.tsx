import React from 'react';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Scale,
  FileCheck2,
  FileSpreadsheet,
  Database,
  Code2,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  stats?: {
    facDecisionsCount: number;
    staffDecisionsCount: number;
    facilitiesCount: number;
    staffCount: number;
    articlesCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, stats }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'لوحة المؤشرات العامة',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'facility-decisions',
      label: 'قرارات مخالفات المنشآت',
      sublabel: 'MVC_FAC_DECISION',
      icon: Scale,
      badge: stats?.facDecisionsCount
    },
    {
      id: 'staff-decisions',
      label: 'قرارات مخالفات الممارسين',
      sublabel: 'MVC_MSTAFF_DECISION',
      icon: FileCheck2,
      badge: stats?.staffDecisionsCount
    },
    {
      id: 'facilities',
      label: 'دليل المنشآت الصحية',
      sublabel: 'MVC_VPI_FACILITIES',
      icon: Building2,
      badge: stats?.facilitiesCount
    },
    {
      id: 'staff',
      label: 'سجل الكادر والممارسين',
      sublabel: 'MVC_MSTAFF_DATA',
      icon: UserCheck,
      badge: stats?.staffCount
    },
    {
      id: 'articles',
      label: 'لائحة مواد المخالفات',
      sublabel: 'MVC_PENAITY_ARTICAL',
      icon: FileSpreadsheet,
      badge: stats?.articlesCount
    },
    {
      id: 'erd',
      label: 'مخطط Oracle 19c و Nuxt',
      sublabel: 'Oracle 19c DDL & Nuxt Spec',
      icon: Database,
      badge: 'Oracle 19c'
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between border-l border-slate-800">
      <div>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white leading-tight">
                نظام قرارات المخالفات
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                MVC Compliance Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors text-right ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="text-right truncate">
                    <div className="truncate">{item.label}</div>
                    {item.sublabel && (
                      <div className="text-[10px] text-slate-400 font-mono opacity-80 leading-none mt-0.5">
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span>قاعدة البيانات</span>
          <span className="text-emerald-400 font-mono font-medium">Oracle 19c</span>
        </div>
        <div className="flex items-center justify-between">
          <span>محرك الـ API</span>
          <span className="text-slate-300 font-mono text-[10px]">Node.js Express</span>
        </div>
        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
          متوافق مع Vue 3 / Nuxt 3 و Oracle Database
        </div>
      </div>
    </aside>
  );
};
