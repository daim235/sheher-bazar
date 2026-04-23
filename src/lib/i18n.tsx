import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "ur";

type Dict = Record<string, { en: string; ur: string }>;

const dict: Dict = {
  "nav.home": { en: "Home", ur: "ہوم" },
  "nav.services": { en: "Services", ur: "خدمات" },
  "nav.marketplace": { en: "Marketplace", ur: "بازار" },
  "nav.dashboard": { en: "Dashboard", ur: "ڈیش بورڈ" },
  "nav.signin": { en: "Sign in", ur: "لاگ ان" },
  "nav.signup": { en: "Join", ur: "شامل ہوں" },
  "nav.signout": { en: "Sign out", ur: "لاگ آؤٹ" },

  "hero.tag": { en: "Your local marketplace", ur: "آپ کا مقامی بازار" },
  "hero.title": { en: "Find trusted services & shops in your city", ur: "اپنے شہر میں قابل اعتماد خدمات اور دکانیں تلاش کریں" },
  "hero.subtitle": { en: "Connect with plumbers, electricians, mechanics, and local vendors — book in minutes.", ur: "پلمبر، الیکٹریشن، مکینک اور مقامی دکانداروں سے رابطہ کریں — منٹوں میں بک کریں۔" },
  "hero.search.service": { en: "What do you need? e.g. plumber", ur: "کیا چاہیے؟ مثلاً پلمبر" },
  "hero.search.city": { en: "City", ur: "شہر" },
  "hero.search.btn": { en: "Search", ur: "تلاش کریں" },

  "section.popular": { en: "Popular categories", ur: "مقبول زمرے" },
  "section.topServices": { en: "Top-rated services", ur: "بہترین درجہ بندی والی خدمات" },
  "section.shops": { en: "Featured shops", ur: "نمایاں دکانیں" },
  "section.how": { en: "How Shahar Bazar works", ur: "شہر بازار کیسے کام کرتا ہے" },

  "how.1.title": { en: "Search nearby", ur: "قریب تلاش کریں" },
  "how.1.body": { en: "Browse by category and city to find providers near you.", ur: "اپنے قریب فراہم کنندگان تلاش کرنے کے لیے زمرہ اور شہر کے حساب سے براؤز کریں۔" },
  "how.2.title": { en: "Compare & chat", ur: "موازنہ اور چیٹ" },
  "how.2.body": { en: "Read reviews, compare prices, and chat before you book.", ur: "بک کرنے سے پہلے جائزے پڑھیں، قیمتوں کا موازنہ کریں اور چیٹ کریں۔" },
  "how.3.title": { en: "Book or buy", ur: "بک کریں یا خریدیں" },
  "how.3.body": { en: "Book a service visit or order from local shops in one tap.", ur: "ایک ٹیپ میں سروس وزٹ بک کریں یا مقامی دکانوں سے آرڈر کریں۔" },

  "common.from": { en: "From", ur: "سے" },
  "common.book": { en: "Book now", ur: "ابھی بک کریں" },
  "common.chat": { en: "Chat", ur: "چیٹ" },
  "common.viewAll": { en: "View all", ur: "سب دیکھیں" },
  "common.addToCart": { en: "Add to cart", ur: "کارٹ میں شامل کریں" },
  "common.visitShop": { en: "Visit shop", ur: "دکان دیکھیں" },
  "common.rating": { en: "rating", ur: "درجہ بندی" },
  "common.reviews": { en: "reviews", ur: "جائزے" },
  "common.loading": { en: "Loading…", ur: "لوڈ ہو رہا ہے…" },
  "common.empty": { en: "Nothing here yet.", ur: "ابھی یہاں کچھ نہیں۔" },
  "common.cancel": { en: "Cancel", ur: "منسوخ کریں" },
  "common.confirm": { en: "Confirm", ur: "تصدیق کریں" },
  "common.send": { en: "Send", ur: "بھیجیں" },

  "filter.allCities": { en: "All cities", ur: "تمام شہر" },
  "filter.allCategories": { en: "All categories", ur: "تمام زمرے" },

  "auth.welcome": { en: "Welcome to Shahar Bazar", ur: "شہر بازار میں خوش آمدید" },
  "auth.subtitle": { en: "Sign in or create an account to continue", ur: "جاری رکھنے کے لیے لاگ ان کریں یا اکاؤنٹ بنائیں" },
  "auth.email": { en: "Email", ur: "ای میل" },
  "auth.password": { en: "Password", ur: "پاس ورڈ" },
  "auth.fullName": { en: "Full name", ur: "پورا نام" },
  "auth.signin": { en: "Sign in", ur: "لاگ ان" },
  "auth.signup": { en: "Create account", ur: "اکاؤنٹ بنائیں" },
  "auth.toggleSignup": { en: "New here? Create an account", ur: "نئے ہیں؟ اکاؤنٹ بنائیں" },
  "auth.toggleSignin": { en: "Already have an account? Sign in", ur: "پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں" },

  "dash.welcome": { en: "Welcome back", ur: "واپسی پر خوش آمدید" },
  "dash.bookings": { en: "My bookings", ur: "میری بکنگز" },
  "dash.listings": { en: "My listings", ur: "میری فہرستیں" },
  "dash.messages": { en: "Messages", ur: "پیغامات" },
  "dash.profile": { en: "Profile", ur: "پروفائل" },

  "footer.tagline": { en: "Connecting your city, one service at a time.", ur: "آپ کے شہر کو ایک خدمت میں جوڑنا۔" },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sb-lang") as Lang | null;
    if (stored === "en" || stored === "ur") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("sb-lang", l);
  };

  const t = (key: string) => dict[key]?.[lang] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === "ur" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
