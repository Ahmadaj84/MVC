import React, { useState } from 'react';
import { MvcVpiFacility, MvcVpiFacilityType } from '../types/database';
import { Search, Plus, Building2, MapPin, Phone, Mail, FileText, Edit, Trash2, X } from 'lucide-react';

interface FacilitiesViewProps {
  facilities: (MvcVpiFacility & { typeName?: string; decisionsCount?: number })[];
  facilityTypes: MvcVpiFacilityType[];
  onSaveFacility: (data: Partial<MvcVpiFacility>) => Promise<void>;
  onDeleteFacility: (id: number) => Promise<void>;
  onOpenNewDecisionForFacility: (facilityId: number) => void;
}

export const FacilitiesView: React.FC<FacilitiesViewProps> = ({
  facilities,
  facilityTypes,
  onSaveFacility,
  onDeleteFacility,
  onOpenNewDecisionForFacility
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [editingFacility, setEditingFacility] = useState<Partial<MvcVpiFacility> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = facilities.filter(f => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      f.FACILITY_NAME.toLowerCase().includes(q) ||
      f.LICENSE_NUMBER.toLowerCase().includes(q) ||
      f.CR_NO.toLowerCase().includes(q) ||
      f.ADD_CITY.toLowerCase().includes(q) ||
      f.MOBILE.includes(q);

    const matchesType = !selectedType || f.FACILITY_TYPE === Number(selectedType);
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingFacility({
      FACILITY_TYPE: facilityTypes[0]?.FACILITY_TYPE_SN || 1,
      ADD_CITY: 'الرياض',
      PRV_GOV: 'منطقة الرياض',
      CREATE_BY: 'أمين النظام'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac: MvcVpiFacility) => {
    setEditingFacility({ ...fac });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility?.FACILITY_NAME || !editingFacility?.LICENSE_NUMBER) {
      alert('يرجى ملء اسم المنشأة ورقم الترخيص');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveFacility(editingFacility);
      setIsModalOpen(false);
      setEditingFacility(null);
    } catch (err) {
      console.error(err);
      alert(`حدث خطأ أثناء حفظ المنشأة: ${(err as Error)?.message || ''}`);
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
            دليل المنشآت الصحية (MVC_VPI_FACILITIES)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل المستشفيات والمجمعات والمختبرات والصيدليات الخاضعة لرقابة ولجان النظر في المخالفات
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منشأة جديدة</span>
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
            placeholder="بحث باسم المنشأة، رقم الترخيص، السجل التجاري، المدينة..."
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
        >
          <option value="">كافة تصنيفات المنشآت</option>
          {facilityTypes.map(t => (
            <option key={t.FACILITY_TYPE_SN} value={t.FACILITY_TYPE_SN}>
              {t.FACILITY_TYPE_DESC}
            </option>
          ))}
        </select>
      </div>

      {/* Grid Cards of Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(fac => (
          <div
            key={fac.FACILITY_SERIAL}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{fac.FACILITY_NAME}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-emerald-800">{fac.typeName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">كود: #{fac.FACILITY_SERIAL}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(fac)}
                    title="تعديل المنشأة"
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteFacility(fac.FACILITY_SERIAL)}
                    title="حذف المنشأة"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data attributes matching MVC_VPI_FACILITIES */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">رقم ترخيص وزارة الصحة:</span>
                  <span className="font-mono font-medium text-slate-800">{fac.LICENSE_NUMBER}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">رقم السجل التجاري (CR):</span>
                  <span className="font-mono font-medium text-slate-800">{fac.CR_NO}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المنطقة والمدينة:</span>
                  <span className="text-slate-800">{fac.PRV_GOV} - {fac.ADD_CITY}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">رقم الجوال:</span>
                  <span className="font-mono text-slate-800">{fac.MOBILE}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">العنوان الوطني:</span>
                  <span className="text-slate-700">
                    {fac.ADD_DIST}، شارع {fac.ADD_STREET}، مبنى {fac.ADD_BUILD_NO}
                    {fac.ADD_POSTCODE ? ` (الرمز البريدي: ${fac.ADD_POSTCODE})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>القرارات المسجلة: </span>
                <span className="font-mono font-bold text-slate-800">{fac.decisionsCount || 0}</span>
              </div>
              <button
                onClick={() => onOpenNewDecisionForFacility(fac.FACILITY_SERIAL)}
                className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
              >
                + إصدار قرار مخالفة لهذه المنشأة
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Add/Edit Facility */}
      {isModalOpen && editingFacility && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingFacility.FACILITY_SERIAL ? `تعديل المنشأة #${editingFacility.FACILITY_SERIAL}` : 'إضافة منشأة صحية جديدة (MVC_VPI_FACILITIES)'}
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
                  <label className="block font-medium text-slate-700 mb-1">اسم المنشأة *</label>
                  <input
                    type="text"
                    required
                    value={editingFacility.FACILITY_NAME || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, FACILITY_NAME: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="مستشفى / مجمع عيادات..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">نوع المنشأة (FACILITY_TYPE) *</label>
                  <select
                    value={editingFacility.FACILITY_TYPE || 1}
                    onChange={e => setEditingFacility({ ...editingFacility, FACILITY_TYPE: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {facilityTypes.map(t => (
                      <option key={t.FACILITY_TYPE_SN} value={t.FACILITY_TYPE_SN}>
                        {t.FACILITY_TYPE_DESC}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم الترخيص الصحي *</label>
                  <input
                    type="text"
                    required
                    value={editingFacility.LICENSE_NUMBER || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, LICENSE_NUMBER: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="LIC-MOH-2025-..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم السجل التجاري (CR_NO) *</label>
                  <input
                    type="text"
                    required
                    value={editingFacility.CR_NO || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, CR_NO: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="1010..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم الجوال (MOBILE) *</label>
                  <input
                    type="text"
                    required
                    value={editingFacility.MOBILE || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, MOBILE: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="050..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">البريد الإلكتروني (EMAIL)</label>
                  <input
                    type="email"
                    value={editingFacility.EMAIL || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, EMAIL: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="info@..."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">المحافظة / المنطقة (PRV_GOV)</label>
                  <input
                    type="text"
                    value={editingFacility.PRV_GOV || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, PRV_GOV: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="منطقة الرياض"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">المدينة (ADD_CITY)</label>
                  <input
                    type="text"
                    value={editingFacility.ADD_CITY || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, ADD_CITY: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="الرياض"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الحي (ADD_DIST)</label>
                  <input
                    type="text"
                    value={editingFacility.ADD_DIST || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, ADD_DIST: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="حي العليا"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الشارع (ADD_STREET)</label>
                  <input
                    type="text"
                    value={editingFacility.ADD_STREET || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, ADD_STREET: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="طريق الملك فهد"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رقم المبنى (ADD_BUILD_NO)</label>
                  <input
                    type="text"
                    value={editingFacility.ADD_BUILD_NO || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, ADD_BUILD_NO: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="1234"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الرمز البريدي (ADD_POSTCODE)</label>
                  <input
                    type="text"
                    value={editingFacility.ADD_POSTCODE || ''}
                    onChange={e => setEditingFacility({ ...editingFacility, ADD_POSTCODE: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="12345"
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
                  {isSaving ? 'جارٍ الحفظ...' : 'حفظ بيانات المنشأة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
