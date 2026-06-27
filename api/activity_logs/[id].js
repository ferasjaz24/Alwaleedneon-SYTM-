import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "activity_logs";
  return handler(req, res);
}
