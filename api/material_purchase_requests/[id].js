import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "material_purchase_requests";
  return handler(req, res);
}
