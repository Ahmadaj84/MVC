import React from 'react';
import { FullFacDecision, FullStaffDecision } from '../types/database';
import { X, MessageSquare, CheckCircle2, Clock, Smartphone, Database, AlertCircle, FileCode } from 'lucide-react';

interface SmsTrackingModalProps {
  decision: FullFacDecision | FullStaffDecision;
  type: 'facility' | 'staff';
  isOpen: boolean;
  onClose: () => void;
}

export const SmsTrackingModal: React.FC<SmsTrackingModalProps> = ({
  decision,
  type,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const sms = decision.sms;
  const targetMobile = type === 'facility'
    ? (decision as FullFacDecision).facility?.MOBILE
    : (decision as FullStaffDecision).staff?.MOBIE_NUM;

  const targetName = type === 'facility'
    ? (decision as FullFacDecision).facility?.FACILITY_NAME
    : (decision as FullStaffDecision).staff?.FULL_NAME;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold">
                أرشيف وسجل الرسائل التاريخية في Oracle ({type === 'facility' ? 'MVC_FAC_SMS' : 'MVC_MSTAFF_SMS'})
              </h3>
              <p className="text-[11px] text-slate-400">
                القرار رقم: {decision.DECISION_ID} · {targetName}
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Note Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">خدمة الإرسال الفوري متوقفة: </span>
              <span>
                يتم فقط استعراض سجل الرسائل والإشعارات السابقة المسجلة والمؤرشفة في قاعدة بيانات Oracle 19c.
              </span>
            </div>
          </div>

          {/* Recipient summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>رقم الجوال المسجل:</span>
              <span className="font-mono font-bold text-slate-900">{sms?.MOBILE || targetMobile || 'غير محدد'}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-slate-500 text-[11px]">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>سجل رقم: #{sms?.SMS_ID || 'لا يوجد سجل سابق'}</span>
            </div>
          </div>

          {/* Notice 1 (الإشعار الأول) */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                  1
                </span>
                <span className="text-xs font-bold text-slate-900">
                  الإشعار الأول بصدور القرار (NOTC_1)
                </span>
              </div>

              {sms?.NOTC_1_STATUS === 'تم الإرسال' ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم التسليم بنجاح</span>
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{sms?.NOTC_1_STATUS || 'لا يوجد إشعار أول مسجل'}</span>
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>تاريخ التسجيل: {sms?.NOTC_1_DATE || '-'}</span>
                <span className="font-mono">مرجع GUID: {sms?.NOTC_1_GUID || '-'}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 text-slate-800">
                <span className="font-medium text-slate-900 block mb-0.5">نص الإشعار المؤرشف:</span>
                <p className="bg-white p-2.5 border border-slate-200 rounded font-sans text-xs leading-relaxed text-slate-800">
                  {sms?.NOTC_1_JSON
                    ? (() => {
                        try {
                          return JSON.parse(sms.NOTC_1_JSON).text;
                        } catch {
                          return sms.NOTC_1_JSON;
                        }
                      })()
                    : 'لا توجد بيانات سابقة محفوظة لهذا الإشعار في قاعدة البيانات.'}
                </p>
              </div>
              {sms?.NOTC_1_STAT_DES && (
                <div className="text-[11px] text-slate-500">
                  حالة البوابة: {sms.NOTC_1_STAT_DES}
                </div>
              )}
            </div>
          </div>

          {/* Notice 2 (إشعار التذكير الثاني) */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <span className="text-xs font-bold text-slate-900">
                  إشعار التذكير الثاني بالسداد (NOTC_2)
                </span>
              </div>

              {sms?.NOTC_2_STATUS === 'تم الإرسال' ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم التسليم</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  {sms?.NOTC_2_STATUS || 'لا يوجد إشعار ثانٍ مسجل'}
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>تاريخ التسجيل: {sms?.NOTC_2_DATE || '-'}</span>
                <span className="font-mono">مرجع GUID: {sms?.NOTC_2_GUID || '-'}</span>
              </div>
              {sms?.NOTC_2_JSON ? (
                <div className="pt-1.5 border-t border-slate-200 text-slate-800">
                  <span className="font-medium text-slate-900 block mb-0.5">نص التذكير المؤرشف:</span>
                  <p className="bg-white p-2.5 border border-slate-200 rounded font-sans text-xs leading-relaxed text-slate-800">
                    {(() => {
                      try {
                        return JSON.parse(sms.NOTC_2_JSON).text;
                      } catch {
                        return sms.NOTC_2_JSON;
                      }
                    })()}
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  لم يسجل أي تذكير ثانٍ لهذا القرار في سجلات Oracle 19c.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[11px]">
              Oracle Table: {type === 'facility' ? 'MVC_FAC_SMS' : 'MVC_MSTAFF_SMS'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
