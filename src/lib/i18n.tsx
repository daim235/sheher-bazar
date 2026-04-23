import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "ur";

type Dict = Record<string, { en: string; ur: string }>;

const dict: Dict = {
  "nav.home": { en: "Home", ur: "ہوم" },
  "nav.grocery": { en: "Grocery", ur: "گروسری" },
  "nav.services": { en: "Services", ur: "خدمات" },
  "nav.marketplace": { en: "Marketplace", ur: "بازار" },
  "nav.about": { en: "About", ur: "تعارف" },
  "nav.dashboard": { en: "Dashboard", ur: "ڈیش بورڈ" },
  "nav.signin": { en: "Login", ur: "لاگ ان" },
  "nav.signup": { en: "Register", ur: "رجسٹر" },
  "nav.signout": { en: "Sign out", ur: "لاگ آؤٹ" },

  "hero.tag": { en: "Sargodha, Punjab, Pakistan", ur: "سرگودھا، پنجاب، پاکستان" },
  "hero.title": { en: "Welcome to Shahar Bazar", ur: "شہر بازار میں خوش آمدید" },
  "hero.subtitle": { en: "Sargodha's Own Online Marketplace", ur: "سرگودھا کا اپنا آن لائن بازار" },
  "hero.tagline": { en: "Shop from your favorite local stores from the comfort of your home", ur: "اپنے گھر کے آرام سے اپنی پسندیدہ مقامی دکانوں سے خریداری کریں" },
  "hero.search.placeholder": { en: "Search products or shops…", ur: "پروڈکٹس یا دکانیں تلاش کریں…" },
  "hero.search.service": { en: "What do you need? e.g. plumber", ur: "کیا چاہیے؟ مثلاً پلمبر" },
  "hero.search.city": { en: "City", ur: "شہر" },
  "hero.search.btn": { en: "Search", ur: "تلاش کریں" },

  "section.categories": { en: "Categories", ur: "زمرے" },
  "section.popular": { en: "Popular categories", ur: "مقبول زمرے" },
  "section.topServices": { en: "Top-rated services", ur: "بہترین درجہ بندی والی خدمات" },
  "section.shops": { en: "Featured shops", ur: "نمایاں دکانیں" },
  "section.how": { en: "How Shahar Bazar works", ur: "شہر بازار کیسے کام کرتا ہے" },
  "section.comingSoon": { en: "Coming Soon", ur: "جلد آرہا ہے" },
  "section.why": { en: "Why Shahar Bazar?", ur: "شہر بازار کیوں؟" },
  "section.testimonials": { en: "What Our Customers Say", ur: "ہمارے گاہک کیا کہتے ہیں" },
  "section.becomeVendor": { en: "Become a Vendor", ur: "وینڈر بنیں" },
  "section.becomeVendor.body": { en: "Bring your shop to Shahar Bazar", ur: "اپنی دکان شہر بازار پر لائیں" },

  "cat.grocery": { en: "Grocery", ur: "گروسری" },
  "cat.grocery.body": { en: "Fresh produce, spices & daily essentials", ur: "تازہ سبزیاں، مصالحے اور روزمرہ اشیاء" },
  "cat.services": { en: "Services", ur: "خدمات" },
  "cat.services.body": { en: "Plumbers, electricians, mechanics & more", ur: "پلمبر، الیکٹریشن، مکینک اور مزید" },
  "cat.clothing": { en: "Clothing", ur: "کپڑے" },
  "cat.electronics": { en: "Electronics", ur: "الیکٹرانکس" },
  "cat.cosmetics": { en: "Cosmetics", ur: "کاسمیٹکس" },
  "cat.shopNow": { en: "Shop now", ur: "ابھی خریدیں" },
  "cat.exploreServices": { en: "Find a service", ur: "سروس تلاش کریں" },

  "why.delivery.title": { en: "Fast Delivery", ur: "تیز ترسیل" },
  "why.delivery.body": { en: "Same-day delivery in Sargodha", ur: "سرگودھا میں اسی دن ترسیل" },
  "why.vendors.title": { en: "Local Vendors", ur: "مقامی وینڈرز" },
  "why.vendors.body": { en: "Support your trusted neighborhood shops", ur: "اپنی قابل اعتماد محلے کی دکانوں کا ساتھ دیں" },
  "why.secure.title": { en: "Secure Orders", ur: "محفوظ آرڈرز" },
  "why.secure.body": { en: "Safe payments & quality guaranteed", ur: "محفوظ ادائیگیاں اور معیار کی ضمانت" },

  "how.1.title": { en: "Search nearby", ur: "قریب تلاش کریں" },
  "how.1.body": { en: "Browse by category to find shops & providers near you.", ur: "اپنے قریب دکانیں اور فراہم کنندگان تلاش کرنے کے لیے زمرہ کے حساب سے براؤز کریں۔" },
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
  "common.register": { en: "Register", ur: "رجسٹر کریں" },
  "common.subscribe": { en: "Subscribe", ur: "سبسکرائب کریں" },

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

  "footer.tagline": { en: "Shop from your favorite local stores from the comfort of your home", ur: "اپنے گھر کے آرام سے اپنی پسندیدہ مقامی دکانوں سے خریداری کریں" },
  "footer.quickLinks": { en: "Quick Links", ur: "فوری روابط" },
  "footer.contact": { en: "Contact Us", ur: "ہم سے رابطہ" },
  "footer.newsletter": { en: "Newsletter", ur: "نیوز لیٹر" },
  "footer.newsletter.body": { en: "Subscribe for special offers", ur: "خصوصی پیشکشوں کے لیے سبسکرائب کریں" },
  "footer.email.placeholder": { en: "your@email.com", ur: "آپ کا ای میل" },
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
