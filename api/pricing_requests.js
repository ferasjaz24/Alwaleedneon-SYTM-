import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "pricing_requests";
  return handler(req, res);
}
