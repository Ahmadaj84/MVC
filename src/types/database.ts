/**
 * Database Types matching MVC_DB ERD Exactly:
 * - MVC_VPI_FACILTIES_TYPES
 * - MVC_VPI_FACILITIES
 * - MVC_MSTAFF_DATA
 * - MVC_PENAITY_ARTICAL
 * - MVC_FAC_DECISION
 * - MVC_PENALTY_DES_FAC
 * - MVC_FAC_SMS
 * - MVC_PAYMENT_FAC
 * - MVC_MSTAFF_DECISION
 * - MVC_PENALTY_DES_MSTAFF
 * - MVC_MSTAFF_SMS
 * - MVC_PAYMENT_MSTAFF
 */

export interface MvcVpiFacilityType {
  FACILITY_TYPE_SN: number;
  FACILITY_TYPE_DESC: string;
}

export interface MvcVpiFacility {
  FACILITY_SERIAL: number;
  FACILITY_NAME: string;
  FACILITY_TYPE: number; // FK to MVC_VPI_FACILTIES_TYPES.FACILITY_TYPE_SN
  LICENSE_NUMBER: string;
  MOBILE: string;
  EMAIL: string;
  ADD_UNIT?: string;
  CREATE_BY: string;
  CREATE_DATE: string;
  UPDATE_BY?: string;
  UPDATE_DATE?: string;
  ADD_STREET: string;
  ADD_BUILD_NO: string;
  ADD_BUILD_NO2?: string;
  ADD_DIST: string;
  ADD_CITY: string;
  ADD_POSTCODE?: string;
  LICENSE_DATE: string;
  COM_LICENSE_NO: string;
  COM_START_DATE: string;
  COM_END_DATE: string;
  FILE_NAME?: string;
  CR_NO: string;
  PRV_GOV: string;
}

export interface MvcMstaffData {
  STAFF_SERIAL: number;
  FULL_NAME: string;
  NATIONAL_ID: string;
  JOB_LOCATION: string;
  TYPE_JOB_LOC: string;
  MOBIE_NUM: string;
  CREATE_BY: string;
  CREATE_DATE: string;
  UPDATE_BY?: string;
  UPDATE_DATE?: string;
  EMAIL: string;
  ADD_UNIT?: string;
  ADD_STREET: string;
  ADD_BUILD_NO: string;
  ADD_BUILD_NO2?: string;
  ADD_DIST: string;
  ADD_CITY: string;
  ADD_POSTCODE?: string;
  FILE_NAME?: string;
  NATIONALITY: string;
  GENDR: 'ذكر' | 'أنثى';
  DEGREE: string;
  LIS_END_DATE: string;
  VAC_DATE?: string;
  FACILILTY_SERIAL: number; // FK to MVC_VPI_FACILITIES.FACILITY_SERIAL
}

export interface MvcPenaltyArtical {
  ARTICAL_ID: number;
  ARTICAL_NAME: string;
  ARTICAL_DISCRIPTION: string;
  ARTICAL_TYPE: 'منشآت' | 'ممارسين' | 'مشترك';
}

export interface MvcFacDecision {
  DECISION_FAC_ID: number;
  DECISION_DATE_G: string;
  DECISION_DATE_H: string;
  INTERNAL_REF_SAHL: string;
  SAHL_DATE: string;
  FACILITIE_ID: number; // FK to MVC_VPI_FACILITIES.FACILITY_SERIAL
  DEPARTMENT: string;
  CREATE_BY: string;
  NEED_SMS: number; // DEFAULT 1
  PAYED: number; // 0 = غير مسدد, 1 = مسدد جزئي, 2 = مسدد بالكامل
  DECISION_ID: string; // e.g. "ق-م/1447/082"
  CREATED_DATE: string;
  FILE_NAME?: string;
}

export interface MvcPenaltyDesFac {
  PEN_DES_FAC_ID: number;
  DECISION_ID: number; // FK to MVC_FAC_DECISION.DECISION_FAC_ID
  ARTICAL_ID: number; // FK to MVC_PENAITY_ARTICAL.ARTICAL_ID
  AMOUNT: number;
  PENALTY_TYP: string; // "غرامة مالية", "إغلاق مؤقت", "سحب ترخيص", "إنذار رسمي"
  PENALTY_NAME: string;
}

export interface MvcFacSms {
  SMS_ID: number;
  NOTC_1_DATE?: string;
  NOTC_1_JSON?: string;
  NOTC_2_DATE?: string;
  NOTC_2_JSON?: string;
  NOTC_1_STATUS: string; // "تم الإرسال", "قيد المعالجة", "فشل"
  NOTC_1_STAT_DES?: string;
  NOTC_2_STATUS?: string;
  NOTC_2_STAT_DES?: string;
  DECISION_FAC_ID: number; // FK to MVC_FAC_DECISION.DECISION_FAC_ID
  MOBILE: string;
  NOTC_1_GUID?: string;
  NOTC_2_GUID?: string;
  MOBILE_2?: string;
  UPDATE_DATE: string;
}

export interface MvcPaymentFac {
  PAYMENT_ID: number;
  RECEIPT_DATE: string;
  RECEIPT_AMOUNT: number;
  DECISION_ID: number; // FK to MVC_FAC_DECISION.DECISION_FAC_ID
  PEN_DES_FAC_ID?: number; // FK to MVC_PENALTY_DES_FAC.PEN_DES_FAC_ID
  CREATED_DATE: string;
  CREATED_BY: string;
  FILE_NAME?: string;
  RECIPT_ID: string; // "REC-..."
}

export interface MvcMstaffDecision {
  DECISION_MSTAFF_ID: number;
  DECISION_DATE_G: string;
  DECISION_DATE_H: string;
  INTERNAL_REF_SAHL: string;
  SAHL_DATE: string;
  MSTAFF_ID: number; // FK to MVC_MSTAFF_DATA.STAFF_SERIAL
  CREATE_BY: string;
  NEED_SMS: number; // DEFAULT 1
  PAYED: number; // 0 = غير مسدد, 1 = مسدد جزئي, 2 = مسدد بالكامل
  DECISION_ID: string;
  DEC_SOURCE: string;
  CREATED_DATE: string;
  FILE_NAME?: string;
}

export interface MvcPenaltyDesMstaff {
  PEN_DES_MSTAFF_ID: number;
  DECISION_ID: number; // FK to MVC_MSTAFF_DECISION.DECISION_MSTAFF_ID
  ARTICAL_ID: number; // FK to MVC_PENAITY_ARTICAL.ARTICAL_ID
  AMOUNT: number;
  PENALTY_TYP: string;
  PENALTY_NAME: string;
}

export interface MvcMstaffSms {
  SMS_ID: number;
  NOTC_1_DATE?: string;
  NOTC_1_JSON?: string;
  NOTC_2_DATE?: string;
  NOTC_2_JSON?: string;
  NOTC_1_STATUS: string;
  NOTC_1_STAT_DES?: string;
  NOTC_2_STATUS?: string;
  NOTC_2_STAT_DES?: string;
  DECISION_MSTAFF_ID: number; // FK to MVC_MSTAFF_DECISION.DECISION_MSTAFF_ID
  MOBILE: string;
  NOTC_1_GUID?: string;
  NOTC_2_GUID?: string;
  MOBILE_2?: string;
  UPDATE_DATE: string;
}

export interface MvcPaymentMstaff {
  PAYMENT_ID: number;
  RECEIPT_DATE: string;
  RECEIPT_AMOUNT: number;
  DECISION_ID: number; // FK to MVC_MSTAFF_DECISION.DECISION_MSTAFF_ID
  PEN_DES_MSTAFF_ID?: number;
  CREATED_DATE: string;
  CREATED_BY: string;
  FILE_NAME?: string;
  RECIPT_ID: string;
}

// Joined / Populated response models
export interface FullFacDecision extends MvcFacDecision {
  facility?: MvcVpiFacility;
  facilityType?: MvcVpiFacilityType;
  items: (MvcPenaltyDesFac & { article?: MvcPenaltyArtical })[];
  totalAmount: number;
  paidAmount: number;
  sms?: MvcFacSms;
  payments: MvcPaymentFac[];
}

export interface FullStaffDecision extends MvcMstaffDecision {
  staff?: MvcMstaffData;
  facility?: MvcVpiFacility;
  items: (MvcPenaltyDesMstaff & { article?: MvcPenaltyArtical })[];
  totalAmount: number;
  paidAmount: number;
  sms?: MvcMstaffSms;
  payments: MvcPaymentMstaff[];
}
