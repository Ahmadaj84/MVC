import React, { useState } from 'react';
import { MvcPenaltyArtical } from '../types/database';
import { Search, Plus, FileSpreadsheet, Edit, Trash2, X, Tag } from 'lucide-react';

interface ArticlesViewProps {
  articles: MvcPenaltyArtical[];
  onSaveArticle: (data: Partial<MvcPenaltyArtical>) => Promise<void>;
  onDeleteArticle: (id: number) => Promise<void>;
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({
  articles,
  onSaveArticle,
  onDeleteArticle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [editingArticle, setEditingArticle] = useState<Partial<MvcPenaltyArtical> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = articles.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      a.ARTICAL_NAME.toLowerCase().includes(q) ||
      a.ARTICAL_DISCRIPTION.toLowerCase().includes(q);

    const matchesType = !selectedType || a.ARTICAL_TYPE === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingArticle({
      ARTICAL_TYPE: 'منشآت'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (art: MvcPenaltyArtical) => {
    setEditingArticle({ ...art });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.ARTICAL_NAME || !editingArticle?.ARTICAL_DISCRIPTION) {
      alert('يرجى كتابة اسم ووصف المادة المخالفة');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveArticle(editingArticle);
      setIsModalOpen(false);
      setEditingArticle(null);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ مادة المخالفة');
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
            لائحة ومواد المخالفات النظامية (MVC_PENAITY_ARTICAL)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            جدول مرجعي ثابت لأنواع ومواد المخالفات المعتمدة نظاماً للمنشآت والممارسين الصحيين
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة مخالفة جديدة</span>
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
            placeholder="بحث في اسم المادة أو النص والتكييف النظامي..."
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
        >
          <option value="">كافة تصنيفات المواد</option>
          <option value="منشآت">مخالفات المنشآت</option>
          <option value="ممارسين">مخالفات الممارسين</option>
          <option value="مشترك">مخالفات مشتركة</option>
        </select>
      </div>

      {/* Articles Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(art => (
          <div
            key={art.ARTICAL_ID}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 mt-0.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{art.ARTICAL_NAME}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono tabular-nums text-slate-700 font-semibold">مادة #{art.ARTICAL_ID}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-800 font-medium">نطاق التطبيق: {art.ARTICAL_TYPE}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(art)}
                    title="تعديل المادة"
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteArticle(art.ARTICAL_ID)}
                    title="حذف المادة"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                <p>{art.ARTICAL_DISCRIPTION}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>MVC_PENAITY_ARTICAL</span>
              <span>FK linked in MVC_PENALTY_DES_FAC / MSTAFF</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Add/Edit Article */}
      {isModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingArticle.ARTICAL_ID ? `تعديل المادة #${editingArticle.ARTICAL_ID}` : 'إضافة مادة مخالفة جديدة (MVC_PENAITY_ARTICAL)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">اسم المادة / المخالفة (ARTICAL_NAME) *</label>
                  <input
                    type="text"
                    required
                    value={editingArticle.ARTICAL_NAME || ''}
                    onChange={e => setEditingArticle({ ...editingArticle, ARTICAL_NAME: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    placeholder="المادة (20) - تشغيل كوادر غير مرخصة"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">نوع المادة (ARTICAL_TYPE) *</label>
                  <select
                    value={editingArticle.ARTICAL_TYPE || 'منشآت'}
                    onChange={e => setEditingArticle({ ...editingArticle, ARTICAL_TYPE: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="منشآت">منشآت</option>
                    <option value="ممارسين">ممارسين</option>
                    <option value="مشترك">مشترك</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">الوصف والتكييف النظامي (ARTICAL_DISCRIPTION) *</label>
                  <textarea
                    rows={4}
                    required
                    value={editingArticle.ARTICAL_DISCRIPTION || ''}
                    onChange={e => setEditingArticle({ ...editingArticle, ARTICAL_DISCRIPTION: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none leading-relaxed"
                    placeholder="نص المادة وتفاصيل المخالفة..."
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
                  {isSaving ? 'جارٍ الحفظ...' : 'حفظ المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
