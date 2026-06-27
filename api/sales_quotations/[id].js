import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "sales_quotations";
  return handler(req, res);
}
