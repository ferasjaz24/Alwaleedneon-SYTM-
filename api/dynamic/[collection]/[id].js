import { db } from "../../_firebaseAdmin.js";

function getFirestoreCollection(collectionName) {
  const mapping = {
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
    "activities": "activity_logs",
    "documents": "document_logs",
    "sales": "sales_quotations",
    "materials": "materials_warehouse",
    "products": "warehouse_items",
    "financials": "financial_collections"
  };
  return mapping[collectionName] || collectionName;
}

export default async function handler(req, res) {
  const { collection, id } = req.query;
  try {
    if (!collection || !id) {
      return res.status(400).json({ success: false, error: "Collection and ID are required." });
    }

    if (collection === "employees") {
      return res.status(400).json({ success: false, error: "Access denied" });
    }

    const firestoreCol = getFirestoreCollection(collection);
    const method = req.method ? req.method.toUpperCase() : "GET";

    if (method === "GET") {
      const docSnap = await db.collection(firestoreCol).doc(String(id)).get();
      if (!docSnap.exists) {
        return res.status(404).json({ success: false, error: "Document not found." });
      }
      return res.status(200).json({ success: true, data: { id: docSnap.id, ...docSnap.data() } });
    }

    if (method === "PUT" || method === "PATCH" || method === "POST") {
      const docRef = db.collection(firestoreCol).doc(String(id));
      await docRef.set(req.body, { merge: true });
      return res.status(200).json({ success: true });
    }

    if (method === "DELETE") {
      await db.collection(firestoreCol).doc(String(id)).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (error) {
    console.error(`Error in api/dynamic/[collection]/[id] (${collection}/${id}):`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
