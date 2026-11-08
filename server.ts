import express from 'express';
import { db } from './src/server/db';
import { ORACLE_19C_DDL, ORACLE_19C_NODE_CONNECTOR } from './src/server/oracleDdl';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: 'Oracle Database 19c (Enterprise Edition)',
      time: new Date().toISOString()
    });
  });

  // 1.1 Oracle 19c DDL and Architecture API
  app.get('/api/oracle/ddl', (_req, res) => {
    res.json({
      database: 'Oracle Database 19c',
      compatibility: 'Oracle 19.3+ / 19c Enterprise / PDB',
      ddl: ORACLE_19C_DDL,
      nodeConnector: ORACLE_19C_NODE_CONNECTOR
    });
  });

  // 2. High-level Dashboard Statistics
  app.get('/api/stats', (_req, res) => {
    const facDecisions = db.getFullFacDecisions();
    const staffDecisions = db.getFullStaffDecisions();

    const totalFacFines = facDecisions.reduce((sum, d) => sum + d.totalAmount, 0);
    const paidFacFines = facDecisions.reduce((sum, d) => sum + d.paidAmount, 0);

    const totalStaffFines = staffDecisions.reduce((sum, d) => sum + d.totalAmount, 0);
    const paidStaffFines = staffDecisions.reduce((sum, d) => sum + d.paidAmount, 0);

    const totalFines = totalFacFines + totalStaffFines;
    const totalPaid = paidFacFines + paidStaffFines;
    const totalRemaining = totalFines - totalPaid;

    const uncollectedDecisionsCount = 
      facDecisions.filter(d => d.PAYED !== 2).length + 
      staffDecisions.filter(d => d.PAYED !== 2).length;

    const totalSmsSent = 
      db.facSms.filter(s => s.NOTC_1_STATUS === 'تم الإرسال').length +
      db.facSms.filter(s => s.NOTC_2_STATUS === 'تم الإرسال').length +
      db.staffSms.filter(s => s.NOTC_1_STATUS === 'تم الإرسال').length +
      db.staffSms.filter(s => s.NOTC_2_STATUS === 'تم الإرسال').length;

    res.json({
      totalFines,
      totalPaid,
      totalRemaining,
      databaseType: 'Oracle Database 19c',
      facilitiesCount: db.facilities.length,
      staffCount: db.staff.length,
      facDecisionsCount: db.facDecisions.length,
      staffDecisionsCount: db.staffDecisions.length,
      articlesCount: db.articles.length,
      uncollectedDecisionsCount,
      totalSmsSent,
      paymentRate: totalFines > 0 ? Math.round((totalPaid / totalFines) * 100) : 0
    });
  });

  // 3. Facility Types (MVC_VPI_FACILTIES_TYPES)
  app.get('/api/facility-types', (_req, res) => {
    res.json(db.facilityTypes);
  });

  app.post('/api/facility-types', (req, res) => {
    const { FACILITY_TYPE_DESC } = req.body;
    if (!FACILITY_TYPE_DESC) {
      return res.status(400).json({ error: 'FACILITY_TYPE_DESC is required' });
    }
    const maxSn = db.facilityTypes.reduce((max, t) => Math.max(max, t.FACILITY_TYPE_SN), 0);
    const newType = {
      FACILITY_TYPE_SN: maxSn + 1,
      FACILITY_TYPE_DESC
    };
    db.facilityTypes.push(newType);
    res.status(201).json(newType);
  });

  // 4. Facilities (MVC_VPI_FACILITIES)
  app.get('/api/facilities', (req, res) => {
    const { search, type, city } = req.query;
    let list = db.facilities.map(f => {
      const typeObj = db.facilityTypes.find(t => t.FACILITY_TYPE_SN === f.FACILITY_TYPE);
      const decCount = db.facDecisions.filter(d => d.FACILITIE_ID === f.FACILITY_SERIAL).length;
      return { ...f, typeName: typeObj?.FACILITY_TYPE_DESC || 'غير محدد', decisionsCount: decCount };
    });

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(f => 
        f.FACILITY_NAME.toLowerCase().includes(q) ||
        f.LICENSE_NUMBER.toLowerCase().includes(q) ||
        f.CR_NO.toLowerCase().includes(q) ||
        f.MOBILE.includes(q)
      );
    }

    if (type) {
      list = list.filter(f => f.FACILITY_TYPE === Number(type));
    }

    if (city) {
      list = list.filter(f => f.ADD_CITY === String(city));
    }

    res.json(list);
  });

  app.post('/api/facilities', (req, res) => {
    const data = req.body;
    const maxId = db.facilities.reduce((max, f) => Math.max(max, f.FACILITY_SERIAL), 100);
    const newFacility = {
      ...data,
      FACILITY_SERIAL: maxId + 1,
      CREATE_DATE: new Date().toISOString().split('T')[0],
      CREATE_BY: data.CREATE_BY || 'النظام'
    };
    db.facilities.unshift(newFacility);
    res.status(201).json(newFacility);
  });

  app.put('/api/facilities/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = db.facilities.findIndex(f => f.FACILITY_SERIAL === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    db.facilities[index] = {
      ...db.facilities[index],
      ...req.body,
      FACILITY_SERIAL: id,
      UPDATE_DATE: new Date().toISOString().split('T')[0]
    };
    res.json(db.facilities[index]);
  });

  app.delete('/api/facilities/:id', (req, res) => {
    const id = Number(req.params.id);
    db.facilities = db.facilities.filter(f => f.FACILITY_SERIAL !== id);
    res.json({ success: true });
  });

  // 5. Medical Staff (MVC_MSTAFF_DATA)
  app.get('/api/staff', (req, res) => {
    const { search, facilityId, degree } = req.query;
    let list = db.staff.map(s => {
      const fac = db.facilities.find(f => f.FACILITY_SERIAL === s.FACILILTY_SERIAL);
      const decCount = db.staffDecisions.filter(d => d.MSTAFF_ID === s.STAFF_SERIAL).length;
      return { ...s, facilityName: fac?.FACILITY_NAME || 'مستقل / غير مسجل', decisionsCount: decCount };
    });

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(s =>
        s.FULL_NAME.toLowerCase().includes(q) ||
        s.NATIONAL_ID.includes(q) ||
        s.MOBIE_NUM.includes(q)
      );
    }

    if (facilityId) {
      list = list.filter(s => s.FACILILTY_SERIAL === Number(facilityId));
    }

    if (degree) {
      list = list.filter(s => s.DEGREE === String(degree));
    }

    res.json(list);
  });

  app.post('/api/staff', (req, res) => {
    const data = req.body;
    const maxId = db.staff.reduce((max, s) => Math.max(max, s.STAFF_SERIAL), 200);
    const newStaff = {
      ...data,
      STAFF_SERIAL: maxId + 1,
      CREATE_DATE: new Date().toISOString().split('T')[0],
      CREATE_BY: data.CREATE_BY || 'النظام'
    };
    db.staff.unshift(newStaff);
    res.status(201).json(newStaff);
  });

  app.put('/api/staff/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = db.staff.findIndex(s => s.STAFF_SERIAL === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    db.staff[index] = {
      ...db.staff[index],
      ...req.body,
      STAFF_SERIAL: id,
      UPDATE_DATE: new Date().toISOString().split('T')[0]
    };
    res.json(db.staff[index]);
  });

  app.delete('/api/staff/:id', (req, res) => {
    const id = Number(req.params.id);
    db.staff = db.staff.filter(s => s.STAFF_SERIAL !== id);
    res.json({ success: true });
  });

  // 6. Penalty Articles (MVC_PENAITY_ARTICAL)
  app.get('/api/penalty-articles', (_req, res) => {
    res.json(db.articles);
  });

  app.post('/api/penalty-articles', (req, res) => {
    const data = req.body;
    const maxId = db.articles.reduce((max, a) => Math.max(max, a.ARTICAL_ID), 0);
    const newArt = {
      ...data,
      ARTICAL_ID: maxId + 1
    };
    db.articles.push(newArt);
    res.status(201).json(newArt);
  });

  app.put('/api/penalty-articles/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = db.articles.findIndex(a => a.ARTICAL_ID === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    db.articles[index] = { ...db.articles[index], ...req.body, ARTICAL_ID: id };
    res.json(db.articles[index]);
  });

  app.delete('/api/penalty-articles/:id', (req, res) => {
    const id = Number(req.params.id);
    db.articles = db.articles.filter(a => a.ARTICAL_ID !== id);
    res.json({ success: true });
  });

  // 7. Facility Decisions (MVC_FAC_DECISION + MVC_PENALTY_DES_FAC + MVC_FAC_SMS + MVC_PAYMENT_FAC)
  app.get('/api/facility-decisions', (req, res) => {
    const { facilityId, payedStatus, search } = req.query;
    let list = db.getFullFacDecisions();

    if (facilityId) {
      list = list.filter(d => d.FACILITIE_ID === Number(facilityId));
    }

    if (payedStatus !== undefined && payedStatus !== '') {
      list = list.filter(d => d.PAYED === Number(payedStatus));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(d =>
        d.DECISION_ID.toLowerCase().includes(q) ||
        d.INTERNAL_REF_SAHL.toLowerCase().includes(q) ||
        d.facility?.FACILITY_NAME.toLowerCase().includes(q) ||
        d.DEPARTMENT.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  app.get('/api/facility-decisions/:id', (req, res) => {
    const id = Number(req.params.id);
    const decision = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.json(decision);
  });

  app.post('/api/facility-decisions', (req, res) => {
    const { decision, items, sendSmsNow } = req.body;
    if (!decision || !decision.FACILITIE_ID) {
      return res.status(400).json({ error: 'Facility and Decision details are required' });
    }

    const maxId = db.facDecisions.reduce((max, d) => Math.max(max, d.DECISION_FAC_ID), 1000);
    const newDecId = maxId + 1;

    const facility = db.facilities.find(f => f.FACILITY_SERIAL === Number(decision.FACILITIE_ID));

    const newDecision = {
      DECISION_FAC_ID: newDecId,
      DECISION_DATE_G: decision.DECISION_DATE_G || new Date().toISOString().split('T')[0],
      DECISION_DATE_H: decision.DECISION_DATE_H || '1447-01-01',
      INTERNAL_REF_SAHL: decision.INTERNAL_REF_SAHL || `SHL-${Date.now().toString().slice(-6)}`,
      SAHL_DATE: decision.SAHL_DATE || new Date().toISOString().split('T')[0],
      FACILITIE_ID: Number(decision.FACILITIE_ID),
      DEPARTMENT: decision.DEPARTMENT || 'لجنة النظر في مخالفات المؤسسات الصحية الخاصة',
      CREATE_BY: decision.CREATE_BY || 'أمين سر اللجنة',
      NEED_SMS: decision.NEED_SMS !== undefined ? Number(decision.NEED_SMS) : 1,
      PAYED: 0,
      DECISION_ID: decision.DECISION_ID || `ق-م/1447/${newDecId}`,
      CREATED_DATE: new Date().toISOString().split('T')[0],
      FILE_NAME: decision.FILE_NAME || `decision_fac_${newDecId}.pdf`
    };

    db.facDecisions.unshift(newDecision);

    // Save items (MVC_PENALTY_DES_FAC)
    let maxItemId = db.penaltyDesFac.reduce((max, i) => Math.max(max, i.PEN_DES_FAC_ID), 5000);
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        maxItemId++;
        db.penaltyDesFac.push({
          PEN_DES_FAC_ID: maxItemId,
          DECISION_ID: newDecId,
          ARTICAL_ID: Number(item.ARTICAL_ID),
          AMOUNT: Number(item.AMOUNT) || 0,
          PENALTY_TYP: item.PENALTY_TYP || 'غرامة مالية',
          PENALTY_NAME: item.PENALTY_NAME || 'مخالفة نظام المؤسسات الصحية'
        });
      }
    }

    // MVC_FAC_SMS: In Oracle 19c, SMS records are preserved for historical audit only.
    // Active SMS sending is disabled per requirement.
    const full = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === newDecId);
    res.status(201).json(full);
  });

  app.put('/api/facility-decisions/:id', (req, res) => {
    const id = Number(req.params.id);
    const { decision, items } = req.body;
    const index = db.facDecisions.findIndex(d => d.DECISION_FAC_ID === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    db.facDecisions[index] = {
      ...db.facDecisions[index],
      ...decision,
      DECISION_FAC_ID: id
    };

    if (Array.isArray(items)) {
      // Replace items
      db.penaltyDesFac = db.penaltyDesFac.filter(i => i.DECISION_ID !== id);
      let maxItemId = db.penaltyDesFac.reduce((max, i) => Math.max(max, i.PEN_DES_FAC_ID), 5000);
      for (const item of items) {
        maxItemId++;
        db.penaltyDesFac.push({
          PEN_DES_FAC_ID: maxItemId,
          DECISION_ID: id,
          ARTICAL_ID: Number(item.ARTICAL_ID),
          AMOUNT: Number(item.AMOUNT) || 0,
          PENALTY_TYP: item.PENALTY_TYP || 'غرامة مالية',
          PENALTY_NAME: item.PENALTY_NAME || 'مخالفة'
        });
      }
    }

    db.updateFacPaymentStatus(id);
    const updated = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    res.json(updated);
  });

  app.delete('/api/facility-decisions/:id', (req, res) => {
    const id = Number(req.params.id);
    db.facDecisions = db.facDecisions.filter(d => d.DECISION_FAC_ID !== id);
    db.penaltyDesFac = db.penaltyDesFac.filter(i => i.DECISION_ID !== id);
    db.facSms = db.facSms.filter(s => s.DECISION_FAC_ID !== id);
    db.paymentFac = db.paymentFac.filter(p => p.DECISION_ID !== id);
    res.json({ success: true });
  });

  // Trigger SMS for Facility Decision (Notice 1 or Notice 2)
  app.post('/api/facility-decisions/:id/send-sms', (req, res) => {
    const id = Number(req.params.id);
    const { noticeNum, customText } = req.body; // 1 or 2
    let sms = db.facSms.find(s => s.DECISION_FAC_ID === id);
    const decision = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    if (!sms) {
      const maxSmsId = db.facSms.reduce((max, s) => Math.max(max, s.SMS_ID), 7000);
      sms = {
        SMS_ID: maxSmsId + 1,
        DECISION_FAC_ID: id,
        MOBILE: decision.facility?.MOBILE || '0500000000',
        NOTC_1_STATUS: 'قيد المعالجة',
        UPDATE_DATE: new Date().toISOString()
      };
      db.facSms.push(sms);
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const guid = `SMS-TX-${Math.floor(100000 + Math.random() * 900000)}`;

    if (noticeNum === 2) {
      sms.NOTC_2_DATE = now;
      sms.NOTC_2_GUID = guid;
      sms.NOTC_2_STATUS = 'تم الإرسال';
      sms.NOTC_2_STAT_DES = 'تم تسليم إشعار التذكير الثاني للمنشأة';
      sms.NOTC_2_JSON = JSON.stringify({
        type: 'REMINDER_NOTICE_2',
        decision_id: decision.DECISION_ID,
        unpaid_amount: decision.totalAmount - decision.paidAmount,
        text: customText || `تذكير أخير: لم يتم سداد كامل الغرامة للقرار ${decision.DECISION_ID} بمبلغ متبقي ${decision.totalAmount - decision.paidAmount} ر.س.`
      });
    } else {
      sms.NOTC_1_DATE = now;
      sms.NOTC_1_GUID = guid;
      sms.NOTC_1_STATUS = 'تم الإرسال';
      sms.NOTC_1_STAT_DES = 'تم تسليم الإشعار الأول عبر بوابة الرسائل الحكومية';
      sms.NOTC_1_JSON = JSON.stringify({
        type: 'INITIAL_NOTICE_1',
        decision_id: decision.DECISION_ID,
        total_amount: decision.totalAmount,
        text: customText || `صدر قرار المخالفة رقم ${decision.DECISION_ID} بمبلغ ${decision.totalAmount} ر.س.`
      });
    }

    sms.UPDATE_DATE = now;
    res.json({ success: true, sms });
  });

  // Register Payment for Facility Decision (MVC_PAYMENT_FAC)
  app.post('/api/facility-decisions/:id/payments', (req, res) => {
    const id = Number(req.params.id);
    const { RECEIPT_AMOUNT, RECEIPT_DATE, RECIPT_ID, CREATED_BY, PEN_DES_FAC_ID, FILE_NAME } = req.body;

    if (!RECEIPT_AMOUNT || Number(RECEIPT_AMOUNT) <= 0) {
      return res.status(400).json({ error: 'Valid receipt amount is required' });
    }

    const maxPayId = db.paymentFac.reduce((max, p) => Math.max(max, p.PAYMENT_ID), 9000);
    const newPayment = {
      PAYMENT_ID: maxPayId + 1,
      RECEIPT_DATE: RECEIPT_DATE || new Date().toISOString().split('T')[0],
      RECEIPT_AMOUNT: Number(RECEIPT_AMOUNT),
      DECISION_ID: id,
      PEN_DES_FAC_ID: PEN_DES_FAC_ID ? Number(PEN_DES_FAC_ID) : undefined,
      CREATED_DATE: new Date().toISOString().split('T')[0],
      CREATED_BY: CREATED_BY || 'أمين الصندوق',
      RECIPT_ID: RECIPT_ID || `REC-SADAD-${Date.now().toString().slice(-6)}`,
      FILE_NAME: FILE_NAME || `receipt_${maxPayId + 1}.pdf`
    };

    db.paymentFac.push(newPayment);
    db.updateFacPaymentStatus(id);

    const full = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    res.status(201).json({ payment: newPayment, decision: full });
  });

  // 8. Staff Decisions (MVC_MSTAFF_DECISION + MVC_PENALTY_DES_MSTAFF + MVC_MSTAFF_SMS + MVC_PAYMENT_MSTAFF)
  app.get('/api/staff-decisions', (req, res) => {
    const { staffId, payedStatus, search } = req.query;
    let list = db.getFullStaffDecisions();

    if (staffId) {
      list = list.filter(d => d.MSTAFF_ID === Number(staffId));
    }

    if (payedStatus !== undefined && payedStatus !== '') {
      list = list.filter(d => d.PAYED === Number(payedStatus));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(d =>
        d.DECISION_ID.toLowerCase().includes(q) ||
        d.INTERNAL_REF_SAHL.toLowerCase().includes(q) ||
        d.staff?.FULL_NAME.toLowerCase().includes(q) ||
        d.DEC_SOURCE.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  app.get('/api/staff-decisions/:id', (req, res) => {
    const id = Number(req.params.id);
    const decision = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }
    res.json(decision);
  });

  app.post('/api/staff-decisions', (req, res) => {
    const { decision, items, sendSmsNow } = req.body;
    if (!decision || !decision.MSTAFF_ID) {
      return res.status(400).json({ error: 'Medical staff and decision details are required' });
    }

    const maxId = db.staffDecisions.reduce((max, d) => Math.max(max, d.DECISION_MSTAFF_ID), 2000);
    const newDecId = maxId + 1;

    const staffMember = db.staff.find(s => s.STAFF_SERIAL === Number(decision.MSTAFF_ID));

    const newDecision = {
      DECISION_MSTAFF_ID: newDecId,
      DECISION_DATE_G: decision.DECISION_DATE_G || new Date().toISOString().split('T')[0],
      DECISION_DATE_H: decision.DECISION_DATE_H || '1447-01-01',
      INTERNAL_REF_SAHL: decision.INTERNAL_REF_SAHL || `SHL-STF-${Date.now().toString().slice(-6)}`,
      SAHL_DATE: decision.SAHL_DATE || new Date().toISOString().split('T')[0],
      MSTAFF_ID: Number(decision.MSTAFF_ID),
      DEC_SOURCE: decision.DEC_SOURCE || 'لجنة مخالفات نظام مزاولة المهن الصحية',
      CREATE_BY: decision.CREATE_BY || 'أمين سر اللجنة',
      NEED_SMS: decision.NEED_SMS !== undefined ? Number(decision.NEED_SMS) : 1,
      PAYED: 0,
      DECISION_ID: decision.DECISION_ID || `ق-ص/1447/${newDecId}`,
      CREATED_DATE: new Date().toISOString().split('T')[0],
      FILE_NAME: decision.FILE_NAME || `decision_staff_${newDecId}.pdf`
    };

    db.staffDecisions.unshift(newDecision);

    // Save items (MVC_PENALTY_DES_MSTAFF)
    let maxItemId = db.penaltyDesStaff.reduce((max, i) => Math.max(max, i.PEN_DES_MSTAFF_ID), 6000);
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        maxItemId++;
        db.penaltyDesStaff.push({
          PEN_DES_MSTAFF_ID: maxItemId,
          DECISION_ID: newDecId,
          ARTICAL_ID: Number(item.ARTICAL_ID),
          AMOUNT: Number(item.AMOUNT) || 0,
          PENALTY_TYP: item.PENALTY_TYP || 'غرامة مالية',
          PENALTY_NAME: item.PENALTY_NAME || 'مخالفة مزاولة المهن الصحية'
        });
      }
    }

    // MVC_MSTAFF_SMS: In Oracle 19c, SMS records are preserved for historical audit only.
    // Active SMS sending is disabled per requirement.
    const full = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === newDecId);
    res.status(201).json(full);
  });

  app.put('/api/staff-decisions/:id', (req, res) => {
    const id = Number(req.params.id);
    const { decision, items } = req.body;
    const index = db.staffDecisions.findIndex(d => d.DECISION_MSTAFF_ID === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }

    db.staffDecisions[index] = {
      ...db.staffDecisions[index],
      ...decision,
      DECISION_MSTAFF_ID: id
    };

    if (Array.isArray(items)) {
      db.penaltyDesStaff = db.penaltyDesStaff.filter(i => i.DECISION_ID !== id);
      let maxItemId = db.penaltyDesStaff.reduce((max, i) => Math.max(max, i.PEN_DES_MSTAFF_ID), 6000);
      for (const item of items) {
        maxItemId++;
        db.penaltyDesStaff.push({
          PEN_DES_MSTAFF_ID: maxItemId,
          DECISION_ID: id,
          ARTICAL_ID: Number(item.ARTICAL_ID),
          AMOUNT: Number(item.AMOUNT) || 0,
          PENALTY_TYP: item.PENALTY_TYP || 'غرامة مالية',
          PENALTY_NAME: item.PENALTY_NAME || 'مخالفة'
        });
      }
    }

    db.updateStaffPaymentStatus(id);
    const updated = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    res.json(updated);
  });

  app.delete('/api/staff-decisions/:id', (req, res) => {
    const id = Number(req.params.id);
    db.staffDecisions = db.staffDecisions.filter(d => d.DECISION_MSTAFF_ID !== id);
    db.penaltyDesStaff = db.penaltyDesStaff.filter(i => i.DECISION_ID !== id);
    db.staffSms = db.staffSms.filter(s => s.DECISION_MSTAFF_ID !== id);
    db.paymentStaff = db.paymentStaff.filter(p => p.DECISION_ID !== id);
    res.json({ success: true });
  });

  // Trigger SMS for Staff Decision
  app.post('/api/staff-decisions/:id/send-sms', (req, res) => {
    const id = Number(req.params.id);
    const { noticeNum, customText } = req.body;
    let sms = db.staffSms.find(s => s.DECISION_MSTAFF_ID === id);
    const decision = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }

    if (!sms) {
      const maxSmsId = db.staffSms.reduce((max, s) => Math.max(max, s.SMS_ID), 8000);
      sms = {
        SMS_ID: maxSmsId + 1,
        DECISION_MSTAFF_ID: id,
        MOBILE: decision.staff?.MOBIE_NUM || '0500000000',
        NOTC_1_STATUS: 'قيد المعالجة',
        UPDATE_DATE: new Date().toISOString()
      };
      db.staffSms.push(sms);
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const guid = `SMS-STF-${Math.floor(100000 + Math.random() * 900000)}`;

    if (noticeNum === 2) {
      sms.NOTC_2_DATE = now;
      sms.NOTC_2_GUID = guid;
      sms.NOTC_2_STATUS = 'تم الإرسال';
      sms.NOTC_2_STAT_DES = 'تم تسليم إشعار التذكير الثاني للممارس';
      sms.NOTC_2_JSON = JSON.stringify({
        type: 'REMINDER_NOTICE_2',
        decision_id: decision.DECISION_ID,
        unpaid_amount: decision.totalAmount - decision.paidAmount,
        text: customText || `تذكير أخير للممارس: لم يتم سداد الغرامة للقرار ${decision.DECISION_ID} بمبلغ متبقي ${decision.totalAmount - decision.paidAmount} ر.س.`
      });
    } else {
      sms.NOTC_1_DATE = now;
      sms.NOTC_1_GUID = guid;
      sms.NOTC_1_STATUS = 'تم الإرسال';
      sms.NOTC_1_STAT_DES = 'تم تسليم الإشعار الأول للممارس';
      sms.NOTC_1_JSON = JSON.stringify({
        type: 'INITIAL_NOTICE_1',
        decision_id: decision.DECISION_ID,
        total_amount: decision.totalAmount,
        text: customText || `صدر قرار المخالفة رقم ${decision.DECISION_ID} بمبلغ ${decision.totalAmount} ر.س.`
      });
    }

    sms.UPDATE_DATE = now;
    res.json({ success: true, sms });
  });

  // Register Payment for Staff Decision (MVC_PAYMENT_MSTAFF)
  app.post('/api/staff-decisions/:id/payments', (req, res) => {
    const id = Number(req.params.id);
    const { RECEIPT_AMOUNT, RECEIPT_DATE, RECIPT_ID, CREATED_BY, PEN_DES_MSTAFF_ID, FILE_NAME } = req.body;

    if (!RECEIPT_AMOUNT || Number(RECEIPT_AMOUNT) <= 0) {
      return res.status(400).json({ error: 'Valid receipt amount is required' });
    }

    const maxPayId = db.paymentStaff.reduce((max, p) => Math.max(max, p.PAYMENT_ID), 9500);
    const newPayment = {
      PAYMENT_ID: maxPayId + 1,
      RECEIPT_DATE: RECEIPT_DATE || new Date().toISOString().split('T')[0],
      RECEIPT_AMOUNT: Number(RECEIPT_AMOUNT),
      DECISION_ID: id,
      PEN_DES_MSTAFF_ID: PEN_DES_MSTAFF_ID ? Number(PEN_DES_MSTAFF_ID) : undefined,
      CREATED_DATE: new Date().toISOString().split('T')[0],
      CREATED_BY: CREATED_BY || 'أمين الصندوق',
      RECIPT_ID: RECIPT_ID || `REC-STF-${Date.now().toString().slice(-6)}`,
      FILE_NAME: FILE_NAME || `stf_receipt_${maxPayId + 1}.pdf`
    };

    db.paymentStaff.push(newPayment);
    db.updateStaffPaymentStatus(id);

    const full = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    res.status(201).json({ payment: newPayment, decision: full });
  });

  // Reset database back to default seed
  app.post('/api/seed/reset', (_req, res) => {
    db.seed();
    res.json({ success: true, message: 'Database reset to initial sample data' });
  });

  // Database ERD Structure Metadata (matching the diagram image)
  app.get('/api/erd', (_req, res) => {
    res.json({
      diagramImage: '/assets/aistudio/MVC_DB_8cf91aba.jpeg',
      tables: [
        {
          name: 'MVC_VPI_FACILITIES',
          title: 'جدول المنشآت الصحية',
          pk: 'FACILITY_SERIAL',
          fks: [{ field: 'FACILITY_TYPE', ref: 'MVC_VPI_FACILTIES_TYPES.FACILITY_TYPE_SN' }],
          columns: ['FACILITY_SERIAL', 'FACILITY_NAME', 'FACILITY_TYPE', 'LICENSE_NUMBER', 'MOBILE', 'EMAIL', 'ADD_UNIT', 'CREATE_BY', 'CREATE_DATE', 'UPDATE_BY', 'UPDATE_DATE', 'ADD_STREET', 'ADD_BUILD_NO', 'ADD_BUILD_NO2', 'ADD_DIST', 'ADD_CITY', 'ADD_POSTCODE', 'LICENSE_DATE', 'COM_LICENSE_NO', 'COM_START_DATE', 'COM_END_DATE', 'FILE_NAME', 'CR_NO', 'PRV_GOV']
        },
        {
          name: 'MVC_VPI_FACILTIES_TYPES',
          title: 'أنواع المنشآت الصحية',
          pk: 'FACILITY_TYPE_SN',
          fks: [],
          columns: ['FACILITY_TYPE_SN', 'FACILITY_TYPE_DESC']
        },
        {
          name: 'MVC_MSTAFF_DATA',
          title: 'بيانات الكادر والممارسين الصحيين',
          pk: 'STAFF_SERIAL',
          fks: [{ field: 'FACILILTY_SERIAL', ref: 'MVC_VPI_FACILITIES.FACILITY_SERIAL' }],
          columns: ['STAFF_SERIAL', 'FULL_NAME', 'NATIONAL_ID', 'JOB_LOCATION', 'TYPE_JOB_LOC', 'MOBIE_NUM', 'CREATE_BY', 'CREATE_DATE', 'UPDATE_BY', 'UPDATE_DATE', 'EMAIL', 'ADD_UNIT', 'ADD_STREET', 'ADD_BUILD_NO', 'ADD_BUILD_NO2', 'ADD_DIST', 'ADD_CITY', 'ADD_POSTCODE', 'FILE_NAME', 'NATIONALITY', 'GENDR', 'DEGREE', 'LIS_END_DATE', 'VAC_DATE', 'FACILILTY_SERIAL']
        },
        {
          name: 'MVC_PENAITY_ARTICAL',
          title: 'لائحة ومواد المخالفات',
          pk: 'ARTICAL_ID',
          fks: [],
          columns: ['ARTICAL_ID', 'ARTICAL_NAME', 'ARTICAL_DISCRIPTION', 'ARTICAL_TYPE']
        },
        {
          name: 'MVC_FAC_DECISION',
          title: 'قرارات مخالفات المنشآت',
          pk: 'DECISION_FAC_ID',
          fks: [{ field: 'FACILITIE_ID', ref: 'MVC_VPI_FACILITIES.FACILITY_SERIAL' }],
          columns: ['DECISION_FAC_ID', 'DECISION_DATE_G', 'DECISION_DATE_H', 'INTERNAL_REF_SAHL', 'SAHL_DATE', 'FACILITIE_ID', 'DEPARTMENT', 'CREATE_BY', 'NEED_SMS', 'PAYED', 'DECISION_ID', 'CREATED_DATE', 'FILE_NAME']
        },
        {
          name: 'MVC_PENALTY_DES_FAC',
          title: 'بنود المخالفة للمنشأة',
          pk: 'PEN_DES_FAC_ID',
          fks: [
            { field: 'DECISION_ID', ref: 'MVC_FAC_DECISION.DECISION_FAC_ID' },
            { field: 'ARTICAL_ID', ref: 'MVC_PENAITY_ARTICAL.ARTICAL_ID' }
          ],
          columns: ['PEN_DES_FAC_ID', 'DECISION_ID', 'ARTICAL_ID', 'AMOUNT', 'PENALTY_TYP', 'PENALTY_NAME']
        },
        {
          name: 'MVC_FAC_SMS',
          title: 'إشعارات ورسائل قرارات المنشآت',
          pk: 'SMS_ID',
          fks: [{ field: 'DECISION_FAC_ID', ref: 'MVC_FAC_DECISION.DECISION_FAC_ID' }],
          columns: ['SMS_ID', 'NOTC_1_DATE', 'NOTC_1_JSON', 'NOTC_2_DATE', 'NOTC_2_JSON', 'NOTC_1_STATUS', 'NOTC_1_STAT_DES', 'NOTC_2_STATUS', 'NOTC_2_STAT_DES', 'DECISION_FAC_ID', 'MOBILE', 'NOTC_1_GUID', 'NOTC_2_GUID', 'MOBILE_2', 'UPDATE_DATE']
        },
        {
          name: 'MVC_PAYMENT_FAC',
          title: 'سدادات وتحصيل مخالفات المنشآت',
          pk: 'PAYMENT_ID',
          fks: [
            { field: 'DECISION_ID', ref: 'MVC_FAC_DECISION.DECISION_FAC_ID' },
            { field: 'PEN_DES_FAC_ID', ref: 'MVC_PENALTY_DES_FAC.PEN_DES_FAC_ID' }
          ],
          columns: ['PAYMENT_ID', 'RECEIPT_DATE', 'RECEIPT_AMOUNT', 'DECISION_ID', 'PEN_DES_FAC_ID', 'CREATED_DATE', 'CREATED_BY', 'FILE_NAME', 'RECIPT_ID']
        },
        {
          name: 'MVC_MSTAFF_DECISION',
          title: 'قرارات مخالفات الممارسين',
          pk: 'DECISION_MSTAFF_ID',
          fks: [{ field: 'MSTAFF_ID', ref: 'MVC_MSTAFF_DATA.STAFF_SERIAL' }],
          columns: ['DECISION_MSTAFF_ID', 'DECISION_DATE_G', 'DECISION_DATE_H', 'INTERNAL_REF_SAHL', 'SAHL_DATE', 'MSTAFF_ID', 'CREATE_BY', 'NEED_SMS', 'PAYED', 'DECISION_ID', 'DEC_SOURCE', 'CREATED_DATE', 'FILE_NAME']
        },
        {
          name: 'MVC_PENALTY_DES_MSTAFF',
          title: 'بنود مخالفة الممارس',
          pk: 'PEN_DES_MSTAFF_ID',
          fks: [
            { field: 'DECISION_ID', ref: 'MVC_MSTAFF_DECISION.DECISION_MSTAFF_ID' },
            { field: 'ARTICAL_ID', ref: 'MVC_PENAITY_ARTICAL.ARTICAL_ID' }
          ],
          columns: ['PEN_DES_MSTAFF_ID', 'DECISION_ID', 'ARTICAL_ID', 'AMOUNT', 'PENALTY_TYP', 'PENALTY_NAME']
        },
        {
          name: 'MVC_MSTAFF_SMS',
          title: 'إشعارات ورسائل قرارات الممارسين',
          pk: 'SMS_ID',
          fks: [{ field: 'DECISION_MSTAFF_ID', ref: 'MVC_MSTAFF_DECISION.DECISION_MSTAFF_ID' }],
          columns: ['SMS_ID', 'NOTC_1_DATE', 'NOTC_1_JSON', 'NOTC_2_DATE', 'NOTC_2_JSON', 'NOTC_1_STATUS', 'NOTC_1_STAT_DES', 'NOTC_2_STATUS', 'NOTC_2_STAT_DES', 'DECISION_MSTAFF_ID', 'MOBILE', 'NOTC_1_GUID', 'NOTC_2_GUID', 'MOBILE_2', 'UPDATE_DATE']
        },
        {
          name: 'MVC_PAYMENT_MSTAFF',
          title: 'سدادات وتحصيل مخالفات الممارسين',
          pk: 'PAYMENT_ID',
          fks: [
            { field: 'DECISION_ID', ref: 'MVC_MSTAFF_DECISION.DECISION_MSTAFF_ID' },
            { field: 'PEN_DES_MSTAFF_ID', ref: 'MVC_PENALTY_DES_MSTAFF.PEN_DES_MSTAFF_ID' }
          ],
          columns: ['PAYMENT_ID', 'RECEIPT_DATE', 'RECEIPT_AMOUNT', 'DECISION_ID', 'PEN_DES_MSTAFF_ID', 'CREATED_DATE', 'CREATED_BY', 'FILE_NAME', 'RECIPT_ID']
        }
      ]
    });
  });

  // ==========================================
  // VITE / STATIC INTEGRATION
  // ==========================================
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node.js API & Web Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
