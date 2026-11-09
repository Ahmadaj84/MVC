import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { db } from './src/server/db';
import { ORACLE_19C_DDL, ORACLE_19C_NODE_CONNECTOR } from './src/server/oracleDdl';
import { createBasicAuth, rateLimit, securityHeaders } from './src/server/security';
import {
  ValidationError,
  assertRequired,
  assertStrings,
  matches,
  pick,
  toAmount,
  toId
} from './src/server/validation';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const today = () => new Date().toISOString().split('T')[0];

// ==========================================
// FIELD WHITELISTS (prevent mass assignment)
// IDs, CREATE_DATE / UPDATE_DATE and PAYED are always server-controlled.
// ==========================================
const FACILITY_FIELDS = [
  'FACILITY_NAME', 'FACILITY_TYPE', 'LICENSE_NUMBER', 'MOBILE', 'EMAIL', 'ADD_UNIT', 'UPDATE_BY',
  'ADD_STREET', 'ADD_BUILD_NO', 'ADD_BUILD_NO2', 'ADD_DIST', 'ADD_CITY', 'ADD_POSTCODE',
  'LICENSE_DATE', 'COM_LICENSE_NO', 'COM_START_DATE', 'COM_END_DATE', 'FILE_NAME', 'CR_NO', 'PRV_GOV'
] as const;
const FACILITY_STRING_FIELDS = FACILITY_FIELDS.filter(f => f !== 'FACILITY_TYPE');
const FACILITY_REQUIRED = ['FACILITY_NAME', 'LICENSE_NUMBER', 'CR_NO', 'MOBILE'] as const;

const STAFF_FIELDS = [
  'FULL_NAME', 'NATIONAL_ID', 'JOB_LOCATION', 'TYPE_JOB_LOC', 'MOBIE_NUM', 'UPDATE_BY', 'EMAIL',
  'ADD_UNIT', 'ADD_STREET', 'ADD_BUILD_NO', 'ADD_BUILD_NO2', 'ADD_DIST', 'ADD_CITY', 'ADD_POSTCODE',
  'FILE_NAME', 'NATIONALITY', 'GENDR', 'DEGREE', 'LIS_END_DATE', 'VAC_DATE', 'FACILILTY_SERIAL'
] as const;
const STAFF_STRING_FIELDS = STAFF_FIELDS.filter(f => f !== 'FACILILTY_SERIAL');
const STAFF_REQUIRED = ['FULL_NAME', 'NATIONAL_ID', 'MOBIE_NUM'] as const;

const ARTICLE_FIELDS = ['ARTICAL_NAME', 'ARTICAL_DISCRIPTION', 'ARTICAL_TYPE'] as const;
const ARTICLE_TYPES = ['منشآت', 'ممارسين', 'مشترك'];

const FAC_DECISION_FIELDS = [
  'DECISION_DATE_G', 'DECISION_DATE_H', 'INTERNAL_REF_SAHL', 'SAHL_DATE', 'FACILITIE_ID',
  'DEPARTMENT', 'NEED_SMS', 'DECISION_ID', 'FILE_NAME'
] as const;
const STAFF_DECISION_FIELDS = [
  'DECISION_DATE_G', 'DECISION_DATE_H', 'INTERNAL_REF_SAHL', 'SAHL_DATE', 'MSTAFF_ID',
  'DEC_SOURCE', 'NEED_SMS', 'DECISION_ID', 'FILE_NAME'
] as const;
const DECISION_STRING_FIELDS = [
  'DECISION_DATE_G', 'DECISION_DATE_H', 'INTERNAL_REF_SAHL', 'SAHL_DATE', 'DEPARTMENT',
  'DEC_SOURCE', 'DECISION_ID', 'FILE_NAME', 'CREATE_BY'
] as const;

// ==========================================
// VALIDATORS
// ==========================================
function validateFacility(data: Record<string, unknown>, isCreate: boolean) {
  assertStrings(data, [...FACILITY_STRING_FIELDS, 'CREATE_BY']);
  if (isCreate) assertRequired(data, FACILITY_REQUIRED);
  else for (const k of FACILITY_REQUIRED) if (k in data) assertRequired(data, [k]);
  if (data.FACILITY_TYPE !== undefined || isCreate) {
    const typeId = toId(data.FACILITY_TYPE, 'FACILITY_TYPE');
    if (!db.facilityTypes.some(t => t.FACILITY_TYPE_SN === typeId)) {
      throw new ValidationError('FACILITY_TYPE does not exist');
    }
    data.FACILITY_TYPE = typeId;
  }
}

function validateStaff(data: Record<string, unknown>, isCreate: boolean) {
  assertStrings(data, [...STAFF_STRING_FIELDS, 'CREATE_BY']);
  if (isCreate) assertRequired(data, STAFF_REQUIRED);
  else for (const k of STAFF_REQUIRED) if (k in data) assertRequired(data, [k]);
  if (data.FACILILTY_SERIAL !== undefined && data.FACILILTY_SERIAL !== null && data.FACILILTY_SERIAL !== '') {
    const facId = toId(data.FACILILTY_SERIAL, 'FACILILTY_SERIAL');
    if (!db.facilities.some(f => f.FACILITY_SERIAL === facId)) {
      throw new ValidationError('FACILILTY_SERIAL does not exist');
    }
    data.FACILILTY_SERIAL = facId;
  }
}

function validateArticle(data: Record<string, unknown>, isCreate: boolean) {
  assertStrings(data, ARTICLE_FIELDS);
  if (isCreate || 'ARTICAL_NAME' in data) assertRequired(data, ['ARTICAL_NAME']);
  if ((isCreate || 'ARTICAL_TYPE' in data) && !ARTICLE_TYPES.includes(String(data.ARTICAL_TYPE))) {
    throw new ValidationError(`ARTICAL_TYPE must be one of: ${ARTICLE_TYPES.join(', ')}`);
  }
}

function validateDecisionFields(data: Record<string, unknown>) {
  assertStrings(data, DECISION_STRING_FIELDS);
  for (const k of ['DECISION_ID', 'INTERNAL_REF_SAHL', 'DEPARTMENT', 'DEC_SOURCE']) {
    if (k in data) assertRequired(data, [k]);
  }
  if (data.NEED_SMS !== undefined) {
    data.NEED_SMS = Number(data.NEED_SMS) ? 1 : 0;
  }
}

interface ParsedItem {
  ARTICAL_ID: number;
  AMOUNT: number;
  PENALTY_TYP: string;
  PENALTY_NAME: string;
}

function parseItems(items: unknown, defaultName: string): ParsedItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('At least one penalty item is required');
  }
  if (items.length > 100) throw new ValidationError('Too many penalty items');
  return items.map((raw, idx) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const articleId = toId(item.ARTICAL_ID, `items[${idx}].ARTICAL_ID`);
    if (!db.articles.some(a => a.ARTICAL_ID === articleId)) {
      throw new ValidationError(`items[${idx}].ARTICAL_ID does not exist`);
    }
    assertStrings(item, ['PENALTY_TYP', 'PENALTY_NAME']);
    return {
      ARTICAL_ID: articleId,
      AMOUNT: toAmount(item.AMOUNT ?? 0, `items[${idx}].AMOUNT`),
      PENALTY_TYP: (item.PENALTY_TYP as string) || 'غرامة مالية',
      PENALTY_NAME: (item.PENALTY_NAME as string) || defaultName
    };
  });
}

/** Validates a payment against the decision's remaining balance. */
function parsePayment(
  body: Record<string, unknown>,
  remaining: number,
  validItemIds: number[],
  itemKey: 'PEN_DES_FAC_ID' | 'PEN_DES_MSTAFF_ID'
) {
  const amount = toAmount(body.RECEIPT_AMOUNT, 'RECEIPT_AMOUNT', { allowZero: false });
  if (remaining <= 0) {
    throw new ValidationError('This decision is already fully paid', 409);
  }
  if (amount > remaining + 0.005) {
    throw new ValidationError(`RECEIPT_AMOUNT exceeds the remaining balance (${remaining})`);
  }
  assertStrings(body, ['RECEIPT_DATE', 'RECIPT_ID', 'CREATED_BY', 'FILE_NAME']);
  let itemId: number | undefined;
  const rawItem = body[itemKey];
  if (rawItem !== undefined && rawItem !== null && rawItem !== '') {
    itemId = toId(rawItem, itemKey);
    if (!validItemIds.includes(itemId)) {
      throw new ValidationError(`${itemKey} does not belong to this decision`);
    }
  }
  return { amount, itemId };
}

function parseSmsRequest(body: Record<string, unknown>) {
  const noticeNum = Number(body.noticeNum) === 2 ? 2 : 1;
  const customText = body.customText;
  if (customText !== undefined && customText !== null && (typeof customText !== 'string' || customText.length > 1000)) {
    throw new ValidationError('customText must be a string of at most 1000 characters');
  }
  return { noticeNum, customText: (customText as string | undefined) || undefined };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  const HOST = process.env.HOST || '0.0.0.0';

  app.disable('x-powered-by');
  app.use(securityHeaders);

  // 1. Health check (unauthenticated, exposes nothing sensitive)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: 'In-memory store (Oracle 19c schema)',
      time: new Date().toISOString()
    });
  });

  // Everything else (UI + API) requires authentication.
  app.use(createBasicAuth(isProduction));
  app.use('/api', rateLimit(120, 60_000));
  app.use(express.json({ limit: '100kb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

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
    const data = pick(req.body, ['FACILITY_TYPE_DESC'] as const);
    assertStrings(data, ['FACILITY_TYPE_DESC']);
    assertRequired(data, ['FACILITY_TYPE_DESC']);
    const newType = {
      FACILITY_TYPE_SN: db.nextId('facilityType'),
      FACILITY_TYPE_DESC: data.FACILITY_TYPE_DESC as string
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
        matches(f.FACILITY_NAME, q) ||
        matches(f.LICENSE_NUMBER, q) ||
        matches(f.CR_NO, q) ||
        matches(f.MOBILE, q)
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
    const data: Record<string, unknown> = pick(req.body, [...FACILITY_FIELDS, 'CREATE_BY'] as const);
    validateFacility(data, true);
    const newFacility = {
      ...data,
      FACILITY_SERIAL: db.nextId('facility'),
      CREATE_DATE: today(),
      CREATE_BY: (data.CREATE_BY as string) || 'النظام'
    } as (typeof db.facilities)[number];
    db.facilities.unshift(newFacility);
    res.status(201).json(newFacility);
  });

  app.put('/api/facilities/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const index = db.facilities.findIndex(f => f.FACILITY_SERIAL === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    const data: Record<string, unknown> = pick(req.body, FACILITY_FIELDS);
    validateFacility(data, false);
    db.facilities[index] = {
      ...db.facilities[index],
      ...data,
      FACILITY_SERIAL: id,
      UPDATE_DATE: today()
    };
    res.json(db.facilities[index]);
  });

  app.delete('/api/facilities/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    if (!db.facilities.some(f => f.FACILITY_SERIAL === id)) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    const decisions = db.facDecisions.filter(d => d.FACILITIE_ID === id).length;
    const staff = db.staff.filter(s => s.FACILILTY_SERIAL === id).length;
    if (decisions > 0 || staff > 0) {
      return res.status(409).json({
        error: `Cannot delete facility: it is referenced by ${decisions} decision(s) and ${staff} staff member(s)`
      });
    }
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
        matches(s.FULL_NAME, q) ||
        matches(s.NATIONAL_ID, q) ||
        matches(s.MOBIE_NUM, q)
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
    const data: Record<string, unknown> = pick(req.body, [...STAFF_FIELDS, 'CREATE_BY'] as const);
    validateStaff(data, true);
    const newStaff = {
      ...data,
      STAFF_SERIAL: db.nextId('staff'),
      CREATE_DATE: today(),
      CREATE_BY: (data.CREATE_BY as string) || 'النظام'
    } as (typeof db.staff)[number];
    db.staff.unshift(newStaff);
    res.status(201).json(newStaff);
  });

  app.put('/api/staff/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const index = db.staff.findIndex(s => s.STAFF_SERIAL === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    const data: Record<string, unknown> = pick(req.body, STAFF_FIELDS);
    validateStaff(data, false);
    db.staff[index] = {
      ...db.staff[index],
      ...data,
      STAFF_SERIAL: id,
      UPDATE_DATE: today()
    };
    res.json(db.staff[index]);
  });

  app.delete('/api/staff/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    if (!db.staff.some(s => s.STAFF_SERIAL === id)) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    const decisions = db.staffDecisions.filter(d => d.MSTAFF_ID === id).length;
    if (decisions > 0) {
      return res.status(409).json({
        error: `Cannot delete staff member: it is referenced by ${decisions} decision(s)`
      });
    }
    db.staff = db.staff.filter(s => s.STAFF_SERIAL !== id);
    res.json({ success: true });
  });

  // 6. Penalty Articles (MVC_PENAITY_ARTICAL)
  app.get('/api/penalty-articles', (_req, res) => {
    res.json(db.articles);
  });

  app.post('/api/penalty-articles', (req, res) => {
    const data: Record<string, unknown> = pick(req.body, ARTICLE_FIELDS);
    validateArticle(data, true);
    const newArt = {
      ARTICAL_DISCRIPTION: '',
      ...data,
      ARTICAL_ID: db.nextId('article')
    } as (typeof db.articles)[number];
    db.articles.push(newArt);
    res.status(201).json(newArt);
  });

  app.put('/api/penalty-articles/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const index = db.articles.findIndex(a => a.ARTICAL_ID === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const data: Record<string, unknown> = pick(req.body, ARTICLE_FIELDS);
    validateArticle(data, false);
    db.articles[index] = { ...db.articles[index], ...data, ARTICAL_ID: id };
    res.json(db.articles[index]);
  });

  app.delete('/api/penalty-articles/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    if (!db.articles.some(a => a.ARTICAL_ID === id)) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const uses =
      db.penaltyDesFac.filter(i => i.ARTICAL_ID === id).length +
      db.penaltyDesStaff.filter(i => i.ARTICAL_ID === id).length;
    if (uses > 0) {
      return res.status(409).json({
        error: `Cannot delete article: it is used by ${uses} penalty item(s)`
      });
    }
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
        matches(d.DECISION_ID, q) ||
        matches(d.INTERNAL_REF_SAHL, q) ||
        matches(d.facility?.FACILITY_NAME, q) ||
        matches(d.DEPARTMENT, q)
      );
    }

    res.json(list);
  });

  app.get('/api/facility-decisions/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const decision = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.json(decision);
  });

  app.post('/api/facility-decisions', (req, res) => {
    const decision: Record<string, unknown> = pick(req.body?.decision, [...FAC_DECISION_FIELDS, 'CREATE_BY'] as const);
    validateDecisionFields(decision);
    const facilityId = toId(decision.FACILITIE_ID, 'FACILITIE_ID');
    if (!db.facilities.some(f => f.FACILITY_SERIAL === facilityId)) {
      return res.status(400).json({ error: 'FACILITIE_ID does not exist' });
    }
    const items = parseItems(req.body?.items, 'مخالفة نظام المؤسسات الصحية');

    const newDecId = db.nextId('facDecision');
    const newDecision = {
      DECISION_FAC_ID: newDecId,
      DECISION_DATE_G: (decision.DECISION_DATE_G as string) || today(),
      DECISION_DATE_H: (decision.DECISION_DATE_H as string) || '1447-01-01',
      INTERNAL_REF_SAHL: (decision.INTERNAL_REF_SAHL as string) || `SHL-${Date.now().toString().slice(-6)}`,
      SAHL_DATE: (decision.SAHL_DATE as string) || today(),
      FACILITIE_ID: facilityId,
      DEPARTMENT: (decision.DEPARTMENT as string) || 'لجنة النظر في مخالفات المؤسسات الصحية الخاصة',
      CREATE_BY: (decision.CREATE_BY as string) || 'أمين سر اللجنة',
      NEED_SMS: decision.NEED_SMS !== undefined ? (decision.NEED_SMS as number) : 1,
      PAYED: 0,
      DECISION_ID: (decision.DECISION_ID as string) || `ق-م/1447/${newDecId}`,
      CREATED_DATE: today(),
      FILE_NAME: (decision.FILE_NAME as string) || `decision_fac_${newDecId}.pdf`
    };

    db.facDecisions.unshift(newDecision);

    // Save items (MVC_PENALTY_DES_FAC)
    for (const item of items) {
      db.penaltyDesFac.push({ PEN_DES_FAC_ID: db.nextId('penaltyDesFac'), DECISION_ID: newDecId, ...item });
    }

    // MVC_FAC_SMS: In Oracle 19c, SMS records are preserved for historical audit only.
    // Active SMS sending is disabled per requirement.
    const full = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === newDecId);
    res.status(201).json(full);
  });

  app.put('/api/facility-decisions/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const index = db.facDecisions.findIndex(d => d.DECISION_FAC_ID === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    const decision: Record<string, unknown> = pick(req.body?.decision, FAC_DECISION_FIELDS);
    validateDecisionFields(decision);
    if (decision.FACILITIE_ID !== undefined) {
      const facilityId = toId(decision.FACILITIE_ID, 'FACILITIE_ID');
      if (!db.facilities.some(f => f.FACILITY_SERIAL === facilityId)) {
        return res.status(400).json({ error: 'FACILITIE_ID does not exist' });
      }
      decision.FACILITIE_ID = facilityId;
    }
    const items = req.body?.items !== undefined ? parseItems(req.body.items, 'مخالفة') : undefined;

    db.facDecisions[index] = {
      ...db.facDecisions[index],
      ...decision,
      DECISION_FAC_ID: id
    };

    if (items) {
      // Replace items. Payments that were allocated to a removed item lose that allocation.
      db.penaltyDesFac = db.penaltyDesFac.filter(i => i.DECISION_ID !== id);
      for (const item of items) {
        db.penaltyDesFac.push({ PEN_DES_FAC_ID: db.nextId('penaltyDesFac'), DECISION_ID: id, ...item });
      }
      for (const p of db.paymentFac) {
        if (p.DECISION_ID === id) p.PEN_DES_FAC_ID = undefined;
      }
    }

    db.updateFacPaymentStatus(id);
    const updated = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    res.json(updated);
  });

  app.delete('/api/facility-decisions/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    if (!db.facDecisions.some(d => d.DECISION_FAC_ID === id)) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    db.facDecisions = db.facDecisions.filter(d => d.DECISION_FAC_ID !== id);
    db.penaltyDesFac = db.penaltyDesFac.filter(i => i.DECISION_ID !== id);
    db.facSms = db.facSms.filter(s => s.DECISION_FAC_ID !== id);
    db.paymentFac = db.paymentFac.filter(p => p.DECISION_ID !== id);
    res.json({ success: true });
  });

  // Trigger SMS for Facility Decision (Notice 1 or Notice 2)
  app.post('/api/facility-decisions/:id/send-sms', (req, res) => {
    const id = toId(req.params.id, 'id');
    const { noticeNum, customText } = parseSmsRequest(req.body || {});
    const decision = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    let sms = db.facSms.find(s => s.DECISION_FAC_ID === id);

    if (!sms) {
      sms = {
        SMS_ID: db.nextId('facSms'),
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
    const id = toId(req.params.id, 'id');
    const decision = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    const body = (req.body || {}) as Record<string, unknown>;
    const { amount, itemId } = parsePayment(
      body,
      decision.totalAmount - decision.paidAmount,
      decision.items.map(i => i.PEN_DES_FAC_ID),
      'PEN_DES_FAC_ID'
    );

    const paymentId = db.nextId('paymentFac');
    const newPayment = {
      PAYMENT_ID: paymentId,
      RECEIPT_DATE: (body.RECEIPT_DATE as string) || today(),
      RECEIPT_AMOUNT: amount,
      DECISION_ID: id,
      PEN_DES_FAC_ID: itemId,
      CREATED_DATE: today(),
      CREATED_BY: (body.CREATED_BY as string) || 'أمين الصندوق',
      RECIPT_ID: (body.RECIPT_ID as string) || `REC-SADAD-${Date.now().toString().slice(-6)}`,
      FILE_NAME: (body.FILE_NAME as string) || `receipt_${paymentId}.pdf`
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
        matches(d.DECISION_ID, q) ||
        matches(d.INTERNAL_REF_SAHL, q) ||
        matches(d.staff?.FULL_NAME, q) ||
        matches(d.DEC_SOURCE, q)
      );
    }

    res.json(list);
  });

  app.get('/api/staff-decisions/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const decision = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }
    res.json(decision);
  });

  app.post('/api/staff-decisions', (req, res) => {
    const decision: Record<string, unknown> = pick(req.body?.decision, [...STAFF_DECISION_FIELDS, 'CREATE_BY'] as const);
    validateDecisionFields(decision);
    const staffId = toId(decision.MSTAFF_ID, 'MSTAFF_ID');
    if (!db.staff.some(s => s.STAFF_SERIAL === staffId)) {
      return res.status(400).json({ error: 'MSTAFF_ID does not exist' });
    }
    const items = parseItems(req.body?.items, 'مخالفة مزاولة المهن الصحية');

    const newDecId = db.nextId('staffDecision');
    const newDecision = {
      DECISION_MSTAFF_ID: newDecId,
      DECISION_DATE_G: (decision.DECISION_DATE_G as string) || today(),
      DECISION_DATE_H: (decision.DECISION_DATE_H as string) || '1447-01-01',
      INTERNAL_REF_SAHL: (decision.INTERNAL_REF_SAHL as string) || `SHL-STF-${Date.now().toString().slice(-6)}`,
      SAHL_DATE: (decision.SAHL_DATE as string) || today(),
      MSTAFF_ID: staffId,
      DEC_SOURCE: (decision.DEC_SOURCE as string) || 'لجنة مخالفات نظام مزاولة المهن الصحية',
      CREATE_BY: (decision.CREATE_BY as string) || 'أمين سر اللجنة',
      NEED_SMS: decision.NEED_SMS !== undefined ? (decision.NEED_SMS as number) : 1,
      PAYED: 0,
      DECISION_ID: (decision.DECISION_ID as string) || `ق-ص/1447/${newDecId}`,
      CREATED_DATE: today(),
      FILE_NAME: (decision.FILE_NAME as string) || `decision_staff_${newDecId}.pdf`
    };

    db.staffDecisions.unshift(newDecision);

    // Save items (MVC_PENALTY_DES_MSTAFF)
    for (const item of items) {
      db.penaltyDesStaff.push({ PEN_DES_MSTAFF_ID: db.nextId('penaltyDesStaff'), DECISION_ID: newDecId, ...item });
    }

    // MVC_MSTAFF_SMS: In Oracle 19c, SMS records are preserved for historical audit only.
    // Active SMS sending is disabled per requirement.
    const full = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === newDecId);
    res.status(201).json(full);
  });

  app.put('/api/staff-decisions/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    const index = db.staffDecisions.findIndex(d => d.DECISION_MSTAFF_ID === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }
    const decision: Record<string, unknown> = pick(req.body?.decision, STAFF_DECISION_FIELDS);
    validateDecisionFields(decision);
    if (decision.MSTAFF_ID !== undefined) {
      const staffId = toId(decision.MSTAFF_ID, 'MSTAFF_ID');
      if (!db.staff.some(s => s.STAFF_SERIAL === staffId)) {
        return res.status(400).json({ error: 'MSTAFF_ID does not exist' });
      }
      decision.MSTAFF_ID = staffId;
    }
    const items = req.body?.items !== undefined ? parseItems(req.body.items, 'مخالفة') : undefined;

    db.staffDecisions[index] = {
      ...db.staffDecisions[index],
      ...decision,
      DECISION_MSTAFF_ID: id
    };

    if (items) {
      db.penaltyDesStaff = db.penaltyDesStaff.filter(i => i.DECISION_ID !== id);
      for (const item of items) {
        db.penaltyDesStaff.push({ PEN_DES_MSTAFF_ID: db.nextId('penaltyDesStaff'), DECISION_ID: id, ...item });
      }
      for (const p of db.paymentStaff) {
        if (p.DECISION_ID === id) p.PEN_DES_MSTAFF_ID = undefined;
      }
    }

    db.updateStaffPaymentStatus(id);
    const updated = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    res.json(updated);
  });

  app.delete('/api/staff-decisions/:id', (req, res) => {
    const id = toId(req.params.id, 'id');
    if (!db.staffDecisions.some(d => d.DECISION_MSTAFF_ID === id)) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }
    db.staffDecisions = db.staffDecisions.filter(d => d.DECISION_MSTAFF_ID !== id);
    db.penaltyDesStaff = db.penaltyDesStaff.filter(i => i.DECISION_ID !== id);
    db.staffSms = db.staffSms.filter(s => s.DECISION_MSTAFF_ID !== id);
    db.paymentStaff = db.paymentStaff.filter(p => p.DECISION_ID !== id);
    res.json({ success: true });
  });

  // Trigger SMS for Staff Decision
  app.post('/api/staff-decisions/:id/send-sms', (req, res) => {
    const id = toId(req.params.id, 'id');
    const { noticeNum, customText } = parseSmsRequest(req.body || {});
    const decision = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }
    let sms = db.staffSms.find(s => s.DECISION_MSTAFF_ID === id);

    if (!sms) {
      sms = {
        SMS_ID: db.nextId('staffSms'),
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
    const id = toId(req.params.id, 'id');
    const decision = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    if (!decision) {
      return res.status(404).json({ error: 'Staff decision not found' });
    }
    const body = (req.body || {}) as Record<string, unknown>;
    const { amount, itemId } = parsePayment(
      body,
      decision.totalAmount - decision.paidAmount,
      decision.items.map(i => i.PEN_DES_MSTAFF_ID),
      'PEN_DES_MSTAFF_ID'
    );

    const paymentId = db.nextId('paymentStaff');
    const newPayment = {
      PAYMENT_ID: paymentId,
      RECEIPT_DATE: (body.RECEIPT_DATE as string) || today(),
      RECEIPT_AMOUNT: amount,
      DECISION_ID: id,
      PEN_DES_MSTAFF_ID: itemId,
      CREATED_DATE: today(),
      CREATED_BY: (body.CREATED_BY as string) || 'أمين الصندوق',
      RECIPT_ID: (body.RECIPT_ID as string) || `REC-STF-${Date.now().toString().slice(-6)}`,
      FILE_NAME: (body.FILE_NAME as string) || `stf_receipt_${paymentId}.pdf`
    };

    db.paymentStaff.push(newPayment);
    db.updateStaffPaymentStatus(id);

    const full = db.getFullStaffDecisions().find(d => d.DECISION_MSTAFF_ID === id);
    res.status(201).json({ payment: newPayment, decision: full });
  });

  // Reset database back to default seed (disabled in production unless explicitly enabled)
  app.post('/api/seed/reset', (_req, res) => {
    if (isProduction && process.env.ENABLE_SEED_RESET !== 'true') {
      return res.status(403).json({ error: 'Database reset is disabled in production' });
    }
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


  // Unknown API routes -> JSON 404 (instead of falling through to the SPA)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler: never leak stack traces to clients
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (err instanceof ValidationError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // ==========================================
  // VITE / STATIC INTEGRATION
  // ==========================================
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

  app.listen(PORT, HOST, () => {
    console.log(`Node.js API & Web Server running on ${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
