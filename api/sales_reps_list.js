import handler from "./[collection].js";
export default function (req, res) {
  req.query.collection = "sales_reps_list";
  return handler(req, res);
}
