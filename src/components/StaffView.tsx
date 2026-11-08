import React, { useState } from 'react';
import { MvcMstaffData, MvcVpiFacility } from '../types/database';
import { Search, Plus, User, UserCheck, Phone, Mail, Building2, Edit, Trash2, X, FileText } from 'lucide-react';

interface StaffViewProps {
  staffList: (MvcMstaffData & { facilityName?: string; decisionsCount?: number })[];
  facilities: MvcVpiFacility[];
  onSaveStaff: (data: Partial<MvcMstaffData>) => Promise<void>;
  onDeleteStaff: (id: number) => Promise<void>;
  onOpenNewDecisionForStaff: (staffId: number) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  facilities,
  onSaveStaff,
  onDeleteStaff,
  onOpenNewDecisionForStaff
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [editingStaff, setEditingStaff] = useState<Partial<MvcMstaffData> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = staffList.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.FULL_NAME.toLowerCase().includes(q) ||
      s.NATIONAL_ID.includes(q) ||
      s.MOBIE_NUM.includes(q) ||
      s.DEGREE.toLowerCase().includes(q);

    const matchesFacility = !selectedFacility || s.FACILILTY_SERIAL === Number(selectedFacility);
    const matchesDegree = !selectedDegree || s.DEGREE.includes(selectedDegree);

    return matchesSearch && matchesFacility && matchesDegree;
  });

  const handleOpenAdd = () => {
    setEditingStaff({
      GENDR: 'ذكر',
      DEGREE: 'طبيب مقيم',
      NATIONALITY: 'سعودي',
      FACILILTY_SERIAL: facilities[0]?.FACILITY_SERIAL || 101,
      JOB_LOCATION: facilities[0]?.FACILITY_NAME || '',
      TYPE_JOB_LOC: 'قطاع صحي خاص',
      CREATE_BY: 'أمين النظام'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: MvcMstaffData) => {
    setEditingStaff({ ...staff });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff?.FULL_NAME || !editingStaff?.NATIONAL_ID) {
      alert('يرجى ملء اسم الممارس ورقم الهوية');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveStaff(editingStaff);
      setIsModalOpen(false);
      setEditingStaff(null);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الممارس');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            سجل الكادر والممارسين الصحيين (MVC_MSTAFF_DATA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل الأطباء والاستشاريين والتمريض والصيادلة المرخصين والقرارات الصادرة بحقهم
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ممارس صحي جديد</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الممارس، رقم الهوية، التخصص، أو الجوال..."
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <select
          value={selectedFacility}
          onChange={e => setSelectedFacility(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
        >
          <option value="">كافة المنشآت الطبية</option>
          {facilities.map(f => (
            <option key={f.FACILITY_SERIAL} value={f.FACILITY_SERIAL}>
              {f.FACILITY_NAME}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(stf => (
          <div
            key={stf.STAFF_SERIAL}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-sky-50 text-sky-800 rounded-md border border-sky-100 mt-0.5">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{stf.FULL_NAME}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-emerald-800">{stf.DEGREE}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">كود: #{stf.STAFF_SERIAL}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(stf)}
                    title="تعديل الممارس"
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteStaff(stf.STAFF_SERIAL)}
                    title="حذف الممارس"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data attributes matching MVC_MSTAFF_DATA */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">الهوية / الإقامة:</span>
                  <span className="font-mono font-medium text-slate-800">{stf.NATIONAL_ID}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الجنسية والجنس:</span>
                  <span className="text-slate-800">{stf.NATIONALITY} ({stf.GENDR})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المنشأة التابع لها:</span>
                  <span className="text-slate-800 truncate block">{stf.facilityName || stf.JOB_LOCATION}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">رقم الجوال:</span>
                  <span className="font-mono text-slate-800">{stf.MOBIE_NUM}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">تاريخ انتهاء ترخيص المزاولة:</span>
                  <span className="font-mono text-slate-700">{stf.LIS_END_DATE || 'ساري'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المدينة:</span>
                  <span className="text-slate-700">{stf.ADD_CITY || 'الرياض'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>القرارات المسجلة: </span>
                <span className="font-mono font-bold text-slate-800">{stf.decisionsCount || 0}</span>
              </div>
              <button
                onClick={() => onOpenNewDecisionForStaff(stf.STAFF_SERIAL)}
                className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
              >
                + إصدار قرار مخالفة لهذا الممارس
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Add/Edit Staff */}
      {isModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStaff.STAFF_SERIAL ? `تعديل الممارس #${editingStaff.STAFF_SERIAL}` : 'إضافة ممارس صحي جديد (MVC_MSTAFF_DATA)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">الاسم الكامل (FULL_NAME) *</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.FULL_NAME || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, FULL_NAME: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="د. ..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم الهوية الوطنية / الإقامة (NATIONAL_ID) *</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.NATIONAL_ID || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, NATIONAL_ID: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="10... / 20..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الدرجة المهنية / التصنيف (DEGREE) *</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.DEGREE || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, DEGREE: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="استشاري جراحة / نائب / أخصائي تمريض..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">المنشأة التابع لها (FACILILTY_SERIAL) *</label>
                  <select
                    value={editingStaff.FACILILTY_SERIAL || facilities[0]?.FACILITY_SERIAL}
                    onChange={e => {
                      const fId = Number(e.target.value);
                      const fac = facilities.find(f => f.FACILITY_SERIAL === fId);
                      setEditingStaff({
                        ...editingStaff,
                        FACILILTY_SERIAL: fId,
                        JOB_LOCATION: fac?.FACILITY_NAME || ''
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {facilities.map(f => (
                      <option key={f.FACILITY_SERIAL} value={f.FACILITY_SERIAL}>
                        {f.FACILITY_NAME}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الجنس (GENDR)</label>
                  <select
                    value={editingStaff.GENDR || 'ذكر'}
                    onChange={e => setEditingStaff({ ...editingStaff, GENDR: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الجنسية (NATIONALITY)</label>
                  <input
                    type="text"
                    value={editingStaff.NATIONALITY || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, NATIONALITY: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="سعودي"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم الجوال (MOBIE_NUM) *</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.MOBIE_NUM || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, MOBIE_NUM: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="05..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">البريد الإلكتروني (EMAIL)</label>
                  <input
                    type="email"
                    value={editingStaff.EMAIL || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, EMAIL: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="dr@..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">تاريخ انتهاء الترخيص (LIS_END_DATE)</label>
                  <input
                    type="date"
                    value={editingStaff.LIS_END_DATE || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, LIS_END_DATE: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">المدينة (ADD_CITY)</label>
                  <input
                    type="text"
                    value={editingStaff.ADD_CITY || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, ADD_CITY: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="الرياض"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded disabled:opacity-50"
                >
                  {isSaving ? 'جارٍ الحفظ...' : 'حفظ بيانات الممارس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
