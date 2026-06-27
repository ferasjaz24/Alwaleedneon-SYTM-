import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, getDocFromServer } from "firebase/firestore";
import { db, auth } from "../firebase";

// Connection Validation as required by firebase-integration skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Firestore connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
    } else {
      console.log("Firestore connection test completed (or bypassed due to rules):", error);
    }
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data mapping helper to abstract database schema snake_case away from UI camelCase
function mapEmployeeFromDB(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    firestoreId: row.id,
    arabicName: row.arabicName || row.arabic_name || "",
    englishName: row.englishName || row.english_name || "",
    iqamaId: row.iqamaId || row.iqama_id || "",
    passportDetails: row.passportDetails || row.passport_details || "",
    jobTitle: row.jobTitle || row.job_title || "",
    grade: row.grade || "",
    basicSalary: Number(row.basicSalary || row.basic_salary || 0),
    allowances: row.allowances || {
      housing: Number(row.housing || 0),
      transport: Number(row.transport || 0),
      phone: Number(row.phone || 0),
      food: Number(row.food || 0),
    },
    homeAddress: row.homeAddress || row.home_address || "",
    custody: row.custody || { laptop: "", tools: "", vehicles: "" },
    birthDate: row.birthDate || row.birth_date || "",
    dateOfJoining: row.dateOfJoining || row.date_of_joining || "",
    contractExpiry: row.contractExpiry || row.contract_expiry || "",
    department: row.department || "",
    mobile: row.mobile || "",
    nationality: row.nationality || "",
    experienceYears: row.experienceYears || row.experience_years,
    classification: row.classification || "",
    contractUrl: row.contractUrl || row.contract_url || "",
    contractQiwaNumber: row.contractQiwaNumber || row.contract_qiwa_number || "",
    insurancePolicyNumber: row.insurancePolicyNumber || row.insurance_policy_number || "",
    insuranceCompany: row.insuranceCompany || row.insurance_company || "",
    insuranceClass: row.insuranceClass || row.insurance_class || "",
    insuranceExpiryDate: row.insuranceExpiryDate || row.insurance_expiry_date || "",
    custodyAssets: row.custodyAssets || row.custody_assets || [],
    vacationBalance: row.vacationBalance || row.vacation_balance,
    vacationUsed: row.vacationUsed || row.vacation_used,
    sickUsed: row.sickUsed || row.sick_used
  };
}

function mapClientFromDB(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    clientName: row.clientName || row.client_name || "",
    companyName: row.companyName || row.company_name || "",
    mobile: row.mobile || "",
    email: row.email || "",
    country: row.country || "",
    region: row.region || "",
    city: row.city || "",
    crNumber: row.crNumber || row.cr_number || "",
    taxExempt: row.taxExempt !== undefined ? row.taxExempt : (row.tax_exempt || false),
    taxNumber: row.taxNumber || row.tax_number || "",
    classification: row.classification || "",
    dateCreated: row.dateCreated || row.date_created || "",
    status: row.status || "",
    isDraft: row.isDraft !== undefined ? row.isDraft : (row.is_draft || false),
    nationalAddress: row.nationalAddress || row.national_address || null
  };
}

// Global fetch interceptor
const originalFetch = window.fetch;

const customFetch = async function (this: any, input: any, init?: any): Promise<Response> {
  const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  
  let pathname = url;
  try {
    const parsedUrl = new URL(url, window.location.origin);
    pathname = parsedUrl.pathname;
  } catch (e) {
    // Treat as relative path
  }

  // Intercept Employees Endpoint
  if (pathname === '/api/employees') {
    const method = init?.method?.toUpperCase() || 'GET';
    
    if (method === 'GET') {
      try {
        const snapshot = await getDocs(collection(db, "employees"));
        const employeesList = snapshot.docs.map(doc => {
          const data = doc.data();
          return mapEmployeeFromDB({ id: doc.id, ...data });
        });
        return new Response(JSON.stringify(employeesList), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "employees");
      }
    }

    if (method === 'POST') {
      try {
        const body = JSON.parse(init?.body as string || "{}");
        const empId = body.id || `EMP-${Date.now()}`;
        const newEmp = { ...body, id: empId };
        
        await setDoc(doc(db, "employees", empId), newEmp);
        return new Response(JSON.stringify({ success: true, employee: mapEmployeeFromDB(newEmp) }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "employees");
      }
    }
  }

  if (pathname.startsWith('/api/employees/')) {
    const method = init?.method?.toUpperCase() || 'GET';
    const id = pathname.substring('/api/employees/'.length);

    if (method === 'DELETE') {
      try {
        await deleteDoc(doc(db, "employees", id));
        return new Response(JSON.stringify({ success: true, message: "Employee profile deleted successfully." }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
      }
    }

    if (method === 'PUT' || method === 'POST') {
      try {
        const body = JSON.parse(init?.body as string || "{}");
        const ref = doc(db, "employees", id);
        
        await setDoc(ref, body, { merge: true });
        // Retrieve merged doc
        const snap = await getDoc(ref);
        const updatedEmp = { ...snap.data(), id };
        
        return new Response(JSON.stringify({ success: true, employee: mapEmployeeFromDB(updatedEmp) }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `employees/${id}`);
      }
    }
  }

  // Intercept Clients Endpoint
  if (pathname === '/api/clients') {
    const method = init?.method?.toUpperCase() || 'GET';

    if (method === 'GET') {
      try {
        const snapshot = await getDocs(collection(db, "clients"));
        const clientsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return mapClientFromDB({ id: doc.id, ...data });
        });
        return new Response(JSON.stringify(clientsList), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "clients");
      }
    }

    if (method === 'POST') {
      try {
        const body = JSON.parse(init?.body as string || "{}");
        const clientId = body.id || `CL-${Date.now()}`;
        const newClient = {
          ...body,
          id: clientId,
          dateCreated: body.dateCreated || new Date().toISOString()
        };

        await setDoc(doc(db, "clients", clientId), newClient);
        return new Response(JSON.stringify({ success: true, client: mapClientFromDB(newClient) }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "clients");
      }
    }
  }

  if (pathname.startsWith('/api/clients/')) {
    const method = init?.method?.toUpperCase() || 'GET';
    const id = pathname.substring('/api/clients/'.length);

    if (method === 'DELETE') {
      try {
        await deleteDoc(doc(db, "clients", id));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
      }
    }

    if (method === 'PUT' || method === 'POST') {
      try {
        const body = JSON.parse(init?.body as string || "{}");
        const ref = doc(db, "clients", id);

        await setDoc(ref, body, { merge: true });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `clients/${id}`);
      }
    }
  }

  // Fallback to real fetch for everything else
  return originalFetch.apply(this, [input, init]);
};

try {
  // First try direct assignment
  (window as any).fetch = customFetch;
} catch (e) {
  console.warn("Direct assignment to window.fetch failed, attempting Object.defineProperty:", e);
  try {
    // If reassignment fails due to lacking a setter, try defining the property
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      writable: true,
      configurable: true,
    });
  } catch (err2) {
    console.error("Failed to intercept window.fetch due to iframe/browser sandbox restrictions. Native fetch will be used:", err2);
  }
}
