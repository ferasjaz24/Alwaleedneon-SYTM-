import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "quotations";
  return handler(req, res);
}
