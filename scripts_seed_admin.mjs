import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL;
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, srk, { auth: { persistSession: false } });

const email = "erikanin500@gmail.com";
const password = "Erikanin12";

// create or fetch user
let userId;
const { data: created, error: cErr } = await sb.auth.admin.createUser({
  email, password, email_confirm: true, user_metadata: { full_name: "Admin" }
});
if (cErr) {
  if (/already/i.test(cErr.message)) {
    const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    const u = list.users.find(x => x.email === email);
    if (!u) { console.error("not found"); process.exit(1); }
    userId = u.id;
    await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else { console.error(cErr); process.exit(1); }
} else {
  userId = created.user.id;
}
console.log("userId:", userId);

// ensure admin role
const { error: rErr } = await sb.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
if (rErr) console.error("role error", rErr);
else console.log("admin role granted");
