// Deck Forge: add a player to the Crystal Quest Discord server after they sign in with (or connect) Discord.
// Secrets (Supabase → Edge Functions → Secrets): DISCORD_BOT_TOKEN, DISCORD_GUILD_ID.
// The bot must be in the server with the "Create Invite" permission. Discord's rule: PUT /guilds/{guild}/members/{user}
// needs the player's OAuth token with the guilds.join scope plus a bot token from the same Discord application.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // 1. Only signed-in Deck Forge players can call this.
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ ok: false, error: "not signed in" }, 401);
    const { token } = await req.json();
    if (!token) return json({ ok: false, error: "no Discord token" }, 400);

    // 2. Who is this on Discord? (also proves the token is real)
    const me = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${token}` } });
    if (!me.ok) return json({ ok: false, error: "Discord token rejected" }, 400);
    const dc = await me.json();
    const linked = (user.identities ?? []).some((i) => i.provider === "discord" && String(i.id) === String(dc.id));
    if (!linked) return json({ ok: false, error: "Discord account not linked to this player" }, 403);

    // 3. Add them to the server. 201 = added, 204 = already a member.
    const r = await fetch(`https://discord.com/api/v10/guilds/${Deno.env.get("DISCORD_GUILD_ID")}/members/${dc.id}`, {
      method: "PUT",
      headers: { Authorization: `Bot ${Deno.env.get("DISCORD_BOT_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token }),
    });
    if (r.status === 201 || r.status === 204) return json({ ok: true, already: r.status === 204, discord: dc.global_name ?? dc.username });
    return json({ ok: false, error: `Discord said ${r.status}: ${await r.text()}` }, 502);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
