import React from 'react';
import { FullFacDecision, FullStaffDecision } from '../types/database';
import { formatSAR } from '../utils/date';
import { Printer, X, Shield, QrCode } from 'lucide-react';

interface DecisionPrintViewProps {
  decision: FullFacDecision | FullStaffDecision;
  type: 'facility' | 'staff';
  onClose: () => void;
}

export const DecisionPrintView: React.FC<DecisionPrintViewProps> = ({
  decision,
  type,
  onClose
}) => {
  const facDecision = type === 'facility' ? (decision as FullFacDecision) : null;
  const staffDecision = type === 'staff' ? (decision as FullStaffDecision) : null;

  const targetName = facDecision
    ? facDecision.facility?.FACILITY_NAME
    : staffDecision?.staff?.FULL_NAME;

  const targetIdNumber = facDecision
    ? `السجل التجاري: ${facDecision.facility?.CR_NO || '-'}`
    : `رقم الهوية: ${staffDecision?.staff?.NATIONAL_ID || '-'}`;

  const licenseNo = facDecision
    ? facDecision.facility?.LICENSE_NUMBER
    : staffDecision?.staff?.DEGREE;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[96vh] overflow-y-auto">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print p-4 bg-slate-900 text-white rounded-t-lg flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">معاينة وطباعة صك القرار الوزاري الرسمي</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-10 text-slate-900 bg-white min-h-[900px] flex flex-col justify-between font-serif space-y-6">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-center justify-between">
              <div className="text-right text-xs space-y-1">
                <div className="font-bold text-sm">المملكة العربية السعودية</div>
                <div className="text-slate-700">وزارة الصحة</div>
                <div className="text-slate-700">الإدارة العامة للالتزام</div>
                <div className="font-bold text-slate-900">
                  {type === 'facility'
                    ? facDecision?.DEPARTMENT
                    : staffDecision?.DEC_SOURCE}
                </div>
              </div>

              {/* Emblem / Logo */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-emerald-800" />
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-1 font-sans">
                  منظومة اللجان الصحية
                </div>
              </div>

              {/* Document Meta Numbers */}
              <div className="text-left text-xs space-y-1 font-sans">
                <div>
                  <span className="text-slate-500">رقم القرار: </span>
                  <span className="font-bold font-mono text-sm">{decision.DECISION_ID}</span>
                </div>
                <div>
                  <span className="text-slate-500">التاريخ الهجري: </span>
                  <span className="font-medium">{decision.DECISION_DATE_H}</span>
                </div>
                <div>
                  <span className="text-slate-500">التاريخ الميلادي: </span>
                  <span className="font-mono">{decision.DECISION_DATE_G}</span>
                </div>
                <div>
                  <span className="text-slate-500">قيد منصة سهل: </span>
                  <span className="font-mono font-medium">{decision.INTERNAL_REF_SAHL}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-lg font-bold underline underline-offset-8">
                قـــرار لجنـــة النظـــر فــي المخالفـــات
              </h2>
            </div>
          </div>

          {/* Facts and Recital */}
          <div className="space-y-4 text-xs leading-relaxed text-justify">
            <p>
              الحمد لله وحده، والصلاة والسلام على من لا نبي بعده، أما بعد:
            </p>
            <p>
              إن اللجنة المشكلة بقرار معالي وزير الصحة رقم وتاريخ، للنظر في مخالفات الأحكام المقررة نظاماً، وبعد اطلاعها على محضر الضبط والتفتيش المحال عبر منصة (سهل) برقم قيد <span className="font-mono font-bold">({decision.INTERNAL_REF_SAHL})</span> وتاريخ <span className="font-mono">({decision.SAHL_DATE})</span>، وما تضمنه تقرير فرق الرقابة الميدانية الموجه ضد:
            </p>

            {/* Target Box */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded font-sans text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">الاسم / المنشأة: </span>
                  <span className="font-bold text-slate-900">{targetName}</span>
                </div>
                <div>
                  <span className="text-slate-500">الإثبات: </span>
                  <span className="font-mono font-bold text-slate-900">{targetIdNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">الترخيص / التخصص: </span>
                  <span className="font-semibold text-slate-800">{licenseNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">المدينة / النطاق: </span>
                  <span className="text-slate-800">
                    {facDecision?.facility?.ADD_CITY || staffDecision?.staff?.ADD_CITY || 'المملكة العربية السعودية'}
                  </span>
                </div>
              </div>
            </div>

            <p>
              وحيث ثبت لدى اللجنة ارتكاب المخالفات المرصودة بموجب التقارير والقرائن الفنية، وحيث إن ما أُقدم عليه يُعد مخالفة صريحة للأنظمة واللوائح والقرارات الوزارية النافذة؛ واستناداً إلى الصلاحيات المخولة نظاماً، قررت اللجنة بالإجماع ما يلي:
            </p>
          </div>

          {/* Decision Verdict and Breakdown Table */}
          <div className="space-y-2">
            <div className="font-bold text-xs">
              أولاً: إدانة المذكور وتطبيق العقوبات والبنود النظامية الآتية:
            </div>

            <table className="w-full text-xs border border-slate-300 font-sans">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                <tr>
                  <th className="p-2 border-l border-slate-300 text-center w-10">م</th>
                  <th className="p-2 border-l border-slate-300 text-right">المادة والسند النظامي</th>
                  <th className="p-2 border-l border-slate-300 text-right">بيان وتفاصيل المخالفة</th>
                  <th className="p-2 border-l border-slate-300 text-right">نوع الجزاء</th>
                  <th className="p-2 text-left w-28">المبلغ المقبول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {decision.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-l border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-l border-slate-300 font-medium">
                      {item.article?.ARTICAL_NAME || `مادة رقم (${item.ARTICAL_ID})`}
                    </td>
                    <td className="p-2 border-l border-slate-300 text-slate-700">
                      {item.PENALTY_NAME}
                    </td>
                    <td className="p-2 border-l border-slate-300 font-medium text-slate-800">
                      {item.PENALTY_TYP}
                    </td>
                    <td className="p-2 text-left font-mono font-bold tabular-nums">
                      {formatSAR(item.AMOUNT)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-800 font-bold">
                <tr>
                  <td colSpan={4} className="p-2 text-right">
                    إجمالي مبالغ الغرامات المقررة نظاماً:
                  </td>
                  <td className="p-2 text-left font-mono font-bold text-sm text-emerald-900 tabular-nums">
                    {formatSAR(decision.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Instructions & Right of Appeal */}
          <div className="space-y-2 text-[11px] text-slate-600 border-t border-slate-200 pt-3 text-justify">
            <p>
              <span className="font-bold text-slate-900">ثانياً: </span>
              يلتزم الصادر بحقه القرار بسداد الغرامة المقررة عبر الفاتورة الإلكترونية الصادرة على نظام سداد أو منصة سهل خلال المهلة النظامية المحددة.
            </p>
            <p>
              <span className="font-bold text-slate-900">ثالثاً (حق التظلم): </span>
              يحق لمن صدر ضده هذا القرار التظلم منه أمام المحكمة الإدارية (ديوان المظالم) خلال ستين (60) يوماً من تاريخ إبلاغه بالقرار وفقاً لأحكام نظام المرافعات أمام ديوان المظالم.
            </p>
          </div>

          {/* Committee Signatures & QR Verification */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-4 items-end text-xs font-sans text-center">
            <div>
              <div className="font-bold text-slate-900 mb-8">عضو اللجنة</div>
              <div className="text-slate-500 text-[11px]">موقع وموثق إلكترونياً</div>
            </div>
            <div>
              <div className="font-bold text-slate-900 mb-8">عضو اللجنة</div>
              <div className="text-slate-500 text-[11px]">موقع وموثق إلكترونياً</div>
            </div>
            <div>
              <div className="font-bold text-slate-900 mb-8">رئيس اللجنة</div>
              <div className="text-slate-500 text-[11px]">المستشار النظامي للجنة</div>
            </div>

            {/* QR verification seal */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 border border-slate-300 p-1 rounded bg-slate-50 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
              <span className="text-[9px] text-slate-500 mt-1 font-mono">
                صك موثق منصة سهل
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
