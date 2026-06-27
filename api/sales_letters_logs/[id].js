import handler from "../[collection]/[id].js";
export default function (req, res) {
  req.query.collection = "sales_letters_logs";
  return handler(req, res);
}
