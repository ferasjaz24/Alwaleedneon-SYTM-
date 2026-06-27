import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "production_projects";
  return handler(req, res);
}
