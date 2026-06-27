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
  const path = req.query.path || [];
  const parts = Array.isArray(path) ? path : [path];

  // Handles /api/dynamic/materials or /api/dynamic/materials_warehouse
  if (parts[0] === "dynamic") {
    return parts[1];
  }

  // Handles /api/v1/hr/dashboard/metrics safely
  if (parts[0] === "v1") {
    if (parts.includes("dashboard")) return "employees";
    if (parts.includes("clearances")) return "employees";
    if (parts.includes("hr")) return "employees";
  }

  return parts[0];
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const path = req.query.path || [];
  const parts = Array.isArray(path) ? path : [path];

  let id = null;
  if (parts[0] === "dynamic") {
    id = parts[2] || null;
  } else if (parts[0] === "v1") {
    if (parts.length > 2 && parts[parts.length - 1] !== "dashboard" && parts[parts.length - 1] !== "clearances" && parts[parts.length - 1] !== "hr") {
      id = parts[parts.length - 1];
    }
  } else {
    id = parts[1] || null;
  }

  try {
    const routeKey = getRouteKey(req);
    const collectionName = collectionMap[routeKey];

    if (!collectionName) {
      return res.status(404).json({
        success: false,
        error: `Unknown API route: ${routeKey}`,
      });
    }

    const ref = db.collection(collectionName);
    const body = req.body || {};
    const finalId = id || req.query.id || body.id || body.firestoreId || body.username;

    if (req.method === "GET") {
      if (finalId) {
        const docSnap = await ref.doc(String(finalId)).get();
        if (!docSnap.exists) {
          return res.status(404).json({
            success: false,
            error: `Document not found with ID: ${finalId}`,
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
      if (finalId) {
        await ref.doc(String(finalId)).set({
          ...body,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        const docSnap = await ref.doc(String(finalId)).get();
        return res.status(200).json({
          success: true,
          id: finalId,
          data: {
            firestoreId: finalId,
            id: finalId,
            ...docSnap.data(),
          },
        });
      } else {
        const docRef = await ref.add({
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        const docSnap = await docRef.get();
        return res.status(200).json({
          success: true,
          id: docRef.id,
          data: {
            firestoreId: docRef.id,
            id: docRef.id,
            ...docSnap.data(),
          },
        });
      }
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      if (!finalId) {
        return res.status(400).json({
          success: false,
          error: "Missing document id",
        });
      }

      const updateData = { ...body };
      delete updateData.id;
      delete updateData.firestoreId;

      await ref.doc(String(finalId)).set(
        {
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json({
        success: true,
        id: finalId,
      });
    }

    if (req.method === "DELETE") {
      if (!finalId) {
        return res.status(400).json({
          success: false,
          error: "Missing document id",
        });
      }

      await ref.doc(String(finalId)).delete();

      return res.status(200).json({
        success: true,
        id: finalId,
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error("API error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
