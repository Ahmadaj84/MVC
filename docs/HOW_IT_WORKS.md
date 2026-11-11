# How the MVC system works

This guide follows one piece of data, a **facility violation decision**, from the
database tables to the screen. It then shows the reverse direction: saving a payment
from the screen back into the tables.

> **Important:** the app does **not** connect to a real Oracle database yet.
> The "tables" are JavaScript arrays held in memory in `src/server/db.ts`. They
> have the same names and columns as the Oracle schema (`src/server/oracleDdl.ts`),
> and the code is written so the arrays can be swapped for real SQL queries later.
> Because the data is in memory, it resets every time the server restarts.

---

## 1. The big picture

```
 ┌──────────────────────────── BROWSER (React) ────────────────────────────┐
 │                                                                         │
 │  FacilityDecisionsView.tsx   ← draws the table on screen                │
 │          ▲  props: decisions[]                                          │
 │  App.tsx  (useState + loadAllData)   ← keeps the data, passes it down   │
 │          ▲  calls                                                       │
 │  services/api.ts   ← fetch('/api/facility-decisions')                   │
 └──────────┼──────────────────────────────────────────────────────────────┘
            │  HTTP request / JSON response
 ┌──────────▼────────────────────── SERVER (Node + Express) ───────────────┐
 │  server.ts      ← routes:  app.get('/api/facility-decisions', ...)      │
 │      │  calls                                                           │
 │  src/server/db.ts   ← "tables" (arrays) + JOIN helper functions         │
 │                        getFullFacDecisions()                            │
 └─────────────────────────────────────────────────────────────────────────┘
```

| Layer | File(s) | Role |
|---|---|---|
| Table definitions (types) | `src/types/database.ts` | One TypeScript `interface` per Oracle table, with the same column names |
| Data ("tables") | `src/server/db.ts` | Arrays such as `facilities`, `facDecisions`, `penaltyDesFac`, plus the join helpers |
| API / Controller | `server.ts` | Express routes: receive the request, validate it, read or write `db`, return JSON |
| API client | `src/services/api.ts` | Small `fetch` wrappers the React code calls |
| State | `src/App.tsx` | Loads everything once, stores it in React state, passes it to the screens |
| Views | `src/components/*.tsx` | Draw the data (tables, modals, print view) |

The server runs both the API and the website on **one port (3000)**: `/api/...`
returns JSON, and everything else returns the React app.

---

## 2. The tables involved

A facility decision draws on **6 tables**:

```
MVC_VPI_FACILTIES_TYPES        MVC_PENAITY_ARTICAL
   FACILITY_TYPE_SN ◄──┐          ARTICAL_ID ◄────────────┐
                       │                                  │
MVC_VPI_FACILITIES     │       MVC_PENALTY_DES_FAC (items)│
   FACILITY_SERIAL ◄─┐ └─ FACILITY_TYPE    PEN_DES_FAC_ID │
                     │                     DECISION_ID ───┼──┐
MVC_FAC_DECISION     │                     ARTICAL_ID ────┘  │
   DECISION_FAC_ID ◄─┼───────────────────────────────────────┤
   FACILITIE_ID ─────┘                                       │
                                MVC_PAYMENT_FAC              │
                                   DECISION_ID ──────────────┤
                                MVC_FAC_SMS                  │
                                   DECISION_FAC_ID ──────────┘
```

In the code, each table is an array on the `MvcDatabase` class (`src/server/db.ts`):

```ts
export class MvcDatabase {
  facilityTypes: MvcVpiFacilityType[] = [];   // MVC_VPI_FACILTIES_TYPES
  facilities:    MvcVpiFacility[]     = [];   // MVC_VPI_FACILITIES
  articles:      MvcPenaltyArtical[]  = [];   // MVC_PENAITY_ARTICAL
  facDecisions:  MvcFacDecision[]     = [];   // MVC_FAC_DECISION
  penaltyDesFac: MvcPenaltyDesFac[]   = [];   // MVC_PENALTY_DES_FAC
  facSms:        MvcFacSms[]          = [];   // MVC_FAC_SMS
  paymentFac:    MvcPaymentFac[]      = [];   // MVC_PAYMENT_FAC
  ...
}
export const db = new MvcDatabase();          // one shared instance
```

Each array element is one **row**, and each property is one **column**. For example,
one row of `MVC_FAC_DECISION`:

```ts
{
  DECISION_FAC_ID: 1001,            // primary key
  FACILITIE_ID: 101,                // foreign key → MVC_VPI_FACILITIES.FACILITY_SERIAL
  DECISION_ID: 'ق-م/1446/102',
  DECISION_DATE_G: '2025-01-20',
  DECISION_DATE_H: '1446-07-20',
  PAYED: 1,                         // 0 = unpaid, 1 = partial, 2 = fully paid
  ...
}
```

The column types are declared in `src/types/database.ts`:

```ts
export interface MvcFacDecision {
  DECISION_FAC_ID: number;
  FACILITIE_ID: number; // FK to MVC_VPI_FACILITIES.FACILITY_SERIAL
  DECISION_ID: string;
  PAYED: number;
  ...
}
```

---

## 3. Reading and joining: `getFullFacDecisions()`

The screen needs more than the raw decision row. It also needs the facility name, the
facility type, the penalty items with their article names, the total fine and how much
has been paid. That means **joining** the tables.

In SQL you would write something like:

```sql
SELECT d.*,
       f.FACILITY_NAME, f.LICENSE_NUMBER,
       t.FACILITY_TYPE_DESC,
       (SELECT SUM(i.AMOUNT)         FROM MVC_PENALTY_DES_FAC i WHERE i.DECISION_ID = d.DECISION_FAC_ID) AS totalAmount,
       (SELECT SUM(p.RECEIPT_AMOUNT) FROM MVC_PAYMENT_FAC     p WHERE p.DECISION_ID = d.DECISION_FAC_ID) AS paidAmount
FROM   MVC_FAC_DECISION d
LEFT JOIN MVC_VPI_FACILITIES      f ON f.FACILITY_SERIAL  = d.FACILITIE_ID
LEFT JOIN MVC_VPI_FACILTIES_TYPES t ON t.FACILITY_TYPE_SN = f.FACILITY_TYPE;
-- plus separate queries for the item rows (with article names), payment rows and SMS row
```

This project does the same thing in JavaScript with `.map`, `.find`, `.filter` and
`.reduce` (`src/server/db.ts`, `getFullFacDecisions`):

```ts
getFullFacDecisions(): FullFacDecision[] {
  // FROM MVC_FAC_DECISION d   → loop over every decision row
  return this.facDecisions.map(dec => {

    // LEFT JOIN MVC_VPI_FACILITIES f ON f.FACILITY_SERIAL = d.FACILITIE_ID
    const facility = this.facilities.find(f => f.FACILITY_SERIAL === dec.FACILITIE_ID);

    // LEFT JOIN MVC_VPI_FACILTIES_TYPES t ON t.FACILITY_TYPE_SN = f.FACILITY_TYPE
    const facilityType = facility
      ? this.facilityTypes.find(t => t.FACILITY_TYPE_SN === facility.FACILITY_TYPE)
      : undefined;

    // SELECT * FROM MVC_PENALTY_DES_FAC WHERE DECISION_ID = d.DECISION_FAC_ID   (one-to-many)
    const rawItems = this.penaltyDesFac.filter(item => item.DECISION_ID === dec.DECISION_FAC_ID);

    // ... and for each item: JOIN MVC_PENAITY_ARTICAL a ON a.ARTICAL_ID = item.ARTICAL_ID
    const items = rawItems.map(item => ({
      ...item,
      article: this.articles.find(a => a.ARTICAL_ID === item.ARTICAL_ID)
    }));

    // SUM(AMOUNT)
    const totalAmount = items.reduce((sum, it) => sum + (Number(it.AMOUNT) || 0), 0);

    // SELECT * FROM MVC_PAYMENT_FAC WHERE DECISION_ID = ...  and  SUM(RECEIPT_AMOUNT)
    const payments = this.paymentFac.filter(p => p.DECISION_ID === dec.DECISION_FAC_ID);
    const paidAmount = payments.reduce((sum, p) => sum + (Number(p.RECEIPT_AMOUNT) || 0), 0);

    // LEFT JOIN MVC_FAC_SMS s ON s.DECISION_FAC_ID = d.DECISION_FAC_ID
    const sms = this.facSms.find(s => s.DECISION_FAC_ID === dec.DECISION_FAC_ID);

    // Build one combined ("full") object
    return { ...dec, facility, facilityType, items, totalAmount, paidAmount, sms, payments };
  });
}
```

How SQL maps to JavaScript:

| SQL | JavaScript in this project |
|---|---|
| `FROM table` | `this.table.map(row => ...)` |
| `JOIN ... ON a.x = b.y` (one row) | `other.find(r => r.y === row.x)` |
| `WHERE col = value` (many rows) | `other.filter(r => r.col === value)` |
| `SUM(col)` | `.reduce((sum, r) => sum + r.col, 0)` |
| `LEFT JOIN` (row may be missing) | `find` returns `undefined`, so the screen uses `?.` |

The result type is `FullFacDecision` (`src/types/database.ts`). It is the decision row
**plus** the joined data:

```ts
export interface FullFacDecision extends MvcFacDecision {
  facility?: MvcVpiFacility;
  facilityType?: MvcVpiFacilityType;
  items: (MvcPenaltyDesFac & { article?: MvcPenaltyArtical })[];
  totalAmount: number;
  paidAmount: number;
  sms?: MvcFacSms;
  payments: MvcPaymentFac[];
}
```

The staff side works the same way through `getFullStaffDecisions()`, which joins
`MVC_MSTAFF_DECISION` → `MVC_MSTAFF_DATA` → `MVC_VPI_FACILITIES`, plus items, payments and SMS.

---

## 4. The API route: `GET /api/facility-decisions`

`server.ts` exposes the joined data as JSON:

```ts
app.get('/api/facility-decisions', (req, res) => {
  const { facilityId, payedStatus, search } = req.query;   // optional URL filters
  let list = db.getFullFacDecisions();                     // ← the JOIN from section 3

  if (facilityId) {                                         // WHERE FACILITIE_ID = ?
    list = list.filter(d => d.FACILITIE_ID === Number(facilityId));
  }
  if (payedStatus !== undefined && payedStatus !== '') {    // WHERE PAYED = ?
    list = list.filter(d => d.PAYED === Number(payedStatus));
  }
  if (search) {                                             // WHERE ... LIKE '%q%'
    const q = String(search).toLowerCase();
    list = list.filter(d =>
      matches(d.DECISION_ID, q) ||
      matches(d.INTERNAL_REF_SAHL, q) ||
      matches(d.facility?.FACILITY_NAME, q) ||
      matches(d.DEPARTMENT, q)
    );
  }

  res.json(list);                                           // send it to the browser
});
```

Before any route runs, two middlewares in `server.ts` handle every request:

1. `app.use(createBasicAuth(...))` checks the username and password (`src/server/security.ts`).
2. `app.use(express.json(...))` turns the JSON body of POST and PUT requests into `req.body`.

What the browser receives (shortened):

```json
[
  {
    "DECISION_FAC_ID": 1001,
    "DECISION_ID": "ق-م/1446/102",
    "FACILITIE_ID": 101,
    "PAYED": 1,
    "facility":     { "FACILITY_SERIAL": 101, "FACILITY_NAME": "مستشفى دار الشفاء التخصصي", "LICENSE_NUMBER": "LIC-MOH-2023-0941", ... },
    "facilityType": { "FACILITY_TYPE_SN": 2, "FACILITY_TYPE_DESC": "مستشفى تخصصي" },
    "items": [
      { "PEN_DES_FAC_ID": 5001, "AMOUNT": 30000, "PENALTY_NAME": "تشغيل عدد 2 ممرض دون تصريح ساري",
        "article": { "ARTICAL_ID": 1, "ARTICAL_NAME": "المادة (20) - تشغيل كوادر غير مرخصة", ... } },
      { "PEN_DES_FAC_ID": 5002, "AMOUNT": 20000, ... }
    ],
    "totalAmount": 50000,
    "paidAmount": 30000,
    "payments": [ { "PAYMENT_ID": 9001, "RECEIPT_AMOUNT": 30000, ... } ],
    "sms": { "SMS_ID": 7001, ... }
  }
]
```

You can see this yourself while the app is running: open
`http://localhost:3000/api/facility-decisions` in the browser after logging in.

---

## 5. The frontend: from JSON to the screen

### 5.1 `src/services/api.ts`: the request

```ts
async getFacilityDecisions(params?) : Promise<FullFacDecision[]> {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`/api/facility-decisions${query ? `?${query}` : ''}`);
  return handle(res);     // parses JSON; throws an error if the status is not 2xx
}
```

### 5.2 `src/App.tsx`: load once, keep in state

```ts
const [facilityDecisions, setFacilityDecisions] = useState<FullFacDecision[]>([]);

const loadAllData = useCallback(async () => {
  const [stats, facDecisions, staffDecisions, facilities, types, staff, articles] =
    await Promise.all([            // all requests run in parallel
      api.getStats(),
      api.getFacilityDecisions(),
      api.getStaffDecisions(),
      ...
    ]);
  setFacilityDecisions(facDecisions);   // ← store the joined list in React state
  ...
}, []);

useEffect(() => { loadAllData(); }, [loadAllData]);   // run once when the page opens
```

When the user is on the facility decisions tab, `App` passes that state down as a prop:

```tsx
{currentTab === 'facility-decisions' && (
  <FacilityDecisionsView
    decisions={facilityDecisions}
    facilities={facilities}
    onOpenPayment={dec => setPaymentModalState({ isOpen: true, type: 'facility', decision: dec })}
    ...
  />
)}
```

### 5.3 `src/components/FacilityDecisionsView.tsx`: draw the table

The view filters the list locally (search box and dropdowns) and then draws one
`<tr>` per decision. Each cell reads a field from the joined object:

```tsx
filtered.map(dec => {
  const remaining = dec.totalAmount - dec.paidAmount;
  return (
    <tr key={dec.DECISION_FAC_ID}>
      {/* from MVC_FAC_DECISION */}
      <td>{dec.DECISION_ID} — {dec.DECISION_DATE_H} · {dec.DECISION_DATE_G}</td>

      {/* from the JOIN with MVC_VPI_FACILITIES and MVC_VPI_FACILTIES_TYPES */}
      <td>
        {dec.facility?.FACILITY_NAME || 'منشأة غير معروفة'}
        {dec.facilityType?.FACILITY_TYPE_DESC} · ترخيص: {dec.facility?.LICENSE_NUMBER}
      </td>

      {/* from MVC_PENALTY_DES_FAC (one-to-many) */}
      <td>{dec.items.length} بنود مخالفة — {dec.items.map(i => i.PENALTY_NAME).join(' ، ')}</td>

      {/* computed SUMs */}
      <td>{formatSAR(dec.totalAmount)}  مسدد: {formatSAR(dec.paidAmount)}</td>

      {/* PAYED status column */}
      <td>
        {dec.PAYED === 2 ? 'مسدد بالكامل'
         : dec.PAYED === 1 ? `مسدد جزئي — متبقي: ${formatSAR(remaining)}`
         : 'غير مسدد'}
      </td>
    </tr>
  );
})
```

(The real file also has icons and Tailwind CSS classes. They are removed here so the
data flow is easier to see.)

So for decision **1001**, one row on screen is built from **5 tables**:

| On screen | Where it comes from |
|---|---|
| `ق-م/1446/102`, `1446-07-20` | `MVC_FAC_DECISION` |
| `مستشفى دار الشفاء التخصصي` | `MVC_VPI_FACILITIES` (joined by `FACILITIE_ID`) |
| `مستشفى تخصصي` | `MVC_VPI_FACILTIES_TYPES` (joined by `FACILITY_TYPE`) |
| `2 بنود مخالفة` | `MVC_PENALTY_DES_FAC` (filtered by `DECISION_ID`) |
| `٥٠٬٠٠٠ ر.س`, `مسدد: ٣٠٬٠٠٠ ر.س` (50,000 / 30,000, shown in Arabic digits by `formatSAR`) | sums of `MVC_PENALTY_DES_FAC.AMOUNT` and `MVC_PAYMENT_FAC.RECEIPT_AMOUNT` |
| `مسدد جزئي` | `MVC_FAC_DECISION.PAYED = 1` |

Other screens reuse the same joined object. `DecisionPrintView.tsx` prints it,
`SmsTrackingModal.tsx` shows `dec.sms`, and `PaymentModal.tsx` lists `dec.payments`.

---

## 6. The reverse direction: saving a payment

```
PaymentModal (form)  →  App.handleRegisterPayment  →  api.registerFacilityPayment
   →  POST /api/facility-decisions/1001/payments  →  validate  →  db.paymentFac.push(...)
   →  db.updateFacPaymentStatus(1001)  →  JSON response  →  App.loadAllData()  →  screen refreshes
```

**1. Form → API** (`PaymentModal.tsx` → `App.tsx` → `api.ts`):

```ts
await onRegisterPayment(decisionId, {
  RECEIPT_AMOUNT: 20000,
  RECEIPT_DATE: '2026-11-10',
  RECIPT_ID: 'REC-SADAD-123456',
  PEN_DES_FAC_ID: 5002            // optional: which penalty item is being paid
});
// api.ts → fetch('/api/facility-decisions/1001/payments', { method: 'POST', body: JSON.stringify(payload) })
```

**2. Route: validate, then INSERT** (`server.ts`):

```ts
app.post('/api/facility-decisions/:id/payments', (req, res) => {
  const id = toId(req.params.id, 'id');
  const decision = db.getFullFacDecisions().find(d => d.DECISION_FAC_ID === id);
  if (!decision) return res.status(404).json({ error: 'Decision not found' });

  // amount must be > 0 and ≤ remaining; the item must belong to this decision
  const { amount, itemId } = parsePayment(body, decision.totalAmount - decision.paidAmount, ...);

  const newPayment = {
    PAYMENT_ID: db.nextId('paymentFac'),   // like an Oracle SEQUENCE.NEXTVAL
    DECISION_ID: id,
    RECEIPT_AMOUNT: amount,
    ...
  };
  db.paymentFac.push(newPayment);          // ≈ INSERT INTO MVC_PAYMENT_FAC ...
  db.updateFacPaymentStatus(id);           // ≈ UPDATE MVC_FAC_DECISION SET PAYED = ...

  res.status(201).json({ payment: newPayment, decision: db.getFullFacDecisions().find(...) });
});
```

**3. Recompute the status** (`db.ts`, `updateFacPaymentStatus`):

```ts
if (total === 0)         dec.PAYED = 0;
else if (paid >= total)  dec.PAYED = 2;   // fully paid
else if (paid > 0)       dec.PAYED = 1;   // partial
else                     dec.PAYED = 0;   // unpaid
```

**4. Refresh the screen:** `App.handleRegisterPayment` calls `loadAllData()` again.
That fetches the joined list again, React state updates, and the table redraws with
the new amounts and status.

Creating, editing and deleting decisions, facilities, staff and articles all follow
the same pattern:

| Action | HTTP | In `db` (≈ SQL) |
|---|---|---|
| List | `GET /api/<thing>` | `.map/.find/.filter` (SELECT + JOIN) |
| Create | `POST /api/<thing>` | `array.push(...)` / `unshift(...)` (INSERT) |
| Update | `PUT /api/<thing>/:id` | `array[index] = {...old, ...new}` (UPDATE) |
| Delete | `DELETE /api/<thing>/:id` | `array = array.filter(r => r.id !== id)` (DELETE) |

Every write goes through `pick(...)` (only allowed columns are accepted) and
validation (`src/server/validation.ts`) before it touches the data.

---

## 7. Moving to a real Oracle database

Only `src/server/db.ts` needs to change. Routes, the API client and the screens can
stay as they are, as long as `getFullFacDecisions()` still returns the same shape.
For example:

```ts
async getFullFacDecisions() {
  const rows = await executeQuery(`
    SELECT d.*, f.FACILITY_NAME, f.LICENSE_NUMBER, t.FACILITY_TYPE_DESC
    FROM   MVC_FAC_DECISION d
    LEFT JOIN MVC_VPI_FACILITIES      f ON f.FACILITY_SERIAL  = d.FACILITIE_ID
    LEFT JOIN MVC_VPI_FACILTIES_TYPES t ON t.FACILITY_TYPE_SN = f.FACILITY_TYPE`);
  // ...then load the items / payments / sms with bind variables (:id) and build the same objects
}
```

The connection pool template is in `src/server/oracleDdl.ts` (`ORACLE_19C_NODE_CONNECTOR`),
and the `CREATE TABLE` script is `ORACLE_19C_DDL`. Always use **bind variables**
(`WHERE ID = :id`) and never build SQL by joining strings, to avoid SQL injection.
The functions would also become `async`, so the routes would need `await`.

---

## 8. Where to look for what

| I want to… | Open |
|---|---|
| See or change sample data | `src/server/db.ts` → `seed()` |
| Change how tables are joined | `src/server/db.ts` → `getFullFacDecisions()` / `getFullStaffDecisions()` |
| Add or change an API endpoint | `server.ts` |
| Change validation rules | `server.ts` (field lists, `validate*`) and `src/server/validation.ts` |
| Change login | `src/server/security.ts` |
| Add a column | `src/types/database.ts`, the `*_FIELDS` list in `server.ts`, the form in the view |
| Change how a screen looks | `src/components/<Name>View.tsx` |
| Change which tab shows what | `src/App.tsx` and `src/components/Sidebar.tsx` |
