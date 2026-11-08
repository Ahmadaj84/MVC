import React, { useState } from 'react';
import { Database, Image as ImageIcon, Code2, Server, Check, Copy, Terminal, ShieldAlert } from 'lucide-react';
import { ORACLE_19C_DDL, ORACLE_19C_NODE_CONNECTOR } from '../server/oracleDdl';

export const ErdViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'diagram' | 'oracle-ddl' | 'oracle-node' | 'nuxt'>('diagram');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const tables = [
    {
      name: 'MVC_VPI_FACILITIES',
      label: 'جدول المنشآت الصحية',
      pk: 'FACILITY_SERIAL (NUMBER)',
      fks: ['FACILITY_TYPE -> MVC_VPI_FACILTIES_TYPES'],
      description: 'يحوي كافة بيانات المنشأة (الاسم، السجل التجاري CR، رقم الترخيص، الجوال، العنوان الوطني، المنطقة).'
    },
    {
      name: 'MVC_VPI_FACILTIES_TYPES',
      label: 'جدول أنواع المنشآت',
      pk: 'FACILITY_TYPE_SN (NUMBER)',
      fks: [],
      description: 'جدول ترميزي ثابت لتصنيفات المنشآت (مستشفى عام، مجمع عيادات، صيدلية، مختبر، مركز أشعة).'
    },
    {
      name: 'MVC_MSTAFF_DATA',
      label: 'جدول الكادر والممارسين الصحيين',
      pk: 'STAFF_SERIAL (NUMBER)',
      fks: ['FACILILTY_SERIAL -> MVC_VPI_FACILITIES'],
      description: 'بيانات الأطباء والممارسين، الهوية الوطنية، التصنيف والدرجة المهنية، تاريخ انتهاء الترخيص، والمنشأة التابع لها.'
    },
    {
      name: 'MVC_PENAITY_ARTICAL',
      label: 'جدول لائحة ومواد المخالفات الثابتة',
      pk: 'ARTICAL_ID (NUMBER)',
      fks: [],
      description: 'جدول ثابت لمواد المخالفات، الوصف النظامي، والتصنيف (منشآت / ممارسين / مشترك).'
    },
    {
      name: 'MVC_FAC_DECISION',
      label: 'جدول قرارات مخالفات المنشآت',
      pk: 'DECISION_FAC_ID (NUMBER)',
      fks: ['FACILITIE_ID -> MVC_VPI_FACILITIES'],
      description: 'رأس قرار المخالفة للمنشأة، رقم القرار، تواريخ الهجري والميلادي، مرجع منصة سهل، والإدارة المصدرة، وحالة السداد.'
    },
    {
      name: 'MVC_PENALTY_DES_FAC',
      label: 'جدول بنود المخالفات للمنشأة',
      pk: 'PEN_DES_FAC_ID (NUMBER)',
      fks: ['DECISION_ID -> MVC_FAC_DECISION', 'ARTICAL_ID -> MVC_PENAITY_ARTICAL'],
      description: 'تفاصيل البنود المتعددة داخل قرار المنشأة، مبالغ الغرامة، ونوع الجزاء المقبول.'
    },
    {
      name: 'MVC_FAC_SMS',
      label: 'جدول أرشيف رسائل المنشآت السابقة',
      pk: 'SMS_ID (NUMBER)',
      fks: ['DECISION_FAC_ID -> MVC_FAC_DECISION'],
      description: 'أرشيف الرسائل السابقة المحفوظة في Oracle (الإشعار الأول والتذكير، GUID، والتسليم). تم إيقاف الإرسال التلقائي حسب الطلب.'
    },
    {
      name: 'MVC_PAYMENT_FAC',
      label: 'جدول سدادات وتحصيل المنشآت',
      pk: 'PAYMENT_ID (NUMBER)',
      fks: ['DECISION_ID -> MVC_FAC_DECISION', 'PEN_DES_FAC_ID -> MVC_PENALTY_DES_FAC'],
      description: 'تسجيل إيصالات التحصيل البنكي وسداد، مبالغ السداد، وتحديث حالة القرار إلى مسدد بالكامل.'
    },
    {
      name: 'MVC_MSTAFF_DECISION',
      label: 'جدول قرارات مخالفات الممارسين',
      pk: 'DECISION_MSTAFF_ID (NUMBER)',
      fks: ['MSTAFF_ID -> MVC_MSTAFF_DATA'],
      description: 'رأس قرار المخالفة للممارس الصحي، لجنة النظر، رقم وتاريخ القرار، منصة سهل، وحالة السداد.'
    },
    {
      name: 'MVC_PENALTY_DES_MSTAFF',
      label: 'جدول بنود المخالفات للممارس',
      pk: 'PEN_DES_MSTAFF_ID (NUMBER)',
      fks: ['DECISION_ID -> MVC_MSTAFF_DECISION', 'ARTICAL_ID -> MVC_PENAITY_ARTICAL'],
      description: 'بنود العقوبات والغرامات المترتبة على الممارس الصحي المرتبطة بمواد اللائحة.'
    },
    {
      name: 'MVC_MSTAFF_SMS',
      label: 'جدول أرشيف رسائل الممارسين السابقة',
      pk: 'SMS_ID (NUMBER)',
      fks: ['DECISION_MSTAFF_ID -> MVC_MSTAFF_DECISION'],
      description: 'أرشيف رسائل وتذكيرات الممارسين الصحيين المسجلة في Oracle 19c (للعرض والتدقيق فقط دون إرسال).'
    },
    {
      name: 'MVC_PAYMENT_MSTAFF',
      label: 'جدول سدادات وتحصيل الممارسين',
      pk: 'PAYMENT_ID (NUMBER)',
      fks: ['DECISION_ID -> MVC_MSTAFF_DECISION', 'PEN_DES_MSTAFF_ID -> MVC_PENALTY_DES_MSTAFF'],
      description: 'تسجيل مبالغ السداد وإيصالات تسوية مخالفات الممارسين الصحيين.'
    }
  ];

  const nuxtCodeSnippet = `// Nuxt 3 / Vue 3 Composable: composables/useDecisions.ts
export const useDecisions = () => {
  const config = useRuntimeConfig();
  const apiBase = '/api'; // Node.js Express REST Backend connected to Oracle 19c

  // 1. استرجاع قرارات المنشآت مع البنود وأرشيف الرسائل السابقة والتحصيل
  const fetchFacilityDecisions = async (params = {}) => {
    return await $fetch(\`\${apiBase}/facility-decisions\`, {
      params,
      headers: { 'Accept': 'application/json' }
    });
  };

  // 2. إصدار قرار منشأة جديد مع بنود المخالفات (MVC_PENALTY_DES_FAC)
  const createFacilityDecision = async (decisionPayload) => {
    return await $fetch(\`\${apiBase}/facility-decisions\`, {
      method: 'POST',
      body: decisionPayload
    });
  };

  // 3. قيد وتسجيل إيصال سداد (MVC_PAYMENT_FAC)
  const registerPayment = async (decisionId, paymentData) => {
    return await $fetch(\`\${apiBase}/facility-decisions/\${decisionId}/payments\`, {
      method: 'POST',
      body: paymentData
    });
  };

  return {
    fetchFacilityDecisions,
    createFacilityDecision,
    registerPayment
  };
};`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">
                مخطط قاعدة بيانات Oracle Database 19c وتكامل Node.js / Nuxt 3
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              تم إعداد النظام ليتوافق 100% مع بيئة قواعد بيانات <span className="font-bold text-slate-800 font-mono">Oracle 19c (19g)</span>، مع إيقاف خدمة الإرسال الفوري للرسائل النصية والاكتفاء باستعراض الأرشيف السابق المحفوظ في الجداول.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded font-semibold">
              Oracle 19c Enterprise
            </span>
            <span className="text-xs font-mono px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded font-medium">
              12 Tables
            </span>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('diagram')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'diagram'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            مخطط الـ ERD والجداول الـ 12
          </button>
          <button
            onClick={() => setActiveSubTab('oracle-ddl')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'oracle-ddl'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            سكربت إنشاء جداول Oracle 19c (DDL)
          </button>
          <button
            onClick={() => setActiveSubTab('oracle-node')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'oracle-node'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            اتصال Node.js مع Oracle 19c
          </button>
          <button
            onClick={() => setActiveSubTab('nuxt')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'nuxt'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            تكامل Vue 3 / Nuxt 3 Composables
          </button>
        </div>
      </div>

      {/* Tab 1: Diagram & Tables */}
      {activeSubTab === 'diagram' && (
        <div className="space-y-5">
          {/* Embedded ERD Image */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  المخطط البياني المرفق (رسمة MVC_DB)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                /public/assets/aistudio/MVC_DB_8cf91aba.jpeg
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-950 p-2 text-center">
              <img
                src="/assets/aistudio/MVC_DB_8cf91aba.jpeg"
                alt="مخطط قاعدة بيانات MVC_DB لقرارات المخالفات"
                className="w-full max-h-[600px] object-contain mx-auto rounded"
              />
            </div>
          </div>

          {/* 12 Tables Breakdown */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
              جداول المنظومة الـ 12 المطبقة على Oracle 19c
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map(t => (
                <div
                  key={t.name}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-800">{t.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {t.pk}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{t.label}</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{t.description}</p>
                  {t.fks.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                      {t.fks.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Oracle 19c DDL */}
      {activeSubTab === 'oracle-ddl' && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>سكربت إنشاء جداول وتسلسلات Oracle Database 19c (DDL SQL)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يمكن تنفيذ هذا السكربت مباشرة في Oracle SQL Developer أو SQL*Plus أو PL/SQL Developer لإنشاء كافة الجداول والقيود.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(ORACLE_19C_DDL, 'oracle-ddl')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
            >
              {copiedCode === 'oracle-ddl' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم نسخ سكربت Oracle!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ سكربت Oracle DDL</span>
                </>
              )}
            </button>
          </div>

          <pre
            className="p-4 bg-slate-950 rounded-md overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed text-left max-h-[500px]"
            dir="ltr"
          >
            {ORACLE_19C_DDL}
          </pre>
        </div>
      )}

      {/* Tab 3: Node.js Oracle 19c Connection */}
      {activeSubTab === 'oracle-node' && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>إعداد مجمع اتصالات Node.js مع Oracle 19c (node-oracledb)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يدعم محرك oracledb في الإصدارات الحديثة مع Oracle 19c وضع Thin Mode مباشرة دون الحاجة لتثبيت Oracle Instant Client.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(ORACLE_19C_NODE_CONNECTOR, 'oracle-node')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
            >
              {copiedCode === 'oracle-node' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ كود الاتصال</span>
                </>
              )}
            </button>
          </div>

          <pre
            className="p-4 bg-slate-950 rounded-md overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed text-left max-h-[450px]"
            dir="ltr"
          >
            {ORACLE_19C_NODE_CONNECTOR}
          </pre>
        </div>
      )}

      {/* Tab 4: Vue 3 / Nuxt 3 */}
      {activeSubTab === 'nuxt' && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>تكامل Vue 3 / Nuxt 3 مع Node.js REST API</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                كود Nuxt 3 Composable جاهز للاستخدام لربط واجهة Nuxt مباشرة مع خادم الـ API وقاعدة بيانات Oracle 19c.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(nuxtCodeSnippet, 'nuxt-code')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
            >
              {copiedCode === 'nuxt-code' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ كود Nuxt</span>
                </>
              )}
            </button>
          </div>

          <pre
            className="p-4 bg-slate-950 rounded-md overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed text-left max-h-[450px]"
            dir="ltr"
          >
            {nuxtCodeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
