import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "sales_production_requests";
  return handler(req, res);
}
