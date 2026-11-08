import React from 'react';
import { DashboardStats } from '../services/api';
import { FullFacDecision, FullStaffDecision } from '../types/database';
import { formatSAR } from '../utils/date';
import {
  Scale,
  CreditCard,
  AlertTriangle,
  Building2,
  UserCheck,
  MessageSquare,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  facilityDecisions: FullFacDecision[];
  staffDecisions: FullStaffDecision[];
  onOpenNewDecision: (type: 'facility' | 'staff') => void;
  onSelectDecision: (decision: FullFacDecision | FullStaffDecision, type: 'facility' | 'staff') => void;
  onPrintDecision: (decision: FullFacDecision | FullStaffDecision, type: 'facility' | 'staff') => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  facilityDecisions,
  staffDecisions,
  onOpenNewDecision,
  onSelectDecision,
  onPrintDecision,
  onNavigateTab
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner / Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            لوحة الرقابة والمتابعة لقرارات المخالفات الصحية
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة اللجان والقرارات الصادرة بحق المنشآت الطبية والكوادر الصحية وتتبع إشعارات الرسائل (SMS) والتحصيل المالي وسهل.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewDecision('facility')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مخالفة منشأة</span>
          </button>
          <button
            onClick={() => onOpenNewDecision('staff')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مخالفة ممارس</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Fines */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">إجمالي الغرامات المقررة</span>
            <div className="p-2 bg-slate-100 rounded text-slate-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatSAR(stats?.totalFines || 0)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
            <span>منشآت وممارسين</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{stats ? stats.facDecisionsCount + stats.staffDecisionsCount : 0} قرار</span>
          </div>
        </div>

        {/* KPI 2: Total Paid */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">المبالغ المسددة والمحصلة</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {formatSAR(stats?.totalPaid || 0)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
            <span>نسبة التحصيل:</span>
            <span className="font-mono font-semibold text-emerald-700 tabular-nums">
              {stats?.paymentRate || 0}%
            </span>
          </div>
        </div>

        {/* KPI 3: Remaining Fines */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">المبالغ المتبقية للتحصيل</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {formatSAR(stats?.totalRemaining || 0)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
            <span>قرارات غير مسددة بالكامل:</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              {stats?.uncollectedDecisionsCount || 0}
            </span>
          </div>
        </div>

        {/* KPI 4: Archived SMS Records */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">سجل الرسائل المؤرشفة في Oracle</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded border border-slate-200">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats?.totalSmsSent || 0}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
            <span>سجلات سابقة محفوظة</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 font-medium">أرشيف قراءة فقط</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Facility Decisions & Recent Staff Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Recent Facility Decisions */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                أحدث قرارات مخالفات المنشآت الصحية (MVC_FAC_DECISION)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('facility-decisions')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {facilityDecisions.slice(0, 4).map(dec => (
              <div
                key={dec.DECISION_FAC_ID}
                className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">{dec.DECISION_ID}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 truncate">{dec.facility?.FACILITY_NAME}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span className="font-mono tabular-nums">سهل: {dec.INTERNAL_REF_SAHL}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>{dec.DECISION_DATE_H}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left">
                    <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                      {formatSAR(dec.totalAmount)}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {dec.PAYED === 2 ? (
                        <span className="text-emerald-700 font-medium">مسدد بالكامل</span>
                      ) : dec.PAYED === 1 ? (
                        <span className="text-sky-700 font-medium">مسدد جزئي</span>
                      ) : (
                        <span className="text-amber-700 font-medium">غير مسدد</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPrintDecision(dec, 'facility')}
                      title="طباعة صك القرار"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectDecision(dec, 'facility')}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      تفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>إجمالي قرارات المنشآت: {facilityDecisions.length}</span>
            <span className="font-mono text-[11px]">MVC_PENALTY_DES_FAC items included</span>
          </div>
        </div>

        {/* Column 2: Recent Staff Decisions */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                أحدث قرارات مخالفات الكادر والممارسين (MVC_MSTAFF_DECISION)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('staff-decisions')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
            >
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {staffDecisions.slice(0, 4).map(dec => (
              <div
                key={dec.DECISION_MSTAFF_ID}
                className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">{dec.DECISION_ID}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 truncate">{dec.staff?.FULL_NAME}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span className="truncate">{dec.staff?.DEGREE}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums">هوية: {dec.staff?.NATIONAL_ID}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left">
                    <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                      {formatSAR(dec.totalAmount)}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {dec.PAYED === 2 ? (
                        <span className="text-emerald-700 font-medium">مسدد بالكامل</span>
                      ) : dec.PAYED === 1 ? (
                        <span className="text-sky-700 font-medium">مسدد جزئي</span>
                      ) : (
                        <span className="text-amber-700 font-medium">غير مسدد</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPrintDecision(dec, 'staff')}
                      title="طباعة صك القرار"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectDecision(dec, 'staff')}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      تفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>إجمالي قرارات الممارسين: {staffDecisions.length}</span>
            <span className="font-mono text-[11px]">MVC_PENALTY_DES_MSTAFF items included</span>
          </div>
        </div>
      </div>

      {/* ERD and Architecture Prompt Banner */}
      <div className="bg-slate-900 text-slate-200 rounded-lg p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>هيكلية قاعدة البيانات المرفقة MVC_DB والربط البرمجي الكامل</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            تم تطبيق الجداول الـ 12 بالكامل: جداول المنشآت (MVC_VPI_FACILITIES)، الكادر (MVC_MSTAFF_DATA)، لائحة المخالفات (MVC_PENAITY_ARTICAL)، قرارات اللجان، بنود المخالفات الفرعية، سجلات الإشعارات (SMS) وسدادات التحصيل.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('erd')}
          className="shrink-0 px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
        >
          معاينة المخطط والربط البرمجي
        </button>
      </div>
    </div>
  );
};
