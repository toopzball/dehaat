// این فانکشن فقط مسیرهای /api/* رو می‌گیره (طبق تنظیمات netlify.toml) و به ورکر اصلی
// (که رو کلادفلر داره، دقیقاً همون کاری که قبلاً پروکسی.js انجام می‌داد) فوروارد می‌کنه.
// بقیه‌ی مسیرها (index.html, login.html, آیکون‌ها و...) هرگز به این فانکشن نمی‌رسن؛
// نتلیفای خودش مستقیم به‌عنوان فایل استاتیک سرو می‌کنه.

export default async (request, context) => {
  const incomingUrl = new URL(request.url);

  const REAL_WORKER_URL = Netlify.env.get("REAL_WORKER_URL");
  const INTERNAL_KEY = Netlify.env.get("INTERNAL_KEY");

  if (!REAL_WORKER_URL || !INTERNAL_KEY) {
    return new Response("REAL_WORKER_URL یا INTERNAL_KEY تنظیم نشده", { status: 500 });
  }

  const targetUrl = REAL_WORKER_URL + incomingUrl.pathname + incomingUrl.search;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set("X-Internal-Key", INTERNAL_KEY);
  // نتلیفای آی‌پیِ واقعیِ کاربر رو تو این هدر می‌ذاره (معادلِ CF-Connecting-IP خودِ کلادفلر)
  forwardHeaders.set(
    "X-Real-Client-IP",
    request.headers.get("x-nf-client-connection-ip") || "unknown"
  );
  forwardHeaders.delete("Host");

  const proxiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });

  const response = await fetch(proxiedRequest);

  // جواب رو عیناً برمی‌گردونیم؛ همینه که Range/۲۰۶ برای سیک‌کردنِ صدا/ویدیو هم درست کار می‌کنه
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const config = {
  path: "/api/*",
};
