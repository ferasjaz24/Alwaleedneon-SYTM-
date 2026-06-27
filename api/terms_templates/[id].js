import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "terms_templates";
  return handler(req, res);
}
