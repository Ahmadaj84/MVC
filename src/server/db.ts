import {
  MvcVpiFacilityType,
  MvcVpiFacility,
  MvcMstaffData,
  MvcPenaltyArtical,
  MvcFacDecision,
  MvcPenaltyDesFac,
  MvcFacSms,
  MvcPaymentFac,
  MvcMstaffDecision,
  MvcPenaltyDesMstaff,
  MvcMstaffSms,
  MvcPaymentMstaff,
  FullFacDecision,
  FullStaffDecision
} from '../types/database';

// In-Memory Database store initialized with realistic Saudi Health Inspection dataset
export class MvcDatabase {
  facilityTypes: MvcVpiFacilityType[] = [];
  facilities: MvcVpiFacility[] = [];
  staff: MvcMstaffData[] = [];
  articles: MvcPenaltyArtical[] = [];
  facDecisions: MvcFacDecision[] = [];
  penaltyDesFac: MvcPenaltyDesFac[] = [];
  facSms: MvcFacSms[] = [];
  paymentFac: MvcPaymentFac[] = [];
  staffDecisions: MvcMstaffDecision[] = [];
  penaltyDesStaff: MvcPenaltyDesMstaff[] = [];
  staffSms: MvcMstaffSms[] = [];
  paymentStaff: MvcPaymentMstaff[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Facility Types
    this.facilityTypes = [
      { FACILITY_TYPE_SN: 1, FACILITY_TYPE_DESC: 'مستشفى عام' },
      { FACILITY_TYPE_SN: 2, FACILITY_TYPE_DESC: 'مستشفى تخصصي' },
      { FACILITY_TYPE_SN: 3, FACILITY_TYPE_DESC: 'مجمع عيادات طبية عامة' },
      { FACILITY_TYPE_SN: 4, FACILITY_TYPE_DESC: 'مجمع عيادات أسنان متخصصة' },
      { FACILITY_TYPE_SN: 5, FACILITY_TYPE_DESC: 'صيدلية مجتمعية' },
      { FACILITY_TYPE_SN: 6, FACILITY_TYPE_DESC: 'مختبر تحاليل طبية' },
      { FACILITY_TYPE_SN: 7, FACILITY_TYPE_DESC: 'مركز أشعة تشخيصية' },
      { FACILITY_TYPE_SN: 8, FACILITY_TYPE_DESC: 'مركز علاج طبيعي وتأهيل' },
    ];

    // 2. Facilities (MVC_VPI_FACILITIES)
    this.facilities = [
      {
        FACILITY_SERIAL: 101,
        FACILITY_NAME: 'مستشفى دار الشفاء التخصصي',
        FACILITY_TYPE: 2,
        LICENSE_NUMBER: 'LIC-MOH-2023-0941',
        MOBILE: '0501234567',
        EMAIL: 'admin@darshifa-med.sa',
        ADD_UNIT: '12',
        CREATE_BY: 'أحمد السعدون',
        CREATE_DATE: '2023-01-15',
        UPDATE_BY: 'خالد العمري',
        UPDATE_DATE: '2024-05-10',
        ADD_STREET: 'طريق الملك فهد',
        ADD_BUILD_NO: '7412',
        ADD_BUILD_NO2: '3201',
        ADD_DIST: 'حي العليا',
        ADD_CITY: 'الرياض',
        ADD_POSTCODE: '12214',
        LICENSE_DATE: '2023-01-10',
        COM_LICENSE_NO: 'CR-1010948210',
        COM_START_DATE: '2022-12-01',
        COM_END_DATE: '2027-12-01',
        CR_NO: '1010948210',
        PRV_GOV: 'منطقة الرياض',
        FILE_NAME: 'facility_101_license.pdf'
      },
      {
        FACILITY_SERIAL: 102,
        FACILITY_NAME: 'مجمع النخبة الطبي المتكامل',
        FACILITY_TYPE: 3,
        LICENSE_NUMBER: 'LIC-MOH-2022-4819',
        MOBILE: '0559876543',
        EMAIL: 'info@elitemedical.com.sa',
        ADD_UNIT: '04',
        CREATE_BY: 'سلطان القحطاني',
        CREATE_DATE: '2022-06-20',
        ADD_STREET: 'شارع الأمير سلطان',
        ADD_BUILD_NO: '3150',
        ADD_DIST: 'حي الروضة',
        ADD_CITY: 'جدة',
        ADD_POSTCODE: '23432',
        LICENSE_DATE: '2022-06-15',
        COM_LICENSE_NO: 'CR-4030198421',
        COM_START_DATE: '2022-05-01',
        COM_END_DATE: '2027-05-01',
        CR_NO: '4030198421',
        PRV_GOV: 'منطقة مكة المكرمة',
        FILE_NAME: 'facility_102_doc.pdf'
      },
      {
        FACILITY_SERIAL: 103,
        FACILITY_NAME: 'صيدليات بلسم الدواء الحديثة',
        FACILITY_TYPE: 5,
        LICENSE_NUMBER: 'LIC-MOH-2024-1102',
        MOBILE: '0543322110',
        EMAIL: 'compliance@balsam-rx.sa',
        CREATE_BY: 'فهد المطيري',
        CREATE_DATE: '2024-02-01',
        ADD_STREET: 'شارع الظهران',
        ADD_BUILD_NO: '1820',
        ADD_DIST: 'حي الدانة',
        ADD_CITY: 'الخبر',
        ADD_POSTCODE: '34251',
        LICENSE_DATE: '2024-01-20',
        COM_LICENSE_NO: 'CR-2051087422',
        COM_START_DATE: '2024-01-01',
        COM_END_DATE: '2029-01-01',
        CR_NO: '2051087422',
        PRV_GOV: 'المنطقة الشرقية',
        FILE_NAME: 'facility_103_cert.pdf'
      },
      {
        FACILITY_SERIAL: 104,
        FACILITY_NAME: 'مختبرات الدقة الحيوية للتحاليل',
        FACILITY_TYPE: 6,
        LICENSE_NUMBER: 'LIC-MOH-2023-8831',
        MOBILE: '0567788990',
        EMAIL: 'lab@biodiqqa.sa',
        CREATE_BY: 'منصور الغامدي',
        CREATE_DATE: '2023-08-14',
        ADD_STREET: 'طريق الملك عبدالله',
        ADD_BUILD_NO: '4900',
        ADD_DIST: 'حي المنتزه',
        ADD_CITY: 'الدمام',
        ADD_POSTCODE: '32414',
        LICENSE_DATE: '2023-08-01',
        COM_LICENSE_NO: 'CR-2050198273',
        COM_START_DATE: '2023-07-01',
        COM_END_DATE: '2028-07-01',
        CR_NO: '2050198273',
        PRV_GOV: 'المنطقة الشرقية'
      }
    ];

    // 3. Medical Staff (MVC_MSTAFF_DATA)
    this.staff = [
      {
        STAFF_SERIAL: 201,
        FULL_NAME: 'د. طارق بن عبدالمحسن الرشيد',
        NATIONAL_ID: '1084920194',
        JOB_LOCATION: 'مستشفى دار الشفاء التخصصي',
        TYPE_JOB_LOC: 'قطاع صحي خاص',
        MOBIE_NUM: '0503344556',
        CREATE_BY: 'سالم الدوسري',
        CREATE_DATE: '2023-03-10',
        EMAIL: 'dr.tareq@darshifa-med.sa',
        ADD_UNIT: '08',
        ADD_STREET: 'شارع التخصصي',
        ADD_BUILD_NO: '5510',
        ADD_DIST: 'حي النخيل',
        ADD_CITY: 'الرياض',
        ADD_POSTCODE: '12384',
        NATIONALITY: 'سعودي',
        GENDR: 'ذكر',
        DEGREE: 'استشاري جراحة عامة',
        LIS_END_DATE: '2027-04-15',
        VAC_DATE: '2024-03-01',
        FACILILTY_SERIAL: 101,
        FILE_NAME: 'staff_201_cv.pdf'
      },
      {
        STAFF_SERIAL: 202,
        FULL_NAME: 'د. نورة بنت سالم الشهري',
        NATIONAL_ID: '1092837461',
        JOB_LOCATION: 'مجمع النخبة الطبي المتكامل',
        TYPE_JOB_LOC: 'قطاع صحي خاص',
        MOBIE_NUM: '0551122334',
        CREATE_BY: 'أماني الحربي',
        CREATE_DATE: '2023-07-22',
        EMAIL: 'noura.shehri@elitemedical.com.sa',
        ADD_STREET: 'طريق المدينة',
        ADD_BUILD_NO: '2103',
        ADD_DIST: 'حي السلامة',
        ADD_CITY: 'جدة',
        ADD_POSTCODE: '23524',
        NATIONALITY: 'سعودي',
        GENDR: 'أنثى',
        DEGREE: 'نائب أول جلدية وتجميل',
        LIS_END_DATE: '2026-09-30',
        FACILILTY_SERIAL: 102
      },
      {
        STAFF_SERIAL: 203,
        FULL_NAME: 'د. يوسف إبراهيم قاسم',
        NATIONAL_ID: '2489201834',
        JOB_LOCATION: 'صيدليات بلسم الدواء الحديثة',
        TYPE_JOB_LOC: 'صيدلية أهلية',
        MOBIE_NUM: '0547788112',
        CREATE_BY: 'ماجد العتيبي',
        CREATE_DATE: '2024-03-05',
        EMAIL: 'yousef.kasem@balsam-rx.sa',
        ADD_STREET: 'شارع الملك خالد',
        ADD_BUILD_NO: '1109',
        ADD_DIST: 'حي العقربية',
        ADD_CITY: 'الخبر',
        NATIONALITY: 'مقيم (مصر)',
        GENDR: 'ذكر',
        DEGREE: 'صيدلي قانوني',
        LIS_END_DATE: '2025-11-20',
        FACILILTY_SERIAL: 103
      },
      {
        STAFF_SERIAL: 204,
        FULL_NAME: 'ماري كريستينا سانتوس',
        NATIONAL_ID: '2398471920',
        JOB_LOCATION: 'مستشفى دار الشفاء التخصصي',
        TYPE_JOB_LOC: 'تمريض ورعاية',
        MOBIE_NUM: '0562233445',
        CREATE_BY: 'سالم الدوسري',
        CREATE_DATE: '2023-04-18',
        EMAIL: 'm.santoss@darshifa-med.sa',
        ADD_STREET: 'شارع الأمير تركي',
        ADD_BUILD_NO: '8830',
        ADD_DIST: 'حي المروج',
        ADD_CITY: 'الرياض',
        NATIONALITY: 'مقيم (فلبين)',
        GENDR: 'أنثى',
        DEGREE: 'أخصائي تمريض عناية مركزة',
        LIS_END_DATE: '2026-02-14',
        FACILILTY_SERIAL: 101
      }
    ];

    // 4. Penalty Articles (MVC_PENAITY_ARTICAL)
    this.articles = [
      {
        ARTICAL_ID: 1,
        ARTICAL_NAME: 'المادة (20) - تشغيل كوادر غير مرخصة',
        ARTICAL_DISCRIPTION: 'تشغيل ممارسين صحيين أو فنيين دون الحصول على ترخيص مزاولة المهنة النظامي الصادر من وزارة الصحة أو الهيئة السعودية للتخصصات الصحية.',
        ARTICAL_TYPE: 'منشآت'
      },
      {
        ARTICAL_ID: 2,
        ARTICAL_NAME: 'المادة (23) - مخالفة معايير مكافحة العدوى والتعقيم',
        ARTICAL_DISCRIPTION: 'عدم الالتزام بدليل وسياسات مكافحة العدوى المعتمدة من الوزارة وقصور إجراءات التخلص الآمن من النفايات الطبية الخطرة.',
        ARTICAL_TYPE: 'منشآت'
      },
      {
        ARTICAL_ID: 3,
        ARTICAL_NAME: 'المادة (14) - نقص التجهيزات والأجهزة الطبية الأساسية',
        ARTICAL_DISCRIPTION: 'عدم توفير الحد الأدنى من الأجهزة أو سيارات الإسعاف أو أجهزة الإنعاش القلبي الرئوي في أقسام الطوارئ والعيادات.',
        ARTICAL_TYPE: 'منشآت'
      },
      {
        ARTICAL_ID: 4,
        ARTICAL_NAME: 'المادة (28) - صرف أدوية مقيدة دون وصفة طبية نظامية',
        ARTICAL_DISCRIPTION: 'صرف مستحضرات صيدلانية أو أدوية نفسية ومراقبة دون التحقق من وجود وصفة طبية إلكترونية معتمدة من منصة وصفتي.',
        ARTICAL_TYPE: 'مشترك'
      },
      {
        ARTICAL_ID: 5,
        ARTICAL_NAME: 'المادة (31) - ممارسة المهنة بترخيص منتهي الصلاحية',
        ARTICAL_DISCRIPTION: 'استمرار الممارس الصحي في مزاولة العمل الإكلينيكي أو التشخيصي بعد انتهاء سريان ترخيص مزاولة المهنة.',
        ARTICAL_TYPE: 'ممارسين'
      },
      {
        ARTICAL_ID: 6,
        ARTICAL_NAME: 'المادة (33) - تجاوز حدود الاختصاص أو التصنيف المهني',
        ARTICAL_DISCRIPTION: 'قيام الممارس بإجراء تدخلات جراحية أو وصفات علاجية تفوق درجته العلمية أو تخصصه المصنف في الهيئة.',
        ARTICAL_TYPE: 'ممارسين'
      },
      {
        ARTICAL_ID: 7,
        ARTICAL_NAME: 'المادة (19) - الإعلان الطبي المضلل دون ترخيص مسبق',
        ARTICAL_DISCRIPTION: 'نشر إعلانات ترويجية لخدمات أو علاجات طبية عبر وسائل التواصل الاجتماعي دون الحصول على موافقة اللجنة المختصة.',
        ARTICAL_TYPE: 'مشترك'
      }
    ];

    // 5. Facility Decisions (MVC_FAC_DECISION)
    this.facDecisions = [
      {
        DECISION_FAC_ID: 1001,
        DECISION_DATE_G: '2025-01-20',
        DECISION_DATE_H: '1446-07-20',
        INTERNAL_REF_SAHL: 'SHL-2025-00841',
        SAHL_DATE: '2025-01-18',
        FACILITIE_ID: 101,
        DEPARTMENT: 'لجنة النظر في مخالفات المؤسسات الصحية الخاصة - الرياض',
        CREATE_BY: 'المستشار القانوني/ عبدالله التميمي',
        NEED_SMS: 1,
        PAYED: 1, // جزئي
        DECISION_ID: 'ق-م/1446/102',
        CREATED_DATE: '2025-01-20',
        FILE_NAME: 'decision_fac_1001.pdf'
      },
      {
        DECISION_FAC_ID: 1002,
        DECISION_DATE_G: '2025-02-05',
        DECISION_DATE_H: '1446-08-06',
        INTERNAL_REF_SAHL: 'SHL-2025-01290',
        SAHL_DATE: '2025-02-03',
        FACILITIE_ID: 102,
        DEPARTMENT: 'لجنة النظر في مخالفات المؤسسات الصحية الخاصة - جدة',
        CREATE_BY: 'المستشار القانوني/ هاني الحربي',
        NEED_SMS: 1,
        PAYED: 0, // غير مسدد
        DECISION_ID: 'ق-م/1446/158',
        CREATED_DATE: '2025-02-05',
        FILE_NAME: 'decision_fac_1002.pdf'
      },
      {
        DECISION_FAC_ID: 1003,
        DECISION_DATE_G: '2024-11-12',
        DECISION_DATE_H: '1446-05-10',
        INTERNAL_REF_SAHL: 'SHL-2024-09941',
        SAHL_DATE: '2024-11-10',
        FACILITIE_ID: 103,
        DEPARTMENT: 'لجنة النظر في مخالفات المؤسسات الصحية الخاصة - الشرقية',
        CREATE_BY: 'المستشار القانوني/ فيصل الشمري',
        NEED_SMS: 1,
        PAYED: 2, // مسدد بالكامل
        DECISION_ID: 'ق-م/1446/049',
        CREATED_DATE: '2024-11-12',
        FILE_NAME: 'decision_fac_1003.pdf'
      }
    ];

    // 6. Facility Penalty Items (MVC_PENALTY_DES_FAC)
    this.penaltyDesFac = [
      {
        PEN_DES_FAC_ID: 5001,
        DECISION_ID: 1001,
        ARTICAL_ID: 1,
        AMOUNT: 30000,
        PENALTY_TYP: 'غرامة مالية',
        PENALTY_NAME: 'تشغيل عدد 2 ممرض دون تصريح ساري'
      },
      {
        PEN_DES_FAC_ID: 5002,
        DECISION_ID: 1001,
        ARTICAL_ID: 2,
        AMOUNT: 20000,
        PENALTY_TYP: 'غرامة مالية',
        PENALTY_NAME: 'خلل في مسار النفايات الطبية في غرفة العمليات'
      },
      {
        PEN_DES_FAC_ID: 5003,
        DECISION_ID: 1002,
        ARTICAL_ID: 3,
        AMOUNT: 50000,
        PENALTY_TYP: 'غرامة مالية مع إشعار تصحيح',
        PENALTY_NAME: 'تعطل جهاز الصدمات الكهربائية في العيادات التخصصية'
      },
      {
        PEN_DES_FAC_ID: 5004,
        DECISION_ID: 1003,
        ARTICAL_ID: 4,
        AMOUNT: 15000,
        PENALTY_TYP: 'غرامة مالية',
        PENALTY_NAME: 'صرف أدوية منوم ومضادات دون قيد الوصفة السحابية'
      }
    ];

    // 7. Facility SMS (MVC_FAC_SMS)
    this.facSms = [
      {
        SMS_ID: 7001,
        DECISION_FAC_ID: 1001,
        MOBILE: '0501234567',
        MOBILE_2: '0509988776',
        NOTC_1_DATE: '2025-01-20 10:15:00',
        NOTC_1_JSON: JSON.stringify({
          recipient: 'مستشفى دار الشفاء التخصصي',
          decision_no: 'ق-م/1446/102',
          amount: 50000,
          sahl_ref: 'SHL-2025-00841',
          text: 'عزيزي المنشأة، صدر قرار المخالفة رقم ق-م/1446/102 بقيمة 50000 ريال. يرجى السداد عبر منصة سداد أو سهل خلال 30 يوماً.'
        }),
        NOTC_1_STATUS: 'تم الإرسال',
        NOTC_1_STAT_DES: 'تم التسليم بنجاح لشبكة الاتصالات',
        NOTC_1_GUID: 'SMS-GUID-8491-01',
        NOTC_2_DATE: '2025-02-10 09:00:00',
        NOTC_2_JSON: JSON.stringify({
          text: 'تذكير: تبقى جزء من مبلغ القرار رقم ق-م/1446/102، يرجى استكمال السداد لتفادي إيقاف الخدمات.'
        }),
        NOTC_2_STATUS: 'تم الإرسال',
        NOTC_2_STAT_DES: 'تم التسليم',
        NOTC_2_GUID: 'SMS-GUID-8491-02',
        UPDATE_DATE: '2025-02-10 09:05:00'
      },
      {
        SMS_ID: 7002,
        DECISION_FAC_ID: 1002,
        MOBILE: '0559876543',
        NOTC_1_DATE: '2025-02-05 11:30:00',
        NOTC_1_JSON: JSON.stringify({
          recipient: 'مجمع النخبة الطبي المتكامل',
          decision_no: 'ق-م/1446/158',
          amount: 50000,
          text: 'عزيزي المنشأة، صدر قرار المخالفة رقم ق-م/1446/158 بقيمة 50000 ريال. سارع بالسداد.'
        }),
        NOTC_1_STATUS: 'تم الإرسال',
        NOTC_1_STAT_DES: 'تم التسليم',
        NOTC_1_GUID: 'SMS-GUID-9912-01',
        UPDATE_DATE: '2025-02-05 11:32:00'
      },
      {
        SMS_ID: 7003,
        DECISION_FAC_ID: 1003,
        MOBILE: '0543322110',
        NOTC_1_DATE: '2024-11-12 14:20:00',
        NOTC_1_JSON: JSON.stringify({
          text: 'تم صدور قرار المخالفة رقم ق-م/1446/049 بمبلغ 15000 ريال.'
        }),
        NOTC_1_STATUS: 'تم الإرسال',
        NOTC_1_STAT_DES: 'تم التسليم للمشترك',
        NOTC_1_GUID: 'SMS-GUID-7711-01',
        UPDATE_DATE: '2024-11-12 14:22:00'
      }
    ];

    // 8. Facility Payments (MVC_PAYMENT_FAC)
    this.paymentFac = [
      {
        PAYMENT_ID: 9001,
        RECEIPT_DATE: '2025-01-25',
        RECEIPT_AMOUNT: 30000,
        DECISION_ID: 1001,
        PEN_DES_FAC_ID: 5001,
        CREATED_DATE: '2025-01-25',
        CREATED_BY: 'محاسب الخزينة/ يوسف الناصر',
        RECIPT_ID: 'REC-SADAD-2025-001',
        FILE_NAME: 'receipt_sadad_9001.pdf'
      },
      {
        PAYMENT_ID: 9002,
        RECEIPT_DATE: '2024-11-20',
        RECEIPT_AMOUNT: 15000,
        DECISION_ID: 1003,
        PEN_DES_FAC_ID: 5004,
        CREATED_DATE: '2024-11-20',
        CREATED_BY: 'محاسب الخزينة/ يوسف الناصر',
        RECIPT_ID: 'REC-SADAD-2024-884',
        FILE_NAME: 'receipt_sadad_9002.pdf'
      }
    ];

    // 9. Medical Staff Decisions (MVC_MSTAFF_DECISION)
    this.staffDecisions = [
      {
        DECISION_MSTAFF_ID: 2001,
        DECISION_DATE_G: '2025-01-14',
        DECISION_DATE_H: '1446-07-14',
        INTERNAL_REF_SAHL: 'SHL-STF-2025-0031',
        SAHL_DATE: '2025-01-12',
        MSTAFF_ID: 202,
        CREATE_BY: 'المستشار/ زياد الدوسري',
        NEED_SMS: 1,
        PAYED: 0, // غير مسدد
        DECISION_ID: 'ق-ص/1446/077',
        DEC_SOURCE: 'لجنة مخالفات نظام مزاولة المهن الصحية بمنطقة مكة المكرمة',
        CREATED_DATE: '2025-01-14',
        FILE_NAME: 'staff_dec_2001.pdf'
      },
      {
        DECISION_MSTAFF_ID: 2002,
        DECISION_DATE_G: '2024-12-01',
        DECISION_DATE_H: '1446-05-29',
        INTERNAL_REF_SAHL: 'SHL-STF-2024-0912',
        SAHL_DATE: '2024-11-28',
        MSTAFF_ID: 203,
        CREATE_BY: 'المستشار/ عبدالرحمن العتيبي',
        NEED_SMS: 1,
        PAYED: 2, // مسدد بالكامل
        DECISION_ID: 'ق-ص/1446/021',
        DEC_SOURCE: 'لجنة مخالفات نظام مزاولة المهن الصحية بالمنطقة الشرقية',
        CREATED_DATE: '2024-12-01',
        FILE_NAME: 'staff_dec_2002.pdf'
      }
    ];

    // 10. Staff Penalty Items (MVC_PENALTY_DES_MSTAFF)
    this.penaltyDesStaff = [
      {
        PEN_DES_MSTAFF_ID: 6001,
        DECISION_ID: 2001,
        ARTICAL_ID: 6,
        AMOUNT: 25000,
        PENALTY_TYP: 'غرامة مالية مع إنذار خطي',
        PENALTY_NAME: 'إجراء خيوط شد الوجه دون حيازة ترخيص اختصاص دقيق مصرح'
      },
      {
        PEN_DES_MSTAFF_ID: 6002,
        DECISION_ID: 2002,
        ARTICAL_ID: 5,
        AMOUNT: 10000,
        PENALTY_TYP: 'غرامة مالية',
        PENALTY_NAME: 'استمرار العمل الصيدلي لمدة 45 يوماً بعد انتهاء التصنيف المهني'
      }
    ];

    // 11. Staff SMS (MVC_MSTAFF_SMS)
    this.staffSms = [
      {
        SMS_ID: 8001,
        DECISION_MSTAFF_ID: 2001,
        MOBILE: '0551122334',
        NOTC_1_DATE: '2025-01-14 12:00:00',
        NOTC_1_JSON: JSON.stringify({
          recipient: 'د. نورة بنت سالم الشهري',
          decision_no: 'ق-ص/1446/077',
          amount: 25000,
          text: 'عزيزي الممارس الصحي، صدر بحقكم قرار اللجنة رقم ق-ص/1446/077 بمبلغ 25000 ريال. يرجى السداد خلال المهلة النظامية.'
        }),
        NOTC_1_STATUS: 'تم الإرسال',
        NOTC_1_STAT_DES: 'تم التسليم بنجاح للممارس',
        NOTC_1_GUID: 'SMS-STF-9941',
        UPDATE_DATE: '2025-01-14 12:02:00'
      },
      {
        SMS_ID: 8002,
        DECISION_MSTAFF_ID: 2002,
        MOBILE: '0547788112',
        NOTC_1_DATE: '2024-12-01 15:10:00',
        NOTC_1_JSON: JSON.stringify({
          text: 'صدر قرار المخالفة رقم ق-ص/1446/021 بمبلغ 10000 ريال.'
        }),
        NOTC_1_STATUS: 'تم الإرسال',
        NOTC_1_STAT_DES: 'تم التسليم',
        NOTC_1_GUID: 'SMS-STF-8812',
        UPDATE_DATE: '2024-12-01 15:11:00'
      }
    ];

    // 12. Staff Payment (MVC_PAYMENT_MSTAFF)
    this.paymentStaff = [
      {
        PAYMENT_ID: 9501,
        RECEIPT_DATE: '2024-12-10',
        RECEIPT_AMOUNT: 10000,
        DECISION_ID: 2002,
        PEN_DES_MSTAFF_ID: 6002,
        CREATED_DATE: '2024-12-10',
        CREATED_BY: 'محاسب الخزينة/ يوسف الناصر',
        RECIPT_ID: 'REC-STF-2024-109',
        FILE_NAME: 'stf_rec_9501.pdf'
      }
    ];
  }

  // Helper Methods for Full Facility Decisions
  getFullFacDecisions(): FullFacDecision[] {
    return this.facDecisions.map(dec => {
      const facility = this.facilities.find(f => f.FACILITY_SERIAL === dec.FACILITIE_ID);
      const facilityType = facility ? this.facilityTypes.find(t => t.FACILITY_TYPE_SN === facility.FACILITY_TYPE) : undefined;
      const rawItems = this.penaltyDesFac.filter(item => item.DECISION_ID === dec.DECISION_FAC_ID);
      const items = rawItems.map(item => ({
        ...item,
        article: this.articles.find(a => a.ARTICAL_ID === item.ARTICAL_ID)
      }));
      const totalAmount = items.reduce((sum, it) => sum + (Number(it.AMOUNT) || 0), 0);
      const payments = this.paymentFac.filter(p => p.DECISION_ID === dec.DECISION_FAC_ID);
      const paidAmount = payments.reduce((sum, p) => sum + (Number(p.RECEIPT_AMOUNT) || 0), 0);
      const sms = this.facSms.find(s => s.DECISION_FAC_ID === dec.DECISION_FAC_ID);

      return {
        ...dec,
        facility,
        facilityType,
        items,
        totalAmount,
        paidAmount,
        sms,
        payments
      };
    });
  }

  // Helper Methods for Full Staff Decisions
  getFullStaffDecisions(): FullStaffDecision[] {
    return this.staffDecisions.map(dec => {
      const staffMember = this.staff.find(s => s.STAFF_SERIAL === dec.MSTAFF_ID);
      const facility = staffMember ? this.facilities.find(f => f.FACILITY_SERIAL === staffMember.FACILILTY_SERIAL) : undefined;
      const rawItems = this.penaltyDesStaff.filter(item => item.DECISION_ID === dec.DECISION_MSTAFF_ID);
      const items = rawItems.map(item => ({
        ...item,
        article: this.articles.find(a => a.ARTICAL_ID === item.ARTICAL_ID)
      }));
      const totalAmount = items.reduce((sum, it) => sum + (Number(it.AMOUNT) || 0), 0);
      const payments = this.paymentStaff.filter(p => p.DECISION_ID === dec.DECISION_MSTAFF_ID);
      const paidAmount = payments.reduce((sum, p) => sum + (Number(p.RECEIPT_AMOUNT) || 0), 0);
      const sms = this.staffSms.find(s => s.DECISION_MSTAFF_ID === dec.DECISION_MSTAFF_ID);

      return {
        ...dec,
        staff: staffMember,
        facility,
        items,
        totalAmount,
        paidAmount,
        sms,
        payments
      };
    });
  }

  // Update payment status based on total and paid amounts
  updateFacPaymentStatus(decisionFacId: number) {
    const dec = this.facDecisions.find(d => d.DECISION_FAC_ID === decisionFacId);
    if (!dec) return;
    const items = this.penaltyDesFac.filter(i => i.DECISION_ID === decisionFacId);
    const total = items.reduce((sum, i) => sum + (Number(i.AMOUNT) || 0), 0);
    const payments = this.paymentFac.filter(p => p.DECISION_ID === decisionFacId);
    const paid = payments.reduce((sum, p) => sum + (Number(p.RECEIPT_AMOUNT) || 0), 0);

    if (total === 0) {
      dec.PAYED = 0;
    } else if (paid >= total) {
      dec.PAYED = 2; // مسدد بالكامل
    } else if (paid > 0) {
      dec.PAYED = 1; // جزئي
    } else {
      dec.PAYED = 0; // غير مسدد
    }
  }

  updateStaffPaymentStatus(decisionStaffId: number) {
    const dec = this.staffDecisions.find(d => d.DECISION_MSTAFF_ID === decisionStaffId);
    if (!dec) return;
    const items = this.penaltyDesStaff.filter(i => i.DECISION_ID === decisionStaffId);
    const total = items.reduce((sum, i) => sum + (Number(i.AMOUNT) || 0), 0);
    const payments = this.paymentStaff.filter(p => p.DECISION_ID === decisionStaffId);
    const paid = payments.reduce((sum, p) => sum + (Number(p.RECEIPT_AMOUNT) || 0), 0);

    if (total === 0) {
      dec.PAYED = 0;
    } else if (paid >= total) {
      dec.PAYED = 2; // مسدد بالكامل
    } else if (paid > 0) {
      dec.PAYED = 1; // جزئي
    } else {
      dec.PAYED = 0; // غير مسدد
    }
  }
}

export const db = new MvcDatabase();
