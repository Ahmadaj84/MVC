import React, { useState, useEffect, useRef } from 'react';
import {
  MvcVpiFacility,
  MvcMstaffData,
  MvcPenaltyArtical,
  FullFacDecision,
  FullStaffDecision
} from '../types/database';
import { formatSAR, toHijriDate } from '../utils/date';
import { X, Plus, Trash2, Scale, Calculator } from 'lucide-react';

interface DecisionModalProps {
  type: 'facility' | 'staff';
  initialDecision?: FullFacDecision | FullStaffDecision | null;
  facilities: MvcVpiFacility[];
  staffList: MvcMstaffData[];
  articles: MvcPenaltyArtical[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { decision: any; items: any[] }) => Promise<void>;
}

interface ItemRow {
  ARTICAL_ID: number;
  AMOUNT: number;
  PENALTY_TYP: string;
  PENALTY_NAME: string;
}

// Wrapper keeps the early return outside the component that uses hooks
// (calling hooks after a conditional return breaks React's rules of hooks).
export const DecisionModal: React.FC<DecisionModalProps> = props =>
  props.isOpen ? <DecisionModalContent {...props} /> : null;

const DecisionModalContent: React.FC<DecisionModalProps> = ({
  type,
  initialDecision,
  facilities,
  staffList,
  articles,
  onClose,
  onSubmit
}) => {

  const isEditing = Boolean(initialDecision);

  // Form states
  const [targetId, setTargetId] = useState<number>(() => {
    if (initialDecision) {
      return type === 'facility'
        ? (initialDecision as FullFacDecision).FACILITIE_ID
        : (initialDecision as FullStaffDecision).MSTAFF_ID;
    }
    return type === 'facility'
      ? facilities[0]?.FACILITY_SERIAL || 101
      : staffList[0]?.STAFF_SERIAL || 201;
  });

  const [decisionId, setDecisionId] = useState<string>(
    initialDecision?.DECISION_ID ||
      (type === 'facility'
        ? `ق-م/1447/${Math.floor(100 + Math.random() * 900)}`
        : `ق-ص/1447/${Math.floor(100 + Math.random() * 900)}`)
  );

  const [dateG, setDateG] = useState<string>(
    initialDecision?.DECISION_DATE_G || new Date().toISOString().split('T')[0]
  );
  const [dateH, setDateH] = useState<string>(
    initialDecision?.DECISION_DATE_H || toHijriDate(new Date().toISOString().split('T')[0])
  );

  const [sahlRef, setSahlRef] = useState<string>(
    initialDecision?.INTERNAL_REF_SAHL ||
      `SHL-${type === 'facility' ? 'FAC' : 'STF'}-${Date.now().toString().slice(-5)}`
  );
  const [sahlDate, setSahlDate] = useState<string>(
    initialDecision?.SAHL_DATE || new Date().toISOString().split('T')[0]
  );

  const [departmentOrSource, setDepartmentOrSource] = useState<string>(() => {
    if (type === 'facility') {
      return (
        (initialDecision as FullFacDecision)?.DEPARTMENT ||
        'لجنة النظر في مخالفات المؤسسات الصحية الخاصة'
      );
    } else {
      return (
        (initialDecision as FullStaffDecision)?.DEC_SOURCE ||
        'لجنة النظر في مخالفات نظام مزاولة المهن الصحية'
      );
    }
  });

  const [createdBy, setCreatedBy] = useState<string>(
    initialDecision?.CREATE_BY || 'أمين سر اللجنة'
  );
  const [needSms, setNeedSms] = useState<boolean>(
    initialDecision?.NEED_SMS !== undefined ? Boolean(initialDecision.NEED_SMS) : true
  );

  // Penalty items list (MVC_PENALTY_DES_FAC or MVC_PENALTY_DES_MSTAFF)
  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialDecision?.items && initialDecision.items.length > 0) {
      return initialDecision.items.map(it => ({
        ARTICAL_ID: it.ARTICAL_ID,
        AMOUNT: it.AMOUNT,
        PENALTY_TYP: it.PENALTY_TYP,
        PENALTY_NAME: it.PENALTY_NAME
      }));
    }
    const defaultArticle =
      articles.find(a =>
        type === 'facility'
          ? a.ARTICAL_TYPE === 'منشآت' || a.ARTICAL_TYPE === 'مشترك'
          : a.ARTICAL_TYPE === 'ممارسين' || a.ARTICAL_TYPE === 'مشترك'
      ) || articles[0];

    return [
      {
        ARTICAL_ID: defaultArticle?.ARTICAL_ID || 1,
        AMOUNT: 20000,
        PENALTY_TYP: 'غرامة مالية',
        PENALTY_NAME: defaultArticle?.ARTICAL_NAME || 'مخالفة نظامية'
      }
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update Hijri date whenever the user changes the Gregorian date.
  // Skip the initial render so an existing decision keeps its stored Hijri date.
  const isFirstDateRender = useRef(true);
  useEffect(() => {
    if (isFirstDateRender.current) {
      isFirstDateRender.current = false;
      return;
    }
    if (dateG) {
      setDateH(toHijriDate(dateG));
    }
  }, [dateG]);

  const totalAmount = items.reduce((sum, it) => sum + (Number(it.AMOUNT) || 0), 0);

  const handleAddItem = () => {
    const defaultArticle =
      articles.find(a =>
        type === 'facility'
          ? a.ARTICAL_TYPE === 'منشآت' || a.ARTICAL_TYPE === 'مشترك'
          : a.ARTICAL_TYPE === 'ممارسين' || a.ARTICAL_TYPE === 'مشترك'
      ) || articles[0];

    setItems([
      ...items,
      {
        ARTICAL_ID: defaultArticle?.ARTICAL_ID || 1,
        AMOUNT: 10000,
        PENALTY_TYP: 'غرامة مالية',
        PENALTY_NAME: defaultArticle?.ARTICAL_NAME || 'بند مخالفة جديد'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('يجب أن يحتوي القرار على بند مخالفة واحد على الأقل');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    if (field === 'ARTICAL_ID') {
      const art = articles.find(a => a.ARTICAL_ID === Number(value));
      updated[index] = {
        ...updated[index],
        ARTICAL_ID: Number(value),
        PENALTY_NAME: art ? art.ARTICAL_NAME : updated[index].PENALTY_NAME
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) {
      alert('يرجى تحديد الجهة أو الممارس المستهدف بالقرار');
      return;
    }
    if (items.length === 0) {
      alert('يرجى إضافة بند مخالفة واحد على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const decisionData: any = {
        DECISION_ID: decisionId,
        DECISION_DATE_G: dateG,
        DECISION_DATE_H: dateH,
        INTERNAL_REF_SAHL: sahlRef,
        SAHL_DATE: sahlDate,
        CREATE_BY: createdBy,
        NEED_SMS: needSms ? 1 : 0
      };

      if (type === 'facility') {
        decisionData.FACILITIE_ID = Number(targetId);
        decisionData.DEPARTMENT = departmentOrSource;
      } else {
        decisionData.MSTAFF_ID = Number(targetId);
        decisionData.DEC_SOURCE = departmentOrSource;
      }

      await onSubmit({
        decision: decisionData,
        items
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(`حدث خطأ أثناء حفظ القرار: ${(err as Error)?.message || ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">
                {isEditing
                  ? `تعديل قرار مخالفة (${initialDecision?.DECISION_ID})`
                  : type === 'facility'
                  ? 'إصدار قرار مخالفة منشأة صحية (MVC_FAC_DECISION)'
                  : 'إصدار قرار مخالفة ممارس صحي (MVC_MSTAFF_DECISION)'}
              </h3>
              <p className="text-[11px] text-slate-300">
                تسجيل القرار وبنود العقوبات المالية والربط مع منصة سهل والإشعارات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Section 1: Target Entity & Basic Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200">
              1. بيانات القرار والطرف الصادر بحقه
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Target Entity Selector */}
              {type === 'facility' ? (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">المنشأة الصحية المستهدفة (FACILITIE_ID) *</label>
                  <select
                    value={targetId}
                    onChange={e => setTargetId(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    required
                  >
                    {facilities.map(f => (
                      <option key={f.FACILITY_SERIAL} value={f.FACILITY_SERIAL}>
                        {f.FACILITY_NAME} - ترخيص: {f.LICENSE_NUMBER}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">الممارس الصحي المستهدف (MSTAFF_ID) *</label>
                  <select
                    value={targetId}
                    onChange={e => setTargetId(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    required
                  >
                    {staffList.map(s => (
                      <option key={s.STAFF_SERIAL} value={s.STAFF_SERIAL}>
                        {s.FULL_NAME} - {s.DEGREE} (هوية: {s.NATIONAL_ID})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Decision Number */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">رقم القرار الصادر (DECISION_ID) *</label>
                <input
                  type="text"
                  required
                  value={decisionId}
                  onChange={e => setDecisionId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  placeholder="ق-م/1447/..."
                />
              </div>

              {/* Dates */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">تاريخ القرار ميلادي (DECISION_DATE_G) *</label>
                <input
                  type="date"
                  required
                  value={dateG}
                  onChange={e => setDateG(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">تاريخ القرار هجري (DECISION_DATE_H) *</label>
                <input
                  type="text"
                  required
                  value={dateH}
                  onChange={e => setDateH(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  placeholder="1447-01-01 هـ"
                />
              </div>

              {/* Sahl Platform integration */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">مرجع منصة سهل (INTERNAL_REF_SAHL) *</label>
                <input
                  type="text"
                  required
                  value={sahlRef}
                  onChange={e => setSahlRef(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  placeholder="SHL-2025-..."
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">تاريخ قيد المعاملة في سهل (SAHL_DATE) *</label>
                <input
                  type="date"
                  required
                  value={sahlDate}
                  onChange={e => setSahlDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              {/* Department or Source */}
              <div className="col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  {type === 'facility' ? 'اللجنة / الإدارة المصدرة للقرار (DEPARTMENT)' : 'مصدر وجهة القرار (DEC_SOURCE)'} *
                </label>
                <input
                  type="text"
                  required
                  value={departmentOrSource}
                  onChange={e => setDepartmentOrSource(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penalty Items Builder (MVC_PENALTY_DES_FAC / MSTAFF) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900">
                2. بنود وعقوبات المخالفة ({type === 'facility' ? 'MVC_PENALTY_DES_FAC' : 'MVC_PENALTY_DES_MSTAFF'})
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة بند مخالفة إضافي</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs"
                >
                  {/* Article selection */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] text-slate-500 mb-1">مادة المخالفة (ARTICAL_ID)</label>
                    <select
                      value={item.ARTICAL_ID}
                      onChange={e => handleItemChange(index, 'ARTICAL_ID', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded focus:outline-none text-xs"
                    >
                      {articles.map(a => (
                        <option key={a.ARTICAL_ID} value={a.ARTICAL_ID}>
                          مادة {a.ARTICAL_ID}: {a.ARTICAL_NAME}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Penalty Type */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">نوع العقوبة (PENALTY_TYP)</label>
                    <select
                      value={item.PENALTY_TYP}
                      onChange={e => handleItemChange(index, 'PENALTY_TYP', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded focus:outline-none text-xs"
                    >
                      <option value="غرامة مالية">غرامة مالية</option>
                      <option value="غرامة مالية مع إنذار">غرامة مالية مع إنذار</option>
                      <option value="إغلاق مؤقت">إغلاق مؤقت</option>
                      <option value="إلغاء الترخيص">إلغاء الترخيص</option>
                      <option value="إيقاف عن المزاولة">إيقاف عن المزاولة</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">المبلغ بالريال (AMOUNT)</label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={item.AMOUNT}
                      onChange={e => handleItemChange(index, 'AMOUNT', Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded focus:outline-none font-mono text-xs tabular-nums text-left"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      title="حذف البند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Penalty description text */}
                  <div className="md:col-span-12">
                    <input
                      type="text"
                      value={item.PENALTY_NAME}
                      onChange={e => handleItemChange(index, 'PENALTY_NAME', e.target.value)}
                      placeholder="بيان المخالفة التفصيلي (PENALTY_NAME)..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total fine calculation banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-medium">
                <Calculator className="w-4 h-4 text-emerald-700" />
                <span>إجمالي مبالغ الغرامة المقررة:</span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-800 tabular-nums">
                {formatSAR(totalAmount)}
              </div>
            </div>
          </div>

          {/* Section 3: Oracle DB Field (NEED_SMS) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needSms"
                checked={needSms}
                onChange={e => setNeedSms(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <label htmlFor="needSms" className="text-xs text-slate-700 font-medium cursor-pointer">
                حفظ مؤشر الإشعار في قاعدة البيانات (حقل NEED_SMS = 1)
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mr-6 mt-0.5">
              ملاحظة: تم إيقاف خدمة الإرسال الفوري للرسائل النصية والاعتماد على سجل الأرشيف التاريخي في Oracle 19c.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'جارٍ الحفظ والتوثيق...' : isEditing ? 'تحديث القرار' : 'اعتماد وحفظ القرار'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
