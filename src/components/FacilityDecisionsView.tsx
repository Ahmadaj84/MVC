import React, { useState } from 'react';
import { FullFacDecision, MvcVpiFacility } from '../types/database';
import { formatSAR } from '../utils/date';
import {
  Search,
  Plus,
  Printer,
  MessageSquare,
  CreditCard,
  Edit,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';

interface FacilityDecisionsViewProps {
  decisions: FullFacDecision[];
  facilities: MvcVpiFacility[];
  onOpenNew: () => void;
  onEdit: (decision: FullFacDecision) => void;
  onDelete: (id: number) => void;
  onPrint: (decision: FullFacDecision) => void;
  onOpenSms: (decision: FullFacDecision) => void;
  onOpenPayment: (decision: FullFacDecision) => void;
}

export const FacilityDecisionsView: React.FC<FacilityDecisionsViewProps> = ({
  decisions,
  facilities,
  onOpenNew,
  onEdit,
  onDelete,
  onPrint,
  onOpenSms,
  onOpenPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  const filtered = decisions.filter(d => {
    const matchesSearch =
      d.DECISION_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.INTERNAL_REF_SAHL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.facility?.FACILITY_NAME || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFacility = !selectedFacility || d.FACILITIE_ID === Number(selectedFacility);
    const matchesPayment = paymentFilter === '' || d.PAYED === Number(paymentFilter);

    return matchesSearch && matchesFacility && matchesPayment;
  });

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            قرارات مخالفات المنشآت الصحية (MVC_FAC_DECISION)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل القرارات الصادرة ضد المنشآت والمستشفيات والعيادات وبنود الغرامات المقررة (MVC_PENALTY_DES_FAC)
          </p>
        </div>
        <button
          onClick={onOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار قرار منشأة جديد</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث برقم القرار، اسم المنشأة، أو مرجع سهل..."
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <select
          value={selectedFacility}
          onChange={e => setSelectedFacility(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
        >
          <option value="">جميع المنشآت</option>
          {facilities.map(f => (
            <option key={f.FACILITY_SERIAL} value={f.FACILITY_SERIAL}>
              {f.FACILITY_NAME}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
        >
          <option value="">كافة حالات السداد</option>
          <option value="0">غير مسدد (0)</option>
          <option value="1">مسدد جزئي (1)</option>
          <option value="2">مسدد بالكامل (2)</option>
        </select>

        {(searchTerm || selectedFacility || paymentFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedFacility('');
              setPaymentFilter('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">رقم القرار / التاريخ</th>
                <th className="py-3 px-4">المنشأة المستهدفة</th>
                <th className="py-3 px-4">مرجع سهل / الإدارة</th>
                <th className="py-3 px-4">بنود المخالفة</th>
                <th className="py-3 px-4">مبلغ القرار</th>
                <th className="py-3 px-4">حالة السداد</th>
                <th className="py-3 px-4">أرشيف الرسائل (MVC_FAC_SMS)</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد قرارات مخالفات تطابق شروط البحث
                  </td>
                </tr>
              ) : (
                filtered.map(dec => {
                  const remaining = dec.totalAmount - dec.paidAmount;
                  return (
                    <tr key={dec.DECISION_FAC_ID} className="hover:bg-slate-50/70 transition-colors">
                      {/* Decision No & Date */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{dec.DECISION_ID}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{dec.DECISION_DATE_H}</span>
                          <span aria-hidden="true" className="mx-1">·</span>
                          <span className="font-mono">{dec.DECISION_DATE_G}</span>
                        </div>
                      </td>

                      {/* Facility info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{dec.facility?.FACILITY_NAME || 'منشأة غير معروفة'}</div>
                        <div className="text-[11px] text-slate-500">
                          <span>{dec.facilityType?.FACILITY_TYPE_DESC || 'منشأة صحية'}</span>
                          <span aria-hidden="true" className="mx-1">·</span>
                          <span className="font-mono">ترخيص: {dec.facility?.LICENSE_NUMBER || '-'}</span>
                        </div>
                      </td>

                      {/* Sahl & Department */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800">{dec.INTERNAL_REF_SAHL}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={dec.DEPARTMENT}>
                          {dec.DEPARTMENT}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dec.items.length} بنود مخالفة</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {dec.items.map(i => i.PENALTY_NAME).join(' ، ')}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatSAR(dec.totalAmount)}
                        </div>
                        {dec.paidAmount > 0 && dec.paidAmount < dec.totalAmount && (
                          <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                            مسدد: {formatSAR(dec.paidAmount)}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        {dec.PAYED === 2 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>مسدد بالكامل</span>
                          </span>
                        ) : dec.PAYED === 1 ? (
                          <div>
                            <span className="text-sky-700 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>مسدد جزئي</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              متبقي: {formatSAR(remaining)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>غير مسدد</span>
                          </span>
                        )}
                      </td>

                      {/* SMS Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenSms(dec)}
                          className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-700 transition-colors"
                          title="عرض أرشيف الرسائل السابقة في Oracle"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dec.sms?.NOTC_1_STATUS || 'لا يوجد سجل'}</span>
                        </button>
                        {dec.sms?.NOTC_2_STATUS && (
                          <div className="text-[10px] text-slate-500">
                            تذكير 2: {dec.sms.NOTC_2_STATUS}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPrint(dec)}
                            title="طباعة صك القرار الرسمي"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenPayment(dec)}
                            title="تسجيل إيصال سداد"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenSms(dec)}
                            title="عرض أرشيف الرسائل السابقة (Oracle)"
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEdit(dec)}
                            title="تعديل القرار"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDelete(dec.DECISION_FAC_ID)}
                            title="حذف القرار"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>إجمالي القرارات المعروضة: {filtered.length} من أصل {decisions.length}</span>
          <span className="font-mono text-[11px]">جدول MVC_FAC_DECISION</span>
        </div>
      </div>
    </div>
  );
};
