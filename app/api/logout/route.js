// app/api/logout/route.js

export async function POST() {
  const headers = new Headers();
  headers.append("Set-Cookie", "sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  headers.append("Set-Cookie", "sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return Response.json({ success: true }, { headers });
}
