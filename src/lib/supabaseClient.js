import { createClient } from "@supabase/supabase-js";

const rawUrl = "https://gfesmrovnnzlgzopmmlo.supabase.co/rest/v1/";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZXNtcm92bm56bGd6b3BtbWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTA1NzEsImV4cCI6MjA5NjcyNjU3MX0.GH2GucqQkMvhe49Uy86qlCC-QZxr5qKPNQagVv87n_M";

// Clean the Base URL from any rest paths if needed for supabaseClient initialization
let cleanUrl = rawUrl;
if (cleanUrl.endsWith("/rest/v1/")) {
  cleanUrl = cleanUrl.slice(0, -9);
} else if (cleanUrl.endsWith("/rest/v1")) {
  cleanUrl = cleanUrl.slice(0, -8);
}

export const supabase = createClient(cleanUrl, anonKey);
