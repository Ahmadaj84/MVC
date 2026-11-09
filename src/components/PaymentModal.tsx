import React, { useState } from 'react';
import { FullFacDecision, FullStaffDecision } from '../types/database';
import { formatSAR } from '../utils/date';
import { X, CreditCard, CheckCircle2, History, Plus } from 'lucide-react';

interface PaymentModalProps {
  decision: FullFacDecision | FullStaffDecision;
  type: 'facility' | 'staff';
  isOpen: boolean;
  onClose: () => void;
  onRegisterPayment: (id: number, payload: any) => Promise<void>;
}

// Wrapper keeps the early return outside the component that uses hooks
// (calling hooks after a conditional return breaks React's rules of hooks).
export const PaymentModal: React.FC<PaymentModalProps> = props =>
  props.isOpen ? <PaymentModalContent {...props} /> : null;

const PaymentModalContent: React.FC<PaymentModalProps> = ({
  decision,
  type,
  onClose,
  onRegisterPayment
}) => {

  const decisionId = type === 'facility'
    ? (decision as FullFacDecision).DECISION_FAC_ID
    : (decision as FullStaffDecision).DECISION_MSTAFF_ID;

  const remaining = Math.max(0, decision.totalAmount - decision.paidAmount);

  const [receiptAmount, setReceiptAmount] = useState<number>(remaining || 1000);
  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [receiptId, setReceiptId] = useState<string>(
    `REC-SADAD-${Date.now().toString().slice(-6)}`
  );
  const [createdBy, setCreatedBy] = useState<string>('أمين الصندوق والخزينة');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptAmount || receiptAmount <= 0) {
      alert('يرجى تحديد مبلغ سداد صحيح');
      return;
    }
    if (receiptAmount > remaining) {
      alert('المبلغ المدخل يتجاوز المبلغ المتبقي للتحصيل');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegisterPayment(decisionId, {
        RECEIPT_AMOUNT: Number(receiptAmount),
        RECEIPT_DATE: receiptDate,
        RECIPT_ID: receiptId,
        CREATED_BY: createdBy,
        // The staff endpoint expects PEN_DES_MSTAFF_ID; facility expects PEN_DES_FAC_ID.
        [type === 'facility' ? 'PEN_DES_FAC_ID' : 'PEN_DES_MSTAFF_ID']: selectedItemId
          ? Number(selectedItemId)
          : undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(`حدث خطأ أثناء تسجيل السداد: ${(err as Error)?.message || ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">
                تحصيل وسداد الغرامة ({type === 'facility' ? 'MVC_PAYMENT_FAC' : 'MVC_PAYMENT_MSTAFF'})
              </h3>
              <p className="text-[11px] text-slate-400">
                القرار: {decision.DECISION_ID}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Financial Balance Summary */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded text-center text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">إجمالي القرار</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatSAR(decision.totalAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">المحصل سابقاً</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {formatSAR(decision.paidAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">المتبقي للتحصيل</span>
              <span className="font-mono font-bold text-amber-700 tabular-nums">
                {formatSAR(remaining)}
              </span>
            </div>
          </div>

          {/* New Receipt Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>تسجيل إيصال سداد بنكي / سداد جديد</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">المبلغ المسدد بالريال *</label>
                <input
                  type="number"
                  step="100"
                  min="1"
                  max={remaining > 0 ? remaining : undefined}
                  required
                  value={receiptAmount}
                  onChange={e => setReceiptAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono tabular-nums text-left font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">رقم إيصال سداد / البنك (RECIPT_ID) *</label>
                <input
                  type="text"
                  required
                  value={receiptId}
                  onChange={e => setReceiptId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  placeholder="REC-SADAD-..."
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">تاريخ التحصيل (RECEIPT_DATE) *</label>
                <input
                  type="date"
                  required
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">الموظف / المستلم (CREATED_BY)</label>
                <input
                  type="text"
                  value={createdBy}
                  onChange={e => setCreatedBy(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-medium text-slate-700 mb-1">تخصيص البند المسدد (اختياري)</label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">سداد إجمالي للقرار (دون تخصيص بند محدد)</option>
                  {decision.items.map((item, idx) => (
                    <option key={idx} value={(item as any).PEN_DES_FAC_ID || (item as any).PEN_DES_MSTAFF_ID}>
                      بند: {item.PENALTY_NAME} ({formatSAR(item.AMOUNT)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || remaining <= 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded disabled:opacity-50 shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'جارٍ تسجيل الإيصال...' : 'تأكيد وقيد السداد'}</span>
              </button>
            </div>
          </form>

          {/* Previous Receipts Log */}
          {decision.payments && decision.payments.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>سجل الإيصالات السابقة المسجلة للقرار ({decision.payments.length})</span>
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {decision.payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{p.RECIPT_ID}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.RECEIPT_DATE} · بواسطة {p.CREATED_BY}
                      </div>
                    </div>
                    <div className="text-left font-mono font-bold text-emerald-800 tabular-nums">
                      {formatSAR(p.RECEIPT_AMOUNT)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
