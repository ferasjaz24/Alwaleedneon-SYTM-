import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "sales_targets";
  return handler(req, res);
}
