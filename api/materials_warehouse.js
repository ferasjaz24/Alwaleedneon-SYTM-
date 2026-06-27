import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "materials_warehouse";
  return handler(req, res);
}
