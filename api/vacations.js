import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "vacations";
  return handler(req, res);
}
