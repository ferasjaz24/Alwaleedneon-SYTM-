import { db } from "../lib/firebaseAdmin.js";

const collectionMap = {
  employees: "employees",
  users: "users",
  clients: "clients",

  quotations: "sales_quotations",
  sales_quotations: "sales_quotations",

  warehouse_items: "warehouse_items",
  materials_warehouse: "materials_warehouse",

  production_projects: "production_projects",
  production_orders: "production_projects",

  installation_orders: "installation_orders",
  installation_requests: "installation_orders",

  material_purchase_requests: "material_purchase_requests",
  materials_purchase_requests: "material_purchase_requests",

  financial_collections: "financial_collections",
  pricing_requests: "pricing_requests",
  pricing_studies: "pricing_studies",

  sales_production_requests: "sales_production_requests",
  sales_letters_logs: "sales_letters_logs",
  sales_reps_list: "sales_reps_list",
  sales_targets: "sales_targets",

  suppliers: "suppliers",
  system_settings: "system_settings",
  terms_templates: "terms_templates",

  vacations: "vacations",
  leaves: "vacations",

  attendance: "attendance",
  inquiries: "inquiries",
  deductions: "deductions",

  employee_docs: "employee_docs",
  "employee-docs": "employee_docs",

  vehicle_docs: "vehicle_docs",
  "vehicle-docs": "vehicle_docs",

  activity_logs: "activity_logs",
  doc_activity_logs: "doc_activity_logs",
  document_logs: "document_logs",

  activities: "activity_logs",
  documents: "document_logs",
  sales: "sales_quotations",
  materials: "materials_warehouse",
  products: "warehouse_items",
  financials: "financial_collections",
};

function resolveRequest(req) {
  const rawPath = req.query.path || [];
  const parts = Array.isArray(rawPath) ? rawPath : [rawPath];

  let collectionFromPath = "";
  let id = null;

  if (parts[0] === "dynamic") {
    collectionFromPath = parts[1] || "";
    id = parts[2] || null;
  } else if (parts[0] === "v1") {
    if (parts.includes("dashboard") || parts.includes("clearances") || parts.includes("hr")) {
      collectionFromPath = "employees";
    } else {
      collectionFromPath = parts[1] || "";
      id = parts[2] || null;
    }
  } else {
    collectionFromPath = parts[0] || "";
    id = parts[1] || null;
  }

  // Fallback ID checking from query parameter or request body
  const finalId = id || req.query.id || req.body?.id || req.body?.firestoreId || null;

  // Map collection name if a mapping exists, otherwise use it directly
  const finalCollection = collectionMap[collectionFromPath] || collectionFromPath;

  return {
    collectionName: finalCollection,
    documentId: finalId,
  };
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  try {
    const { collectionName, documentId } = resolveRequest(req);

    if (!collectionName) {
      return res.status(400).json({
        success: false,
        error: "Missing API collection name",
      });
    }

    const ref = db.collection(collectionName);

    if (req.method === "GET") {
      if (documentId) {
        const docSnap = await ref.doc(String(documentId)).get();
        if (!docSnap.exists) {
          return res.status(404).json({
            success: false,
            error: `Document not found with ID: ${documentId} in collection: ${collectionName}`,
          });
        }
        return res.status(200).json({
          success: true,
          data: {
            firestoreId: docSnap.id,
            id: docSnap.id,
            ...docSnap.data(),
          },
        });
      } else {
        const snapshot = await ref.get();
        const data = snapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          id: doc.id,
          ...doc.data(),
        }));

        return res.status(200).json({
          success: true,
          data,
        });
      }
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const customId = body.id || body.firestoreId || documentId;

      if (customId) {
        const updateBody = { ...body };
        delete updateBody.id;
        delete updateBody.firestoreId;

        await ref.doc(String(customId)).set({
          ...updateBody,
          createdAt: body.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return res.status(200).json({
          success: true,
          id: customId,
        });
      } else {
        const docRef = await ref.add({
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return res.status(200).json({
          success: true,
          id: docRef.id,
        });
      }
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const body = req.body || {};

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Missing document id",
        });
      }

      const cleanBody = { ...body };
      delete cleanBody.id;
      delete cleanBody.firestoreId;

      await ref.doc(String(documentId)).set(
        {
          ...cleanBody,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json({
        success: true,
        id: documentId,
      });
    }

    if (req.method === "DELETE") {
      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: "Missing document id",
        });
      }

      await ref.doc(String(documentId)).delete();

      return res.status(200).json({
        success: true,
        id: documentId,
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}