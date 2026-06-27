import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "pricing_studies";
  return handler(req, res);
}
