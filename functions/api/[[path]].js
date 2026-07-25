// این فایل تو مسیر functions/api/[[path]].js قرار می‌گیره.
// طبق قرارداد Cloudflare Pages، هر فایلی که تو پوشه‌ی functions/ باشه،
// خودکار به یه Pages Function تبدیل می‌شه؛ اسم [[path]] یعنی "هر مسیری زیر api/*".
// یعنی هر فچی که فرانت به /api/چیزی بزنه، این فایل صداش می‌زنه.

export async function onRequest(context) {
  const { request, env } = context;
  const incomingUrl = new URL(request.url);

  const REAL_WORKER_URL = env.REAL_WORKER_URL;
  const INTERNAL_KEY = env.INTERNAL_KEY;

  if (!REAL_WORKER_URL || !INTERNAL_KEY) {
    return new Response("REAL_WORKER_URL یا INTERNAL_KEY تنظیم نشده", { status: 500 });
  }

  const targetUrl = REAL_WORKER_URL + incomingUrl.pathname + incomingUrl.search;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set("X-Internal-Key", INTERNAL_KEY);
  // کلادفلر خودش این هدر رو با آی‌پیِ واقعیِ کاربر پر می‌کنه
  forwardHeaders.set(
    "X-Real-Client-IP",
    request.headers.get("CF-Connecting-IP") || "unknown"
  );
  forwardHeaders.delete("Host");

  const proxiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });

  const response = await fetch(proxiedRequest);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
