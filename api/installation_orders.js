import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "installation_orders";
  return handler(req, res);
}
