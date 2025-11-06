export function loadRecaptcha() {
  try {
  const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;
    if (document.getElementById('recaptcha-v3-script')) return;
    const s = document.createElement('script');
    s.id = 'recaptcha-v3-script';
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  } catch (e) {
    // noop
  }
}

export async function getRecaptchaToken(action = 'submit') {
  try {
  const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) return null;
    const win = window as any;
    if (!win.grecaptcha) {
      // The script may still be loading; wait a short time
      await new Promise((res) => setTimeout(res, 500));
    }
    if (!win.grecaptcha || !win.grecaptcha.ready) return null;
    return await new Promise<string | null>((resolve) => {
      win.grecaptcha.ready(() => {
        win.grecaptcha.execute(siteKey, { action }).then((token: string) => {
          resolve(token || null);
        }).catch(() => resolve(null));
      });
    });
  } catch (e) {
    return null;
  }
}
