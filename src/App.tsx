/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api, DashboardStats } from './services/api';
import {
  FullFacDecision,
  FullStaffDecision,
  MvcVpiFacility,
  MvcVpiFacilityType,
  MvcMstaffData,
  MvcPenaltyArtical
} from './types/database';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FacilityDecisionsView } from './components/FacilityDecisionsView';
import { StaffDecisionsView } from './components/StaffDecisionsView';
import { FacilitiesView } from './components/FacilitiesView';
import { StaffView } from './components/StaffView';
import { ArticlesView } from './components/ArticlesView';
import { DecisionModal } from './components/DecisionModal';
import { DecisionPrintView } from './components/DecisionPrintView';
import { SmsTrackingModal } from './components/SmsTrackingModal';
import { PaymentModal } from './components/PaymentModal';
import { ErdViewer } from './components/ErdViewer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // System Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [facilityDecisions, setFacilityDecisions] = useState<FullFacDecision[]>([]);
  const [staffDecisions, setStaffDecisions] = useState<FullStaffDecision[]>([]);
  const [facilities, setFacilities] = useState<MvcVpiFacility[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<MvcVpiFacilityType[]>([]);
  const [staffList, setStaffList] = useState<MvcMstaffData[]>([]);
  const [articles, setArticles] = useState<MvcPenaltyArtical[]>([]);

  // Modals state
  const [decisionModalState, setDecisionModalState] = useState<{
    isOpen: boolean;
    type: 'facility' | 'staff';
    decision?: FullFacDecision | FullStaffDecision | null;
  }>({ isOpen: false, type: 'facility', decision: null });

  const [printState, setPrintState] = useState<{
    isOpen: boolean;
    type: 'facility' | 'staff';
    decision: FullFacDecision | FullStaffDecision | null;
  }>({ isOpen: false, type: 'facility', decision: null });

  const [smsModalState, setSmsModalState] = useState<{
    isOpen: boolean;
    type: 'facility' | 'staff';
    decision: FullFacDecision | FullStaffDecision | null;
  }>({ isOpen: false, type: 'facility', decision: null });

  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    type: 'facility' | 'staff';
    decision: FullFacDecision | FullStaffDecision | null;
  }>({ isOpen: false, type: 'facility', decision: null });

  // Fetch all core system data
  const loadAllData = useCallback(async () => {
    try {
      const [
        fetchedStats,
        fetchedFacDecisions,
        fetchedStaffDecisions,
        fetchedFacilities,
        fetchedTypes,
        fetchedStaff,
        fetchedArticles
      ] = await Promise.all([
        api.getStats(),
        api.getFacilityDecisions(),
        api.getStaffDecisions(),
        api.getFacilities(),
        api.getFacilityTypes(),
        api.getStaff(),
        api.getArticles()
      ]);

      setStats(fetchedStats);
      setFacilityDecisions(fetchedFacDecisions);
      setStaffDecisions(fetchedStaffDecisions);
      setFacilities(fetchedFacilities);
      setFacilityTypes(fetchedTypes);
      setStaffList(fetchedStaff);
      setArticles(fetchedArticles);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers for Decisions
  const handleOpenNewDecision = (type: 'facility' | 'staff') => {
    setDecisionModalState({
      isOpen: true,
      type,
      decision: null
    });
  };

  const handleEditFacilityDecision = (decision: FullFacDecision) => {
    setDecisionModalState({
      isOpen: true,
      type: 'facility',
      decision
    });
  };

  const handleEditStaffDecision = (decision: FullStaffDecision) => {
    setDecisionModalState({
      isOpen: true,
      type: 'staff',
      decision
    });
  };

  const handleSaveDecision = async (payload: { decision: any; items: any[] }) => {
    if (decisionModalState.type === 'facility') {
      if (decisionModalState.decision) {
        await api.updateFacilityDecision(
          (decisionModalState.decision as FullFacDecision).DECISION_FAC_ID,
          payload
        );
      } else {
        await api.createFacilityDecision(payload);
      }
    } else {
      if (decisionModalState.decision) {
        await api.updateStaffDecision(
          (decisionModalState.decision as FullStaffDecision).DECISION_MSTAFF_ID,
          payload
        );
      } else {
        await api.createStaffDecision(payload);
      }
    }
    await loadAllData();
  };

  const handleDeleteFacilityDecision = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف قرار المنشأة وبنوده؟')) return;
    await api.deleteFacilityDecision(id);
    await loadAllData();
  };

  const handleDeleteStaffDecision = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف قرار الممارس وبنوده؟')) return;
    await api.deleteStaffDecision(id);
    await loadAllData();
  };

  // Payment handler
  const handleRegisterPayment = async (id: number, payload: any) => {
    if (paymentModalState.type === 'facility') {
      await api.registerFacilityPayment(id, payload);
    } else {
      await api.registerStaffPayment(id, payload);
    }
    await loadAllData();
  };

  // Facilities Handlers
  const handleSaveFacility = async (data: Partial<MvcVpiFacility>) => {
    if (data.FACILITY_SERIAL) {
      await api.updateFacility(data.FACILITY_SERIAL, data);
    } else {
      await api.createFacility(data);
    }
    await loadAllData();
  };

  const handleDeleteFacility = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;
    await api.deleteFacility(id);
    await loadAllData();
  };

  // Staff Handlers
  const handleSaveStaff = async (data: Partial<MvcMstaffData>) => {
    if (data.STAFF_SERIAL) {
      await api.updateStaff(data.STAFF_SERIAL, data);
    } else {
      await api.createStaff(data);
    }
    await loadAllData();
  };

  const handleDeleteStaff = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الممارس؟')) return;
    await api.deleteStaff(id);
    await loadAllData();
  };

  // Articles Handlers
  const handleSaveArticle = async (data: Partial<MvcPenaltyArtical>) => {
    if (data.ARTICAL_ID) {
      await api.updateArticle(data.ARTICAL_ID, data);
    } else {
      await api.createArticle(data);
    }
    await loadAllData();
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    await api.deleteArticle(id);
    await loadAllData();
  };

  // Reset database to initial seed
  const handleResetDb = async () => {
    if (!window.confirm('هل ترغب بإعادة تعيين قاعدة البيانات إلى البيانات النموذجية الأصلية؟')) return;
    setIsResetting(true);
    try {
      await api.resetDatabase();
      await loadAllData();
    } catch (err) {
      console.error(err);
      alert('فشل في إعادة ضبط البيانات');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
          <p className="text-xs font-semibold text-slate-700">
            جارٍ تشغيل خادم MVC_DB وتحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-row text-slate-900 font-sans" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stats={stats ? {
          facDecisionsCount: stats.facDecisionsCount,
          staffDecisionsCount: stats.staffDecisionsCount,
          facilitiesCount: stats.facilitiesCount,
          staffCount: stats.staffCount,
          articlesCount: stats.articlesCount
        } : undefined}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenNewDecision={handleOpenNewDecision}
          onResetDb={handleResetDb}
          isResetting={isResetting}
        />

        {/* Tab View Canvas */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              facilityDecisions={facilityDecisions}
              staffDecisions={staffDecisions}
              onOpenNewDecision={handleOpenNewDecision}
              onSelectDecision={(dec, type) => {
                if (type === 'facility') {
                  setCurrentTab('facility-decisions');
                } else {
                  setCurrentTab('staff-decisions');
                }
              }}
              onPrintDecision={(dec, type) => {
                setPrintState({ isOpen: true, type, decision: dec });
              }}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'facility-decisions' && (
            <FacilityDecisionsView
              decisions={facilityDecisions}
              facilities={facilities}
              onOpenNew={() => handleOpenNewDecision('facility')}
              onEdit={handleEditFacilityDecision}
              onDelete={handleDeleteFacilityDecision}
              onPrint={dec => setPrintState({ isOpen: true, type: 'facility', decision: dec })}
              onOpenSms={dec => setSmsModalState({ isOpen: true, type: 'facility', decision: dec })}
              onOpenPayment={dec => setPaymentModalState({ isOpen: true, type: 'facility', decision: dec })}
            />
          )}

          {currentTab === 'staff-decisions' && (
            <StaffDecisionsView
              decisions={staffDecisions}
              staffList={staffList}
              onOpenNew={() => handleOpenNewDecision('staff')}
              onEdit={handleEditStaffDecision}
              onDelete={handleDeleteStaffDecision}
              onPrint={dec => setPrintState({ isOpen: true, type: 'staff', decision: dec })}
              onOpenSms={dec => setSmsModalState({ isOpen: true, type: 'staff', decision: dec })}
              onOpenPayment={dec => setPaymentModalState({ isOpen: true, type: 'staff', decision: dec })}
            />
          )}

          {currentTab === 'facilities' && (
            <FacilitiesView
              facilities={facilities}
              facilityTypes={facilityTypes}
              onSaveFacility={handleSaveFacility}
              onDeleteFacility={handleDeleteFacility}
              onOpenNewDecisionForFacility={facId => {
                setDecisionModalState({
                  isOpen: true,
                  type: 'facility',
                  decision: null
                });
              }}
            />
          )}

          {currentTab === 'staff' && (
            <StaffView
              staffList={staffList}
              facilities={facilities}
              onSaveStaff={handleSaveStaff}
              onDeleteStaff={handleDeleteStaff}
              onOpenNewDecisionForStaff={staffId => {
                setDecisionModalState({
                  isOpen: true,
                  type: 'staff',
                  decision: null
                });
              }}
            />
          )}

          {currentTab === 'articles' && (
            <ArticlesView
              articles={articles}
              onSaveArticle={handleSaveArticle}
              onDeleteArticle={handleDeleteArticle}
            />
          )}

          {currentTab === 'erd' && <ErdViewer />}
        </main>
      </div>

      {/* Decision Modal (Add / Edit) */}
      {decisionModalState.isOpen && (
        <DecisionModal
          type={decisionModalState.type}
          initialDecision={decisionModalState.decision}
          facilities={facilities}
          staffList={staffList}
          articles={articles}
          isOpen={decisionModalState.isOpen}
          onClose={() => setDecisionModalState(prev => ({ ...prev, isOpen: false, decision: null }))}
          onSubmit={handleSaveDecision}
        />
      )}

      {/* Decision Print View */}
      {printState.isOpen && printState.decision && (
        <DecisionPrintView
          decision={printState.decision}
          type={printState.type}
          onClose={() => setPrintState({ isOpen: false, type: 'facility', decision: null })}
        />
      )}

      {/* SMS Historical Archive Modal */}
      {smsModalState.isOpen && smsModalState.decision && (
        <SmsTrackingModal
          decision={smsModalState.decision}
          type={smsModalState.type}
          isOpen={smsModalState.isOpen}
          onClose={() => setSmsModalState({ isOpen: false, type: 'facility', decision: null })}
        />
      )}

      {/* Payment Receipt Modal */}
      {paymentModalState.isOpen && paymentModalState.decision && (
        <PaymentModal
          decision={paymentModalState.decision}
          type={paymentModalState.type}
          isOpen={paymentModalState.isOpen}
          onClose={() => setPaymentModalState({ isOpen: false, type: 'facility', decision: null })}
          onRegisterPayment={handleRegisterPayment}
        />
      )}
    </div>
  );
}
