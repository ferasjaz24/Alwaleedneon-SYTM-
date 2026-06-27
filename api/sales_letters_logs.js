import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "sales_letters_logs";
  return handler(req, res);
}
