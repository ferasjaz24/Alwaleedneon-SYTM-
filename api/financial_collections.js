import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "financial_collections";
  return handler(req, res);
}
