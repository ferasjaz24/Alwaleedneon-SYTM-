import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "system_settings";
  return handler(req, res);
}
