import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "clients";
  return handler(req, res);
}
