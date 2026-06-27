import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "suppliers";
  return handler(req, res);
}
