import { db } from "../lib/firebaseAdmin.js";

function getFirestoreCollection(colName) {
  const mapping = {
    "employees": "employees",
    "users": "users",
    "clients": "clients",
    "quotations": "sales_quotations",
    "sales_quotations": "sales_quotations",
    "warehouse_items": "warehouse_items",
    "materials_warehouse": "materials_warehouse",
    "production_projects": "production_projects",
    "installation_orders": "installation_orders",
    "material_purchase_requests": "material_purchase_requests",
    "financial_collections": "financial_collections",
    "pricing_requests": "pricing_requests",
    "pricing_studies": "pricing_studies",
    "sales_production_requests": "sales_production_requests",
    "sales_letters_logs": "sales_letters_logs",
    "sales_reps_list": "sales_reps_list",
    "sales_targets": "sales_targets",
    "suppliers": "suppliers",
    "system_settings": "system_settings",
    "terms_templates": "terms_templates",
    "vacations": "vacations",
    "activity_logs": "activity_logs",
    "doc_activity_logs": "doc_activity_logs",
    "document_logs": "document_logs",

    // Dynamic aliases
    "activities": "activity_logs",
    "documents": "document_logs",
    "sales": "sales_quotations",
    "materials": "materials_warehouse",
    "products": "warehouse_items",
    "financials": "financial_collections"
  };
  return mapping[colName] || colName;
}

export default async function handler(req, res) {
  let pathSegments = [];
  
  if (req.query.path) {
    if (Array.isArray(req.query.path)) {
      pathSegments = req.query.path;
    } else if (typeof req.query.path === "string") {
      pathSegments = req.query.path.split("/").filter(Boolean);
    }
  } else {
    const urlPath = req.url ? req.url.split("?")[0] : "";
    const segments = urlPath.split("/").filter(Boolean);
    if (segments[0] === "api") {
      pathSegments = segments.slice(1);
    } else {
      pathSegments = segments;
    }
  }

  if (pathSegments.length === 0) {
    return res.status(400).json({ success: false, error: "Invalid path segments" });
  }

  let isDynamic = false;
  let collectionName = "";
  let id = "";

  if (pathSegments[0] === "dynamic") {
    isDynamic = true;
    collectionName = pathSegments[1];
    id = pathSegments[2] || "";
  } else {
    collectionName = pathSegments[0];
    id = pathSegments[1] || "";
  }

  if (collectionName === "employees" && isDynamic) {
    return res.status(400).json({ success: false, error: "Access denied" });
  }

  const firestoreCol = getFirestoreCollection(collectionName);
  const method = req.method ? req.method.toUpperCase() : "GET";
  const body = req.body || {};

  try {
    if (method === "GET") {
      if (id) {
        const docSnap = await db.collection(firestoreCol).doc(String(id)).get();
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, error: `${collectionName} profile not found.` });
        }
        return res.status(200).json({ success: true, data: { id: docSnap.id, ...docSnap.data() } });
      } else {
        const snapshot = await db.collection(firestoreCol).get();
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return res.status(200).json({ success: true, data: list });
      }
    }

    if (method === "POST") {
      if (id) {
        // Post to specific ID
        const docRef = db.collection(firestoreCol).doc(String(id));
        await docRef.set(body, { merge: true });
        const docSnap = await docRef.get();
        const responseData = { ...docSnap.data(), id };
        return res.status(200).json({
          success: true,
          data: responseData,
          employee: responseData,
          client: responseData
        });
      } else {
        // Create new document
        if (firestoreCol === "employees") {
          if (!body.arabicName || !body.englishName) {
            return res.status(400).json({ success: false, error: "Required fields missing." });
          }
        }
        
        let newId = body.id || body.username;
        if (!newId) {
          if (firestoreCol === "users") {
            return res.status(400).json({ success: false, error: "Username is required." });
          }
          const prefix = firestoreCol === "employees" ? "EMP" : collectionName.substring(0, 3).toUpperCase();
          newId = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        const docRef = db.collection(firestoreCol).doc(String(newId));
        const docData = { ...body, id: newId };
        await docRef.set(docData, { merge: true });
        return res.status(200).json({
          success: true,
          id: newId,
          data: docData,
          employee: docData,
          client: docData
        });
      }
    }

    if (method === "PUT" || method === "PATCH") {
      const updateId = id || req.query.id || body.id || body.username;
      if (!updateId) {
        return res.status(400).json({ success: false, error: "Missing document ID for update." });
      }

      const docRef = db.collection(firestoreCol).doc(String(updateId));
      if (firestoreCol === "employees") {
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, error: "Employee profile not found." });
        }
      }

      await docRef.set(body, { merge: true });
      const docSnap = await docRef.get();
      const responseData = { ...docSnap.data(), id: updateId };
      return res.status(200).json({
        success: true,
        data: responseData,
        employee: responseData,
        client: responseData
      });
    }

    if (method === "DELETE") {
      const deleteId = id || req.query.id || body.id || body.username;
      if (!deleteId) {
        return res.status(400).json({ success: false, error: "Missing document ID for deletion." });
      }

      await db.collection(firestoreCol).doc(String(deleteId)).delete();
      return res.status(200).json({
        success: true,
        message: `${collectionName} profile deleted successfully.`
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (error) {
    console.error(`Error in api/[...path] (${collectionName}${id ? `/${id}` : ""}):`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
