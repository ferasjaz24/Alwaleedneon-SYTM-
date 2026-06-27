import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "users";
  return handler(req, res);
}
