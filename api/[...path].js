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

function getRouteKey(req) {
  const rawPath = req.query.path || [];
  const parts = Array.isArray(rawPath) ? rawPath : [rawPath];

  if (parts[0] === "dynamic") {
    return parts[1];
  }

  if (parts[0] === "v1") {
    if (parts.includes("dashboard")) return "employees";
    if (parts.includes("clearances")) return "employees";
    if (parts.includes("hr")) return "employees";
  }

  return parts[0];
}

function getDocumentId(req) {
  const rawPath = req.query.path || [];
  const parts = Array.isArray(rawPath) ? rawPath : [rawPath];

  if (req.query.id) return req.query.id;
  if (req.body?.id) return req.body.id;
  if (req.body?.firestoreId) return req.body.firestoreId;

  if (parts.length >= 2 && parts[0] !== "dynamic" && parts[0] !== "v1") {
    return parts[1];
  }

  return null;
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
    const routeKey = getRouteKey(req);

    if (!routeKey) {
      return res.status(400).json({
        success: false,
        error: "Missing API route key",
      });
    }

    const collectionName = collectionMap[routeKey];

    if (!collectionName) {
      return res.status(404).json({
        success: false,
        error: `Unknown API route: ${routeKey}`,
      });
    }

    const ref = db.collection(collectionName);

    if (req.method === "GET") {
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

    if (req.method === "POST") {
      const body = req.body || {};

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

    if (req.method === "PUT" || req.method === "PATCH") {
      const body = req.body || {};
      const id = getDocumentId(req);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing document id",
        });
      }

      const cleanBody = { ...body };
      delete cleanBody.id;
      delete cleanBody.firestoreId;

      await ref.doc(id).set(
        {
          ...cleanBody,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json({
        success: true,
        id,
      });
    }

    if (req.method === "DELETE") {
      const id = getDocumentId(req);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing document id",
        });
      }

      await ref.doc(id).delete();

      return res.status(200).json({
        success: true,
        id,
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