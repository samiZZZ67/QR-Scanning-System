import {
  AlertCircle,
  Bell,
  CakeSlice,
  Camera,
  Check,
  ChefHat,
  Coffee,
  CupSoda,
  Flame,
  GlassWater,
  Hotel,
  Image as ImageIcon,
  Languages,
  Leaf,
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  Minus,
  Pencil,
  Pizza,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Unlock,
  Upload,
  Utensils,
  X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, clearStaffPin, getStaffPin, setStaffPin } from "./api.js";
import { buildAnalytics } from "./analytics.js";
import { supportedLanguages } from "./i18n.js";
import { floorFromTable, formatMoney, randomIdempotencyKey, statusOrder, statusTone, translated } from "./utils.js";
import { useRealtime } from "./useRealtime.js";

const ICONS = { Leaf, Utensils, Flame, Pizza, CakeSlice, Coffee, CupSoda, GlassWater };
const defaultHero =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=85";
const defaultMenuBanner =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=85";

function readableError(error, fallback = "Something went wrong. Please try again.") {
  return error?.message || fallback;
}

function LoadingIcon() {
  return <Loader2 size={16} className="animate-spin" />;
}

function FeedbackNote({ type = "info", text }) {
  if (!text) return null;
  const tone = type === "error" ? "notice-error" : type === "success" ? "notice-success" : "notice-info";
  const Icon = type === "error" ? AlertCircle : Check;
  return (
    <div className={`notice ${tone}`} role="status">
      <Icon size={16} />
      <span>{text}</span>
    </div>
  );
}

function OptimizedImage({ src, alt, className = "", fallbackSrc = defaultHero, previewable = false, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolvedSrc = src || fallbackSrc;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <>
      <div
        className={`group relative overflow-hidden bg-zinc-100 ${className}`}
        onClick={() => previewable && resolvedSrc && setPreviewOpen(true)}
      >
        {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200" />}
        {failed ? (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
            <ImageIcon size={24} />
          </div>
        ) : (
          <img
            {...props}
            src={resolvedSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          />
        )}
        {previewable && resolvedSrc && !failed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Tap to preview
          </div>
        )}
      </div>
      {previewable && previewOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewOpen(false)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/85 p-2 text-zinc-700" onClick={() => setPreviewOpen(false)}>
            <X size={20} />
          </button>
          <img src={resolvedSrc} alt={alt} className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </>
  );
}

function NumericField({ value, onChange, placeholder }) {
  return (
    <input
      className="field"
      type="text"
      inputMode="decimal"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

function StarRating({ value = 0, count, interactive = false, onChange, size = 16 }) {
  const rounded = Math.round(Number(value || 0));
  return (
    <div className="flex items-center gap-1" aria-label={`${value || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= rounded;
        const classes = active ? "fill-amber-400 text-amber-400" : "text-zinc-300";
        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              className="rating-button"
              onClick={() => onChange?.(star)}
              aria-label={`${star} stars`}
            >
              <Star size={size} className={classes} />
            </button>
          );
        }
        return <Star key={star} size={size} className={classes} />;
      })}
      {count !== undefined && <span className="ml-1 text-xs font-bold text-zinc-500">({count})</span>}
    </div>
  );
}

function fileToDataUrl(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 70));
      }
    };
    reader.onload = () => {
      onProgress?.(80);
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

async function uploadImageFile(file, folder, onProgress) {
  const dataUrl = await fileToDataUrl(file, onProgress);
  const uploaded = await api("/api/uploads/image", {
    method: "POST",
    body: { dataUrl, fileName: file.name, folder }
  });
  onProgress?.(100);
  return uploaded;
}

function assetsToMap(assets) {
  return Object.fromEntries((assets || []).map((asset) => [asset.key, asset]));
}

function route() {
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname === "/" && params.get("table")) {
    window.location.replace(`/order?table=${encodeURIComponent(params.get("table"))}`);
  }
  return {
    path: window.location.pathname,
    table: Number(params.get("table")),
    floor: params.get("floor") ? Number(params.get("floor")) : null,
    itemId: params.get("item") ? Number(params.get("item")) : null
  };
}

export default function App() {
  const current = route();

  if (current.path === "/order" && current.table) {
    return <CustomerPage tableNumber={current.table} />;
  }
  if (current.path === "/item" && current.itemId) {
    return <MenuItemPage itemId={current.itemId} tableNumber={current.table} />;
  }
  if (current.path === "/kitchen") {
    return <KitchenPage floor={current.floor} />;
  }
  if (current.path === "/waiter") {
    return <WaiterPage floor={current.floor} />;
  }
  if (current.path === "/admin") {
    return <AdminPage />;
  }
  return <LandingPage />;
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/80 p-1 shadow-sm">
      <Languages size={16} className="mx-1 text-teal-700" />
      {supportedLanguages.map((language) => (
        <button
          key={language.code}
          className={`rounded-md px-2 py-1 text-xs font-bold ${i18n.language?.startsWith(language.code) ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
          onClick={() => i18n.changeLanguage(language.code)}
        >
          {language.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function LandingPage() {
  const { t } = useTranslation(["common", "customer", "kitchen", "waiter", "admin"]);
  const [table, setTable] = useState("101");
  const [floor, setFloor] = useState("");
  const [assets, setAssets] = useState({});

  useEffect(() => {
    api("/api/assets")
      .then((items) => setAssets(assetsToMap(items)))
      .catch(() => setAssets({}));
  }, []);

  const heroImage = assets.landingHero?.url || defaultHero;

  return (
    <main
      className="hero-shell app-shell flex items-center justify-center p-4"
      style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 15, 23, 0.82), rgba(9, 15, 23, 0.35)), url(${heroImage})` }}
    >
      <section className="w-full max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4 text-white">
          <div>
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white shadow-lg backdrop-blur">
              <Hotel />
            </div>
            <h1 className="text-3xl font-black text-white md:text-5xl">{t("hotelName")}</h1>
            <p className="mt-2 max-w-2xl text-white/82">{t("common:landingIntro")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ActionCard icon={QrCode} title={t("customer:customerMenu")} text={t("customer:customerMenuHint")}>
            <div className="mt-4 flex gap-2">
              <input className="field" value={table} onChange={(event) => setTable(event.target.value)} inputMode="numeric" />
              <a className="btn btn-primary" href={`/order?table=${table}`}>{t("common:go")}</a>
            </div>
          </ActionCard>
          <ActionCard icon={Flame} title={t("kitchen:title")} text={t("kitchen:hint")}>
            <StaffLink path="/kitchen" floor={floor} setFloor={setFloor} />
          </ActionCard>
          <ActionCard icon={Bell} title={t("waiter:title")} text={t("waiter:hint")}>
            <StaffLink path="/waiter" floor={floor} setFloor={setFloor} />
          </ActionCard>
          <ActionCard icon={Lock} title={t("admin:title")} text={t("admin:hint")}>
            <a className="btn btn-secondary mt-4 w-full" href="/admin"><Unlock size={16} />{t("admin:openAdmin")}</a>
          </ActionCard>
        </div>
      </section>
    </main>
  );
}

function StaffLink({ path, floor, setFloor }) {
  const { t } = useTranslation("common");
  return (
    <div className="mt-4 space-y-2">
      <input className="field" value={floor} onChange={(event) => setFloor(event.target.value)} placeholder={t("floorOptional")} inputMode="numeric" />
      <a className="btn btn-secondary w-full" href={floor ? `${path}?floor=${floor}` : path}>
        <Unlock size={16} />
        {floor ? `${t("floor")} ${floor}` : t("allFloors")}
      </a>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text, children }) {
  return (
    <article className="surface rounded-xl p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
        <Icon />
      </div>
      <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      <p className="mt-1 text-sm text-zinc-600">{text}</p>
      {children}
    </article>
  );
}

function CustomerPage({ tableNumber }) {
  const { t, i18n } = useTranslation(["common", "customer"]);
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [assets, setAssets] = useState({});
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [order, setOrder] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const floor = floorFromTable(tableNumber);

  const loadMenu = useCallback(async () => {
    const [menuData, assetsData] = await Promise.all([api("/api/menu"), api("/api/assets")]);
    setMenu(menuData);
    setAssets(assetsToMap(assetsData));
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useRealtime(
    { role: "customer", orderId: order?.id },
    useMemo(() => ({
      "order.statusChanged": (nextOrder) => {
        if (nextOrder.id === order?.id) setOrder(nextOrder);
      },
      "menu.changed": () => loadMenu(),
      "assets.changed": () => loadMenu()
    }), [order?.id, loadMenu])
  );

  const visibleItems = menu.items.filter((item) => {
    const text = `${translated(item.name, i18n.language)} ${translated(item.description, i18n.language)}`.toLowerCase();
    return (category === "all" || item.categoryId === Number(category)) && text.includes(query.toLowerCase());
  });

  const addToCart = (item) => {
    setCartOpen(true);
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return current.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((current) => current
      .map((item) => item.id === itemId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const placeOrder = async () => {
    if (!cart.length || placing) return;
    setPlacing(true);
    setNotice({ type: "info", text: "Sending your order to the kitchen..." });
    try {
      const created = await api("/api/orders", {
        method: "POST",
        body: {
          tableNumber,
          notes,
          idempotencyKey: randomIdempotencyKey(),
          items: cart.map((item) => ({ menuItemId: item.id, quantity: item.quantity }))
        }
      });
      setOrder(created);
      setCart([]);
      setNotes("");
      setNotice({ type: "success", text: "Order sent successfully." });
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not place the order.") });
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return <OrderStatus order={order} setOrder={setOrder} tableNumber={tableNumber} floor={floor} />;
  }

  return (
    <main className="app-shell pb-28">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-black text-zinc-950">{t("hotelName")}</h1>
            <p className="text-sm text-zinc-500">{t("table")} {tableNumber} · {t("floor")} {floor}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[1fr_360px]">
        <section>
          <div
            className="menu-banner mb-4 overflow-hidden rounded-xl p-5 text-white"
            style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 15, 23, 0.74), rgba(9, 15, 23, 0.26)), url(${assets.menuBanner?.url || defaultMenuBanner})` }}
          >
            <p className="text-sm font-black uppercase text-white/70">{t("table")} {tableNumber}</p>
            <h2 className="mt-1 text-2xl font-black">{t("customer:customerMenu")}</h2>
          </div>
          <div className="surface mb-4 rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("common:search")} />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button className={`btn whitespace-nowrap ${category === "all" ? "btn-primary" : "btn-secondary"}`} onClick={() => setCategory("all")}>{t("all")}</button>
              {menu.categories.map((cat) => (
                <button key={cat.id} className={`btn whitespace-nowrap ${category === String(cat.id) ? "btn-primary" : "btn-secondary"}`} onClick={() => setCategory(String(cat.id))}>
                  <CategoryIcon icon={cat.icon} />
                  {translated(cat.name, i18n.language)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <DishCard key={item.id} item={item} language={i18n.language} onAdd={() => addToCart(item)} />
            ))}
          </div>
        </section>

        <aside className="surface hidden h-fit rounded-xl p-4 lg:sticky lg:top-24 lg:block">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black"><ShoppingBag size={20} />{t("customer:cart")}</h2>
            <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-black text-teal-900">{cart.length}</span>
          </div>
          {!cart.length ? (
            <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">{t("customer:emptyCart")}</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{translated(item.name, i18n.language)}</p>
                    <p className="text-sm text-zinc-500">{formatMoney(item.price * item.quantity)}</p>
                  </div>
                  <button className="btn btn-secondary !h-8 !min-h-8 !px-2" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                  <span className="w-5 text-center font-black">{item.quantity}</span>
                  <button className="btn btn-secondary !h-8 !min-h-8 !px-2" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                </div>
              ))}
              <textarea className="field" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("customer:notesPlaceholder")} />
              <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-lg font-black">
                <span>{t("total")}</span>
                <span>{formatMoney(total)}</span>
              </div>
              <FeedbackNote type={notice?.type} text={notice?.text} />
              <button className="btn btn-primary w-full" onClick={placeOrder} disabled={placing}>
                {placing ? <LoadingIcon /> : <ReceiptText size={18} />}
                {placing ? "Processing order..." : t("customer:placeOrder")}
              </button>
            </div>
          )}
        </aside>
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border border-zinc-200 bg-white/95 p-3 shadow-[0_-18px_40px_rgba(0,0,0,0.16)] backdrop-blur lg:hidden">
          <button className="mb-2 flex w-full items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2" onClick={() => setCartOpen((current) => !current)}>
            <span className="flex items-center gap-2 font-black"><ShoppingBag size={18} />{t("customer:cart")}</span>
            <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-black text-white">{cart.length}</span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${cartOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"}`}>
            {!cart.length ? (
              <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">{t("customer:emptyCart")}</p>
            ) : (
              <div className="space-y-3 pb-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{translated(item.name, i18n.language)}</p>
                      <p className="text-sm text-zinc-500">{formatMoney(item.price * item.quantity)}</p>
                    </div>
                    <button className="h-9 w-9 rounded-full border border-zinc-200 text-zinc-700" onClick={() => updateQuantity(item.id, -1)}><Minus size={16} className="mx-auto" /></button>
                    <span className="w-6 text-center font-black">{item.quantity}</span>
                    <button className="h-9 w-9 rounded-full border border-zinc-200 text-zinc-700" onClick={() => updateQuantity(item.id, 1)}><Plus size={16} className="mx-auto" /></button>
                  </div>
                ))}
                <textarea className="field" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("customer:notesPlaceholder")} />
                <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-black">
                  <span>{t("total")}</span>
                  <span>{formatMoney(total)}</span>
                </div>
                <FeedbackNote type={notice?.type} text={notice?.text} />
                <button className="btn btn-primary w-full" onClick={placeOrder} disabled={placing}>
                  {placing ? <LoadingIcon /> : <ReceiptText size={18} />}
                  {placing ? "Processing order..." : t("customer:placeOrder")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function DishCard({ item, language, onAdd }) {
  const { t } = useTranslation(["common", "customer"]);
  const [showReviews, setShowReviews] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 650);
  };

  const openItemPage = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("item", String(item.id));
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    window.location.reload();
  };

  return (
    <article className="surface overflow-hidden rounded-xl">
      <button type="button" onClick={openItemPage} className="block w-full text-left">
        <DishVisual item={item} language={language} />
      </button>
      <div className="p-4">
        <button type="button" onClick={openItemPage} className="mb-2 block w-full text-left">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-black text-zinc-950">{translated(item.name, language)}</h3>
            <span className="font-black text-teal-800">{formatMoney(item.price)}</span>
          </div>
        </button>
        <div className="mb-2 flex items-center justify-between gap-2">
          <StarRating value={item.ratingAverage} count={item.ratingCount} />
          <button className="text-xs font-black text-teal-700" onClick={() => setShowReviews((current) => !current)}>
            {showReviews ? "Hide reviews" : "Reviews"}
          </button>
        </div>
        <p className="min-h-10 text-sm text-zinc-600">{translated(item.description, language)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.popular && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800">{t("customer:popular")}</span>}
          {item.chefPick && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">{t("customer:chefPick")}</span>}
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700">{item.prepMinutes} {t("customer:min")}</span>
        </div>
        {showReviews && <DishReviews itemId={item.id} language={language} />}
        <button className="btn btn-primary mt-4 w-full" onClick={handleAdd} disabled={added}>
          {added ? <Check size={18} /> : <Plus size={18} />}
          {added ? "Added" : t("customer:addToCart")}
        </button>
      </div>
    </article>
  );
}

function MenuItemPage({ itemId, tableNumber }) {
  const { t, i18n } = useTranslation(["common", "customer"]);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/menu`)
      .then((menu) => {
        if (!active) return;
        const selected = menu.items.find((entry) => entry.id === itemId);
        if (selected) {
          setItem(selected);
        } else {
          setError("Item not found.");
        }
      })
      .catch((err) => active && setError(readableError(err, "Could not load item.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [itemId]);

  if (loading) {
    return <div className="app-shell flex items-center justify-center p-6"><div className="surface rounded-xl p-6 text-center font-black text-zinc-600">Loading item...</div></div>;
  }

  if (error || !item) {
    return <div className="app-shell flex items-center justify-center p-6"><div className="surface rounded-xl p-6 text-center font-black text-zinc-600">{error || "Item not found."}</div></div>;
  }

  return (
    <main className="app-shell pb-10">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-black text-zinc-950">{translated(item.name, i18n.language)}</h1>
            <p className="text-sm text-zinc-500">{t("table")} {tableNumber || "—"}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <article className="surface overflow-hidden rounded-2xl">
          <div className="h-72 overflow-hidden bg-zinc-100">
            <img src={item.imageThumbnail || item.image} alt={translated(item.name, i18n.language)} className="h-full w-full object-cover" />
          </div>
          <div className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-zinc-950">{translated(item.name, i18n.language)}</h2>
                <p className="mt-1 text-sm text-zinc-600">{translated(item.description, i18n.language)}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-teal-800">{formatMoney(item.price)}</p>
                <StarRating value={item.ratingAverage} count={item.ratingCount} />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {item.popular && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">{t("customer:popular")}</span>}
              {item.chefPick && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{t("customer:chefPick")}</span>}
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">{item.prepMinutes} {t("customer:min")}</span>
            </div>
            <DishReviews itemId={item.id} language={i18n.language} />
            <div className="mt-4 flex flex-wrap gap-3">
              <a className="btn btn-secondary" href={tableNumber ? `/order?table=${tableNumber}` : "/"}>{t("common:back")}</a>
              <a className="btn btn-primary" href={tableNumber ? `/order?table=${tableNumber}` : "/"}>{t("customer:addToCart")}</a>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

function DishVisual({ item, language }) {
  return (
    <div className="dish-photo group relative h-40 overflow-hidden">
      <OptimizedImage src={item.imageThumbnail || item.image} alt={translated(item.name, language)} className="h-full w-full" previewable />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/62 to-transparent p-3">
        <p className="max-w-full truncate text-sm font-black text-white">{translated(item.name, language)}</p>
      </div>
    </div>
  );
}

function DishReviews({ itemId, language }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/menu-items/${itemId}/reviews`)
      .then((items) => {
        if (active) {
          setReviews(items);
          setError("");
        }
      })
      .catch((err) => active && setError(readableError(err, "Could not load reviews.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [itemId]);

  if (loading) {
    return <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm font-bold text-zinc-500">Loading reviews...</div>;
  }
  if (error) {
    return <FeedbackNote type="error" text={error} />;
  }
  if (!reviews.length) {
    return <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm font-bold text-zinc-500">No reviews yet.</div>;
  }
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-zinc-50 p-3">
      {reviews.slice(0, 3).map((review) => (
        <div key={review.id} className="border-b border-zinc-200 pb-2 last:border-0 last:pb-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <StarRating value={review.rating} size={14} />
            <span className="text-xs font-bold text-zinc-500">{review.name || `Table ${review.tableNumber}`}</span>
          </div>
          {review.comment && <p className="text-sm text-zinc-600">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}

function CategoryIcon({ icon }) {
  const Icon = ICONS[icon] || Utensils;
  return <Icon size={16} />;
}

function OrderStatus({ order, setOrder, tableNumber, floor }) {
  const { t, i18n } = useTranslation(["common", "customer"]);
  const [busyRequest, setBusyRequest] = useState("");
  const [notice, setNotice] = useState(null);

  const sendServiceRequest = async (type) => {
    if (busyRequest) return;
    setBusyRequest(type);
    setNotice({ type: "info", text: "Sending request..." });
    try {
      await api("/api/service-notifications", { method: "POST", body: { tableNumber, type } });
      setNotice({ type: "success", text: "Request sent to staff." });
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not send request.") });
    } finally {
      setBusyRequest("");
    }
  };
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <main className="app-shell flex justify-center p-4">
      <section className="w-full max-w-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">{t("customer:yourOrder")}</h1>
            <p className="text-zinc-500">{t("orderNum")}{order.id} · {t("table")} {tableNumber} · {t("floor")} {floor}</p>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="surface rounded-xl p-5">
          <div className="space-y-3">
            {statusOrder.map((status, index) => (
              <div key={status} className={`flex items-center gap-3 rounded-lg border p-3 ${index <= currentIndex ? statusTone[status] : "border-zinc-200 bg-white text-zinc-400"}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80">{index <= currentIndex ? <Check size={16} /> : index + 1}</div>
                <span className="font-black">{t(status)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-zinc-50 p-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-1 text-sm">
                <span>{item.quantity}x {translated(item.name, i18n.language)}</span>
                <span className="font-bold">{formatMoney(item.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-zinc-200 pt-3 font-black">
              <span>{t("total")}</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button className="btn btn-secondary" onClick={() => sendServiceRequest("call-waiter")} disabled={Boolean(busyRequest)}>
              {busyRequest === "call-waiter" ? <LoadingIcon /> : <Bell size={18} />}
              {busyRequest === "call-waiter" ? "Sending..." : t("customer:callWaiter")}
            </button>
            <button className="btn btn-secondary" onClick={() => sendServiceRequest("request-bill")} disabled={Boolean(busyRequest)}>
              {busyRequest === "request-bill" ? <LoadingIcon /> : <ReceiptText size={18} />}
              {busyRequest === "request-bill" ? "Sending..." : t("customer:requestBill")}
            </button>
          </div>
          <FeedbackNote type={notice?.type} text={notice?.text} />
          {order.status === "delivered" && <CustomerFeedbackForm order={order} onSaved={(feedback) => setOrder({ ...order, feedback })} />}
          <button className="btn btn-primary mt-3 w-full" onClick={() => setOrder(null)}>{t("customer:newOrder")}</button>
        </div>
      </section>
    </main>
  );
}

function CustomerFeedbackForm({ order, onSaved }) {
  const [rating, setRating] = useState(order.feedback?.rating || 5);
  const [name, setName] = useState(order.feedback?.name || "");
  const [comment, setComment] = useState(order.feedback?.comment || "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(order.feedback ? { type: "success", text: "Thank you for your feedback." } : null);

  const submit = async () => {
    if (saving || order.feedback) return;
    setSaving(true);
    setNotice({ type: "info", text: "Submitting feedback..." });
    try {
      const feedback = await api(`/api/orders/${order.id}/feedback`, {
        method: "POST",
        body: { rating, name, comment }
      });
      onSaved(feedback);
      setNotice({ type: "success", text: "Thank you. Your feedback was submitted." });
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not submit feedback.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2 font-black text-amber-950">
        <MessageSquare size={18} />
        Order feedback
      </div>
      <StarRating value={rating} interactive={!order.feedback} onChange={setRating} size={22} />
      <div className="mt-3 grid gap-3">
        <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name (optional)" disabled={Boolean(order.feedback)} />
        <textarea className="field" rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your experience" disabled={Boolean(order.feedback)} />
      </div>
      <FeedbackNote type={notice?.type} text={notice?.text} />
      {!order.feedback && (
        <button className="btn btn-primary mt-3 w-full" onClick={submit} disabled={saving}>
          {saving ? <LoadingIcon /> : <Save size={16} />}
          {saving ? "Submitting..." : "Submit feedback"}
        </button>
      )}
    </section>
  );
}

function StaffGate({ children }) {
  const { t } = useTranslation("common");
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(Boolean(getStaffPin()));
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const unlock = async () => {
    if (unlocking) return;
    setUnlocking(true);
    setError("");
    try {
      await api("/api/staff/session", { method: "POST", body: { pin }, pinOverride: "" });
      setStaffPin(pin);
      setAuthenticated(true);
      setError("");
    } catch {
      setError(t("invalidPin"));
    } finally {
      setUnlocking(false);
    }
  };

  if (authenticated) {
    return children({ lock: () => { clearStaffPin(); setAuthenticated(false); } });
  }

  return (
    <main className="staff-shell flex min-h-screen items-center justify-center p-4">
      <section className="surface w-full max-w-sm rounded-xl p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
          <Lock />
        </div>
        <h1 className="text-2xl font-black">{t("staffPin")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("staffPinHint")}</p>
        <input className="field mt-4" type="password" value={pin} onChange={(event) => setPin(event.target.value)} onKeyDown={(event) => event.key === "Enter" && unlock()} disabled={unlocking} />
        {error && <p className="mt-2 text-sm font-bold text-rose-700">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" onClick={unlock} disabled={unlocking}>
          {unlocking ? <LoadingIcon /> : <Unlock size={18} />}
          {unlocking ? "Checking PIN..." : t("unlock")}
        </button>
      </section>
    </main>
  );
}

function KitchenPage({ floor }) {
  return <StaffGate>{({ lock }) => <KitchenContent floor={floor} lock={lock} />}</StaffGate>;
}

function KitchenContent({ floor, lock }) {
  const { t, i18n } = useTranslation(["common", "kitchen"]);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ active: "1" });
    if (floor) query.set("floor", floor);
    try {
      const [orderData, feedbackData] = await Promise.all([
        api(`/api/orders?${query}`),
        api("/api/feedback?limit=6")
      ]);
      setOrders(orderData);
      setFeedback(feedbackData);
      setNotice(null);
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not load kitchen data.") });
    } finally {
      setLoading(false);
    }
  }, [floor]);

  useEffect(() => { load(); }, [load]);
  useRealtime({ role: "kitchen", floor }, useMemo(() => ({
    "order.created": load,
    "order.statusChanged": load,
    "feedback.created": load
  }), [load]));

  const updateStatus = async (order, status) => {
    const key = `${order.id}:${status}`;
    setActionId(key);
    setNotice({ type: "info", text: "Updating order status..." });
    try {
      await api(`/api/orders/${order.id}/status`, { method: "PATCH", body: { status } });
      setNotice({ type: "success", text: "Order status updated." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not update order status.") });
    } finally {
      setActionId("");
    }
  };

  return (
    <StaffLayout title={t("kitchen:title")} subtitle={floor ? `${t("floor")} ${floor}` : t("allFloors")} icon={Flame} lock={lock}>
      <div className="mb-4 flex justify-end">
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? <LoadingIcon /> : <RefreshCw size={16} />}
          {loading ? "Refreshing..." : t("refresh")}
        </button>
      </div>
      <FeedbackNote type={notice?.type} text={notice?.text} />
      {!orders.length ? <EmptyState text={t("kitchen:noActive")} /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} language={i18n.language}>
              {order.status === "received" && (
                <button className="btn btn-primary" onClick={() => updateStatus(order, "preparing")} disabled={Boolean(actionId)}>
                  {actionId === `${order.id}:preparing` ? <LoadingIcon /> : <Flame size={16} />}
                  {actionId === `${order.id}:preparing` ? "Starting..." : t("kitchen:startPreparing")}
                </button>
              )}
              {order.status === "preparing" && (
                <button className="btn btn-primary" onClick={() => updateStatus(order, "ready")} disabled={Boolean(actionId)}>
                  {actionId === `${order.id}:ready` ? <LoadingIcon /> : <Check size={16} />}
                  {actionId === `${order.id}:ready` ? "Marking..." : t("kitchen:markReady")}
                </button>
              )}
              {order.status === "ready" && <span className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-800">{t("ready")}</span>}
            </OrderCard>
          ))}
        </div>
      )}
      <FeedbackPanel feedback={feedback} className="mt-6" />
    </StaffLayout>
  );
}

function WaiterPage({ floor }) {
  return <StaffGate>{({ lock }) => <WaiterContent floor={floor} lock={lock} />}</StaffGate>;
}

function WaiterContent({ floor, lock }) {
  const { t, i18n } = useTranslation(["common", "waiter"]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const orderQuery = new URLSearchParams({ status: "ready" });
    const notifQuery = new URLSearchParams({ status: "open" });
    if (floor) {
      orderQuery.set("floor", floor);
      notifQuery.set("floor", floor);
    }
    try {
      const [readyOrders, openNotifications] = await Promise.all([
        api(`/api/orders?${orderQuery}`),
        api(`/api/service-notifications?${notifQuery}`)
      ]);
      setOrders(readyOrders);
      setNotifications(openNotifications);
      setNotice(null);
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not load waiter data.") });
    } finally {
      setLoading(false);
    }
  }, [floor]);

  useEffect(() => { load(); }, [load]);
  useRealtime({ role: "waiter", floor }, useMemo(() => ({
    "order.statusChanged": load,
    "serviceNotification.created": load,
    "serviceNotification.resolved": load
  }), [load]));

  const markDelivered = async (order) => {
    setActionId(`deliver:${order.id}`);
    setNotice({ type: "info", text: "Marking order delivered..." });
    try {
      await api(`/api/orders/${order.id}/status`, { method: "PATCH", body: { status: "delivered" } });
      setNotice({ type: "success", text: "Order marked delivered." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not mark delivered.") });
    } finally {
      setActionId("");
    }
  };

  const resolveNotification = async (notification) => {
    setActionId(`notification:${notification.id}`);
    setNotice({ type: "info", text: "Resolving notification..." });
    try {
      await api(`/api/service-notifications/${notification.id}/resolve`, { method: "PATCH", body: {} });
      setNotice({ type: "success", text: "Notification resolved." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not resolve notification.") });
    } finally {
      setActionId("");
    }
  };

  return (
    <StaffLayout title={t("waiter:title")} subtitle={floor ? `${t("floor")} ${floor}` : t("allFloors")} icon={Bell} lock={lock}>
      <div className="mb-4 flex justify-end">
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? <LoadingIcon /> : <RefreshCw size={16} />}
          {loading ? "Refreshing..." : t("refresh")}
        </button>
      </div>
      <FeedbackNote type={notice?.type} text={notice?.text} />
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-black">{t("waiter:notifications")}</h2>
        {!notifications.length ? <EmptyState text={t("waiter:noNotifications")} /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {notifications.map((notification) => (
              <article key={notification.id} className="surface rounded-xl p-4">
                <p className="font-black">{notification.type === "request-bill" ? t("waiter:requestBill") : t("waiter:callWaiter")}</p>
                <p className="text-sm text-zinc-500">{t("table")} {notification.tableNumber} · {t("floor")} {notification.floor}</p>
                <button className="btn btn-primary mt-3" onClick={() => resolveNotification(notification)} disabled={Boolean(actionId)}>
                  {actionId === `notification:${notification.id}` ? <LoadingIcon /> : <Check size={16} />}
                  {actionId === `notification:${notification.id}` ? "Resolving..." : t("waiter:resolve")}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-black">{t("waiter:readyToDeliver")}</h2>
        {!orders.length ? <EmptyState text={t("waiter:noReady")} /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} language={i18n.language}>
                <button className="btn btn-primary" onClick={() => markDelivered(order)} disabled={Boolean(actionId)}>
                  {actionId === `deliver:${order.id}` ? <LoadingIcon /> : <Check size={16} />}
                  {actionId === `deliver:${order.id}` ? "Delivering..." : t("waiter:markDelivered")}
                </button>
              </OrderCard>
            ))}
          </div>
        )}
      </section>
    </StaffLayout>
  );
}

function StaffLayout({ title, subtitle, icon: Icon, lock, children }) {
  const { t } = useTranslation("common");
  return (
    <main className="staff-shell min-h-screen">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><Icon /></div>
            <div>
              <h1 className="text-xl font-black">{title}</h1>
              <p className="text-sm text-zinc-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <button className="btn btn-secondary" onClick={lock}><Lock size={16} />{t("lock")}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-5">{children}</div>
    </main>
  );
}

function OrderCard({ order, language, children }) {
  const { t } = useTranslation("common");
  return (
    <article className="surface rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">{t("orderNum")}{order.id}</h3>
          <p className="text-sm text-zinc-500">{t("table")} {order.tableNumber} · {t("floor")} {order.floor}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone[order.status]}`}>{t(order.status)}</span>
      </div>
      <div className="space-y-2 rounded-lg bg-zinc-50 p-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <span>{item.quantity}x {translated(item.name, language)}</span>
            <span className="font-bold">{formatMoney(item.lineTotal)}</span>
          </div>
        ))}
      </div>
      {order.notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">{order.notes}</p>}
      {order.feedback && (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <StarRating value={order.feedback.rating} />
            <span className="text-xs font-black text-emerald-900">Customer feedback</span>
          </div>
          {order.feedback.comment && <p className="text-sm text-emerald-950">{order.feedback.comment}</p>}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-black">{formatMoney(order.total)}</span>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </article>
  );
}

function EmptyState({ text }) {
  return <div className="surface rounded-xl p-8 text-center font-bold text-zinc-500">{text}</div>;
}

function FeedbackPanel({ feedback = [], className = "" }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={18} className="text-teal-700" />
        <h2 className="text-lg font-black">Customer feedback</h2>
      </div>
      {!feedback.length ? (
        <EmptyState text="No customer feedback yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {feedback.map((item) => (
            <article key={item.id} className="surface rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <StarRating value={item.rating} />
                <span className="text-xs font-black text-zinc-500">Order #{item.orderId}</span>
              </div>
              <p className="text-sm font-bold text-zinc-500">Table {item.tableNumber} · Floor {item.floor}</p>
              {item.comment && <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">{item.comment}</p>}
              {item.name && <p className="mt-2 text-xs font-bold text-zinc-500">{item.name}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminPage() {
  return <StaffGate>{({ lock }) => <AdminContent lock={lock} />}</StaffGate>;
}

function AdminContent({ lock }) {
  const { t } = useTranslation(["common", "admin"]);
  const [tab, setTab] = useState("dashboard");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menuData, tableData, orderData, reportData, assetsData, feedbackData] = await Promise.all([
        api("/api/menu?includeUnavailable=1"),
        api("/api/tables"),
        api("/api/orders"),
        api("/api/reports/today"),
        api("/api/assets"),
        api("/api/feedback?limit=25")
      ]);
      setMenu(menuData);
      setTables(tableData);
      setOrders(orderData);
      setReport(reportData);
      setAssets(assetsData);
      setFeedback(feedbackData);
      setNotice(null);
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not load admin data.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtime({ role: "admin" }, useMemo(() => ({
    "order.created": load,
    "order.statusChanged": load,
    "menu.changed": load,
    "assets.changed": load,
    "feedback.created": load
  }), [load]));

  const tabs = [
    ["dashboard", t("admin:dashboard")],
    ["menu", t("admin:menu")],
    ["categories", t("admin:categories")],
    ["tables", t("admin:tables")],
    ["orders", t("admin:orders")],
    ["feedback", "Feedback"],
    ["assets", "Images"]
  ];

  return (
    <StaffLayout title={t("admin:title")} subtitle={t("admin:subtitle")} icon={Hotel} lock={lock}>
      <nav className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} className={`btn whitespace-nowrap ${tab === id ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      <div className="mb-4 flex justify-end">
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? <LoadingIcon /> : <RefreshCw size={16} />}
          {loading ? "Refreshing..." : t("refresh")}
        </button>
      </div>
      <FeedbackNote type={notice?.type} text={notice?.text} />
      {tab === "dashboard" && <Dashboard report={report} orders={orders} feedback={feedback} />}
      <button className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-700 to-emerald-500 text-white shadow-xl transition hover:scale-105" onClick={() => setAssistantOpen((current) => !current)}>
        <Sparkles size={22} />
      </button>
      <div className={`fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-zinc-200 bg-white/95 shadow-2xl backdrop-blur transition-transform duration-300 ${assistantOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <div>
            <p className="text-sm font-black text-teal-700">Grok assistant</p>
            <p className="text-xs text-zinc-500">Context-aware help for the current page</p>
          </div>
          <button className="rounded-full bg-zinc-100 p-2 text-zinc-700" onClick={() => setAssistantOpen(false)}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          <GrokAssistant compact />
        </div>
      </div>
      {tab === "menu" && <MenuManager menu={menu} reload={load} />}
      {tab === "categories" && <CategoryManager menu={menu} reload={load} />}
      {tab === "tables" && <TableManager tables={tables} reload={load} />}
      {tab === "orders" && <OrdersHistory orders={orders} />}
      {tab === "feedback" && <FeedbackPanel feedback={feedback} />}
      {tab === "assets" && <AssetManager assets={assets} reload={load} />}
    </StaffLayout>
  );
}

function Dashboard({ report, orders, feedback }) {
  const { t, i18n } = useTranslation(["common", "admin"]);
  const [range, setRange] = useState("today");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [compareMode, setCompareMode] = useState(false);
  const computed = useMemo(() => buildAnalytics(orders, range, customRange, compareMode), [orders, range, customRange, compareMode]);
  const cards = [
    [t("admin:todayOrders"), computed.summary.totalOrders],
    [t("admin:todayRevenue"), formatMoney(computed.summary.totalRevenue)],
    ["Profit", formatMoney(computed.summary.totalProfit)],
    ["Average order", formatMoney(computed.summary.averageOrderValue)],
    ["Customers", computed.summary.totalCustomers],
    ["Best seller", computed.summary.bestSellingItems[0]?.name || "—"]
  ];
  const exportReports = (format) => {
    const rows = [
      ["Metric", "Value"],
      ["Revenue", formatMoney(computed.summary.totalRevenue)],
      ["Profit", formatMoney(computed.summary.totalProfit)],
      ["Sales", computed.summary.totalSales],
      ["Orders", computed.summary.totalOrders],
      ["Customers", computed.summary.totalCustomers]
    ];
    if (format === "csv") {
      const csv = rows.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "analytics.csv";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (format === "xlsx") {
      const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, cellIndex) => `<c r="${String.fromCharCode(65 + cellIndex)}${rowIndex + 1}"><v>${cell}</v></c>`).join("")}</row>`).join("")}</sheetData></worksheet>`;
      const blob = new Blob([xml], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "analytics.xlsx";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    const html = `<!doctype html><html><body><h1>Analytics Report</h1>${rows.map((row) => `<p>${row[0]}: ${row[1]}</p>`).join("")}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };
  const chartData = [
    { label: "Revenue", value: computed.summary.totalRevenue },
    { label: "Orders", value: computed.summary.totalOrders },
    { label: "Customers", value: computed.summary.totalCustomers }
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {['today','weekly','monthly','yearly','custom'].map((value) => (
            <button key={value} className={`btn ${range === value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRange(value)}>{value === 'custom' ? 'Custom' : value}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={`btn ${compareMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCompareMode((current) => !current)}>Compare</button>
          <button className="btn btn-secondary" onClick={() => exportReports("csv")}>Export CSV</button>
          <button className="btn btn-secondary" onClick={() => exportReports("xlsx")}>Export Excel</button>
          <button className="btn btn-secondary" onClick={() => exportReports("pdf")}>Export PDF</button>
        </div>
      </div>
      {range === 'custom' && (
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" type="date" value={customRange.from} onChange={(event) => setCustomRange((current) => ({ ...current, from: event.target.value }))} />
          <input className="field" type="date" value={customRange.to} onChange={(event) => setCustomRange((current) => ({ ...current, to: event.target.value }))} />
        </div>
      )}
      {compareMode && computed.comparison && (
        <article className="surface rounded-xl p-4">
          <h2 className="mb-3 text-lg font-black">Comparison snapshot</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-zinc-50 p-3"><p className="text-sm text-zinc-500">Revenue diff</p><p className={`mt-1 font-black ${computed.comparison.revenueDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{computed.comparison.revenueDifference >= 0 ? '▲' : '▼'} {formatMoney(Math.abs(computed.comparison.revenueDifference))}</p></div>
            <div className="rounded-xl bg-zinc-50 p-3"><p className="text-sm text-zinc-500">Order diff</p><p className={`mt-1 font-black ${computed.comparison.orderDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{computed.comparison.orderDifference >= 0 ? '▲' : '▼'} {Math.abs(computed.comparison.orderDifference)}</p></div>
            <div className="rounded-xl bg-zinc-50 p-3"><p className="text-sm text-zinc-500">Customer growth</p><p className={`mt-1 font-black ${computed.comparison.customerDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{computed.comparison.customerDifference >= 0 ? '▲' : '▼'} {Math.abs(computed.comparison.customerDifference)}</p></div>
            <div className="rounded-xl bg-zinc-50 p-3"><p className="text-sm text-zinc-500">Change</p><p className={`mt-1 font-black ${computed.comparison.percentageChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{computed.comparison.percentageChange >= 0 ? '▲' : '▼'} {Math.abs(computed.comparison.percentageChange).toFixed(1)}%</p></div>
          </div>
        </article>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <article key={label} className="surface rounded-xl p-4">
            <p className="text-sm font-bold text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface rounded-xl p-4">
          <h2 className="mb-3 text-lg font-black">{t("admin:popularItems")}</h2>
          {!computed.summary.bestSellingItems?.length ? <p className="text-zinc-500">{t("admin:noSales")}</p> : computed.summary.bestSellingItems.map((item) => (
            <div key={`${item.name}-${item.quantity}`} className="flex justify-between border-b border-zinc-100 py-2 last:border-0">
              <span>{item.name}</span>
              <span className="font-black">{item.quantity}</span>
            </div>
          ))}
        </article>
        <article className="surface rounded-xl p-4">
          <h2 className="mb-3 text-lg font-black">Operating snapshot</h2>
          <div className="space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between"><span>Completed</span><span className="font-black text-emerald-700">{computed.summary.completedOrders}</span></div>
            <div className="flex justify-between"><span>Pending</span><span className="font-black text-amber-700">{computed.summary.pendingOrders}</span></div>
            <div className="flex justify-between"><span>Cancelled</span><span className="font-black text-rose-700">{computed.summary.cancelledOrders}</span></div>
            <div className="flex justify-between"><span>Peak hour</span><span className="font-black text-zinc-900">{computed.summary.peakOrderingHours[0]?.[0] ?? "—"}:00</span></div>
          </div>
        </article>
      </div>
      <article className="surface rounded-xl p-4">
        <h2 className="mb-3 text-lg font-black">Business trends</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {chartData.map((entry) => (
            <div key={entry.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-black">{entry.label}</span>
                <span className="text-xs text-zinc-500">{entry.value}</span>
              </div>
              <div className="flex h-24 items-end gap-2">
                {[40, 60, 85, 55].map((height, index) => (
                  <div key={`${entry.label}-${index}`} className="flex-1 rounded-t-lg bg-gradient-to-t from-teal-600 to-emerald-400" style={{ height: `${Math.max(20, height)}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
      <FeedbackPanel feedback={feedback?.slice(0, 4) || []} />
      <OrdersHistory orders={orders.slice(0, 5)} />
    </div>
  );
}

const emptyTranslation = { en: "", am: "", ar: "" };

function MenuManager({ menu, reload }) {
  const { t, i18n } = useTranslation(["common", "admin"]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const blank = {
    categoryId: menu.categories[0]?.id || 1,
    name: emptyTranslation,
    description: emptyTranslation,
    price: "",
    image: "",
    imagePublicId: "",
    imageThumbnail: "",
    prepMinutes: "",
    popular: false,
    chefPick: false,
    available: true
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm((current) => ({ ...current, categoryId: current.categoryId || menu.categories[0]?.id || 1 }));
  }, [menu.categories]);

  const save = async () => {
    const path = editing ? `/api/menu-items/${editing}` : "/api/menu-items";
    setSaving(true);
    setNotice({ type: "info", text: editing ? "Updating menu item..." : "Creating menu item..." });
    try {
      await api(path, { method: editing ? "PATCH" : "POST", body: { ...form, price: Number(form.price) || 0, prepMinutes: Number(form.prepMinutes) || 0 } });
      setEditing(null);
      setForm(blank);
      setNotice({ type: "success", text: "Menu item saved." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not save menu item.") });
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...item });
  };

  const remove = async (id) => {
    setDeletingId(id);
    setNotice({ type: "info", text: "Deleting menu item..." });
    try {
      await api(`/api/menu-items/${id}`, { method: "DELETE" });
      setNotice({ type: "success", text: "Menu item deleted." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not delete menu item.") });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = (menu.items || []).filter((item) => {
    const text = `${translated(item.name, i18n.language)} ${translated(item.description, i18n.language)}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <MenuItemForm form={form} setForm={setForm} categories={menu.categories} save={save} editing={editing} saving={saving} notice={notice} />
      <div className="space-y-3">
        <div className="surface rounded-xl p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("common:search")} />
          </div>
        </div>
        {filteredItems.map((item) => (
          <article key={item.id} className="surface flex flex-wrap items-center gap-3 rounded-xl p-4">
            <img src={item.imageThumbnail || item.image} alt={translated(item.name, i18n.language)} className="h-20 w-24 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-black">{translated(item.name, i18n.language)}</p>
              <StarRating value={item.ratingAverage} count={item.ratingCount} />
              <p className="text-sm text-zinc-500">{formatMoney(item.price)} · {item.prepMinutes} {t("admin:min")} · {item.available ? t("admin:available") : t("admin:unavailable")}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => edit(item)}><Pencil size={16} />{t("edit")}</button>
            <button className="btn btn-danger" onClick={() => remove(item.id)} disabled={Boolean(deletingId)}>
              {deletingId === item.id ? <LoadingIcon /> : <Trash2 size={16} />}
              {deletingId === item.id ? "Deleting..." : t("delete")}
            </button>
          </article>
        ))}
        {!filteredItems.length && <EmptyState text="No matching menu items" />}
      </div>
    </div>
  );
}

function MenuItemForm({ form, setForm, categories, save, editing, saving, notice }) {
  const { t } = useTranslation(["common", "admin"]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadNotice, setUploadNotice] = useState(null);
  const setTranslation = (field, language, value) => setForm((current) => ({
    ...current,
    [field]: { ...(current[field] || emptyTranslation), [language]: value }
  }));

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadNotice({ type: "info", text: "Uploading image..." });
    try {
      const uploaded = await uploadImageFile(file, "qr-menu/menu-items", setUploadProgress);
      setForm((current) => ({
        ...current,
        image: uploaded.url,
        imageThumbnail: uploaded.thumbnail,
        imagePublicId: uploaded.publicId
      }));
      setUploadNotice({ type: "success", text: "Image uploaded." });
    } catch (error) {
      setUploadNotice({ type: "error", text: readableError(error, "Could not upload image.") });
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="surface h-fit rounded-xl p-4">
      <h2 className="mb-3 text-lg font-black">{editing ? t("admin:editItem") : t("admin:addItem")}</h2>
      <div className="space-y-3">
        {["en", "am", "ar"].map((language) => (
          <input key={`name-${language}`} className="field" value={form.name?.[language] || ""} onChange={(event) => setTranslation("name", language, event.target.value)} placeholder={`${t("admin:name")} ${language.toUpperCase()}`} />
        ))}
        {["en", "am", "ar"].map((language) => (
          <textarea key={`desc-${language}`} className="field" rows="2" value={form.description?.[language] || ""} onChange={(event) => setTranslation("description", language, event.target.value)} placeholder={`${t("admin:description")} ${language.toUpperCase()}`} />
        ))}
        <select className="field" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name.en}</option>)}
        </select>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg bg-white text-zinc-400">
              {form.image || form.imageThumbnail ? (
                <img src={form.imageThumbnail || form.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={22} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label className="btn btn-secondary w-full cursor-pointer">
                {uploading ? <LoadingIcon /> : <Upload size={16} />}
                {uploading ? `Uploading ${uploadProgress}%` : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} disabled={uploading} />
              </label>
            </div>
          </div>
          {uploading && <div className="progress-bar"><span style={{ width: `${uploadProgress}%` }} /></div>}
          <input className="field" value={form.image || ""} onChange={(event) => setForm({ ...form, image: event.target.value, imageThumbnail: event.target.value })} placeholder="Optional image URL" />
          <FeedbackNote type={uploadNotice?.type} text={uploadNotice?.text} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumericField value={form.price ?? ""} onChange={(value) => setForm({ ...form, price: value })} placeholder={t("admin:price")} />
          <NumericField value={form.prepMinutes ?? ""} onChange={(value) => setForm({ ...form, prepMinutes: value })} placeholder={t("admin:prepMinutes")} />
        </div>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={form.popular} onChange={(event) => setForm({ ...form, popular: event.target.checked })} /> {t("admin:popular")}</label>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={form.chefPick} onChange={(event) => setForm({ ...form, chefPick: event.target.checked })} /> {t("admin:chefPick")}</label>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} /> {t("admin:available")}</label>
        <FeedbackNote type={notice?.type} text={notice?.text} />
        <button className="btn btn-primary w-full" onClick={save} disabled={saving || uploading}>
          {saving ? <LoadingIcon /> : <Save size={16} />}
          {saving ? "Saving..." : t("save")}
        </button>
      </div>
    </article>
  );
}

function CategoryManager({ menu, reload }) {
  const { t, i18n } = useTranslation(["common", "admin"]);
  const [form, setForm] = useState({ name: emptyTranslation, icon: "Utensils", image: "", imageThumbnail: "", imagePublicId: "", active: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState(null);
  const save = async () => {
    setSaving(true);
    setNotice({ type: "info", text: "Saving category..." });
    try {
      await api("/api/categories", { method: "POST", body: form });
      setForm({ name: emptyTranslation, icon: "Utensils", image: "", imageThumbnail: "", imagePublicId: "", active: true });
      setNotice({ type: "success", text: "Category saved." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not save category.") });
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    setDeletingId(id);
    setNotice({ type: "info", text: "Deleting category..." });
    try {
      await api(`/api/categories/${id}`, { method: "DELETE" });
      setNotice({ type: "success", text: "Category deleted." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not delete category.") });
    } finally {
      setDeletingId(null);
    }
  };
  const setName = (language, value) => setForm((current) => ({ ...current, name: { ...current.name, [language]: value } }));
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setNotice({ type: "info", text: "Uploading category image..." });
    try {
      const uploaded = await uploadImageFile(file, "qr-menu/categories", setUploadProgress);
      setForm((current) => ({ ...current, image: uploaded.url, imageThumbnail: uploaded.thumbnail, imagePublicId: uploaded.publicId }));
      setNotice({ type: "success", text: "Category image uploaded." });
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not upload category image.") });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <article className="surface h-fit rounded-xl p-4">
        <h2 className="mb-3 text-lg font-black">{t("admin:addCategory")}</h2>
        <div className="space-y-3">
          {["en", "am", "ar"].map((language) => <input key={language} className="field" value={form.name[language]} onChange={(event) => setName(language, event.target.value)} placeholder={`${t("admin:name")} ${language.toUpperCase()}`} />)}
          <select className="field" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>
            {Object.keys(ICONS).map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </select>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-lg bg-white text-zinc-400">
                {form.image || form.imageThumbnail ? <img src={form.imageThumbnail || form.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} />}
              </div>
              <label className="btn btn-secondary flex-1 cursor-pointer">
                {uploading ? <LoadingIcon /> : <Upload size={16} />}
                {uploading ? `Uploading ${uploadProgress}%` : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} disabled={uploading} />
              </label>
            </div>
            {uploading && <div className="progress-bar"><span style={{ width: `${uploadProgress}%` }} /></div>}
            <input className="field" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value, imageThumbnail: event.target.value })} placeholder="Optional image URL" />
          </div>
          <FeedbackNote type={notice?.type} text={notice?.text} />
          <button className="btn btn-primary w-full" onClick={save} disabled={saving || uploading}>
            {saving ? <LoadingIcon /> : <Save size={16} />}
            {saving ? "Saving..." : t("save")}
          </button>
        </div>
      </article>
      <div className="grid gap-3 md:grid-cols-2">
        {menu.categories.map((category) => (
          <article key={category.id} className="surface rounded-xl p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-14 w-16 items-center justify-center overflow-hidden rounded-lg bg-teal-100 text-teal-800">
                {category.imageThumbnail || category.image ? <img src={category.imageThumbnail || category.image} alt="" className="h-full w-full object-cover" /> : <CategoryIcon icon={category.icon} />}
              </div>
              <div>
                <p className="font-black">{translated(category.name, i18n.language)}</p>
                <p className="text-sm text-zinc-500">{category.icon}</p>
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => remove(category.id)} disabled={Boolean(deletingId)}>
              {deletingId === category.id ? <LoadingIcon /> : <Trash2 size={16} />}
              {deletingId === category.id ? "Deleting..." : t("delete")}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function AssetManager({ assets, reload }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assets.map((asset) => (
        <AssetCard key={asset.key} asset={asset} reload={reload} />
      ))}
    </div>
  );
}

function AssetCard({ asset, reload }) {
  const [url, setUrl] = useState(asset.url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setUrl(asset.url || "");
  }, [asset.url]);

  const saveAsset = async (payload) => {
    setSaving(true);
    setNotice({ type: "info", text: "Saving image..." });
    try {
      await api(`/api/assets/${asset.key}`, { method: "PATCH", body: payload });
      setNotice({ type: "success", text: "Image saved." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not save image.") });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setNotice({ type: "info", text: "Uploading image..." });
    try {
      const uploaded = await uploadImageFile(file, "qr-menu/assets", setUploadProgress);
      setUrl(uploaded.url);
      await saveAsset(uploaded);
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not upload image.") });
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="surface rounded-xl p-4">
      <div className="asset-preview mb-4 overflow-hidden rounded-lg">
        <img src={asset.thumbnail || url} alt={asset.label} className="h-full w-full object-cover" />
      </div>
      <h2 className="font-black">{asset.label}</h2>
      <p className="mb-3 text-sm text-zinc-500">{asset.key}</p>
      <div className="space-y-3">
        <label className="btn btn-secondary w-full cursor-pointer">
          {uploading ? <LoadingIcon /> : <Upload size={16} />}
          {uploading ? `Uploading ${uploadProgress}%` : "Upload replacement"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} disabled={uploading || saving} />
        </label>
        {uploading && <div className="progress-bar"><span style={{ width: `${uploadProgress}%` }} /></div>}
        <input className="field" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Image URL" />
        <FeedbackNote type={notice?.type} text={notice?.text} />
        <button className="btn btn-primary w-full" onClick={() => saveAsset({ url, thumbnail: url })} disabled={saving || uploading}>
          {saving ? <LoadingIcon /> : <Save size={16} />}
          {saving ? "Saving..." : "Save image"}
        </button>
      </div>
    </article>
  );
}

function GrokAssistant({ compact = false }) {
  const [task, setTask] = useState("translate");
  const [targetLanguage, setTargetLanguage] = useState("Amharic");
  const [tone, setTone] = useState("warm and concise");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [textBusy, setTextBusy] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageResult, setImageResult] = useState(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [history, setHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("grok-chat-history") || "[]");
    } catch {
      return [];
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("grok-chat-history", JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, textBusy]);

  const appendMessage = (item) => setHistory((current) => [...current, item]);

  const streamReply = (text) => {
    const assistantMessage = { role: "assistant", text: "", timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
    appendMessage(assistantMessage);
    const characters = Array.from(text || "Done");
    let index = 0;
    const step = () => {
      if (index >= characters.length) {
        setTextBusy(false);
        return;
      }
      setHistory((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = { ...last, text: `${last.text}${characters[index]}` };
        }
        return next;
      });
      index += 1;
      window.setTimeout(step, 18);
    };
    step();
  };

  const runText = async () => {
    if (!prompt.trim() || textBusy) return;
    const message = prompt.trim();
    appendMessage({ role: "user", text: message, timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
    setTextBusy(true);
    setPrompt("");
    setNotice({ type: "info", text: "Grok is thinking..." });
    try {
      const result = await api("/api/ai/grok", {
        method: "POST",
        body: { task, targetLanguage, tone, prompt: message }
      });
      setOutput(result.text);
      streamReply(result.text || "Done");
      setNotice({ type: "success", text: "Grok response ready." });
    } catch (error) {
      streamReply(readableError(error, "Grok request failed."));
      setNotice({ type: "error", text: readableError(error, "Grok request failed.") });
    }
  };

  const runImage = async () => {
    if (!imagePrompt.trim() || imageBusy) return;
    setImageBusy(true);
    setNotice({ type: "info", text: "Generating image..." });
    try {
      const generated = await api("/api/ai/grok/image", {
        method: "POST",
        body: { prompt: imagePrompt }
      });
      if (generated.url) {
        const uploaded = await api("/api/uploads/image", {
          method: "POST",
          body: { sourceUrl: generated.url, folder: "qr-menu/grok" }
        });
        setImageResult({ ...generated, ...uploaded });
      } else {
        setImageResult(generated);
      }
      setNotice({ type: "success", text: "Grok image ready." });
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Grok image generation failed.") });
    } finally {
      setImageBusy(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setOutput("");
  };

  const renderMessage = (text) => {
    const segments = text.split(/(```[\s\S]*?```)/g);
    return segments.map((segment, index) => {
      if (segment.startsWith("```")) {
        return <pre key={`${segment.slice(0, 10)}-${index}`} className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-2 text-xs text-zinc-100">{segment.slice(3, -3)}</pre>;
      }
      const inlineParts = segment.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return (
        <span key={`${segment}-${index}`}>
          {inlineParts.map((part, partIndex) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={`${part}-${partIndex}`}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return <code key={`${part}-${partIndex}`} className="rounded bg-zinc-100 px-1 py-0.5 text-[11px] text-zinc-800">{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex h-full flex-col ${compact ? "bg-white" : "gap-5"}`}>
      {!compact && (
        <article className="surface rounded-xl p-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-teal-700" />
            <h2 className="text-lg font-black">Grok writing assistant</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="field" value={task} onChange={(event) => setTask(event.target.value)}>
              <option value="translate">Translate</option>
              <option value="writing">Writing</option>
              <option value="content">Content</option>
            </select>
            <input className="field" value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} placeholder="Target language" />
            <input className="field" value={tone} onChange={(event) => setTone(event.target.value)} placeholder="Tone" />
          </div>
        </article>
      )}
      <article className={`flex flex-1 flex-col ${compact ? "p-3" : "surface rounded-xl p-4"}`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-zinc-800">Grok chat</p>
            <p className="text-xs text-zinc-500">{compact ? "Always available" : "Professional assistant"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700" onClick={clearHistory}>Clear chat</button>
            <button className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white" onClick={() => setHistory([])}>New chat</button>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-zinc-50 p-3">
          {history.length ? history.map((entry, index) => (
            <div key={`${entry.role}-${index}`} className={`rounded-2xl p-3 text-sm ${entry.role === "assistant" ? "bg-white text-zinc-700" : "bg-teal-600 text-white"}`}>
              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide opacity-70">
                <span>{entry.role === "assistant" ? "Grok" : "You"}</span>
                <span>{entry.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap">{renderMessage(entry.text)}</div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-500">
              Ask Grok to translate, improve descriptions, write content, or generate image ideas.
            </div>
          )}
          {textBusy && <div className="rounded-2xl bg-white p-3 text-sm text-zinc-500">Grok is thinking...</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-600" onClick={() => setTask("translate")}>Translate</button>
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-600" onClick={() => setTask("writing")}>Writing</button>
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-600" onClick={() => setTask("content")}>Content</button>
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-600" onClick={() => setIsRecording((current) => !current)}><Mic size={12} /></button>
          </div>
          {dragActive && <div className="rounded-xl border border-dashed border-teal-400 bg-teal-50 p-3 text-sm text-teal-700">Drop an image here to analyze it.</div>}
          <textarea className="field min-h-24" rows={compact ? 3 : 4} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask Grok anything about this admin page..." />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-600">
              <Camera size={14} /> Image
              <input type="file" accept="image/*" className="hidden" />
            </label>
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-600" onClick={() => setDragActive((current) => !current)}>Drop zone</button>
            <button className="ml-auto flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-black text-white" onClick={runText} disabled={textBusy || !prompt.trim()}>
              {textBusy ? <LoadingIcon /> : <Send size={16} />}
              {textBusy ? "Thinking..." : "Send"}
            </button>
          </div>
          <FeedbackNote type={notice?.type} text={notice?.text} />
        </div>
      </article>
    </div>
  );
}

function TableManager({ tables, reload }) {
  const { t } = useTranslation(["common", "admin"]);
  const [number, setNumber] = useState("");
  const [seats, setSeats] = useState(4);
  const [saving, setSaving] = useState(false);
  const [deletingNumber, setDeletingNumber] = useState(null);
  const [notice, setNotice] = useState(null);
  const baseUrl = window.location.origin;
  const floors = [...new Set(tables.map((table) => table.floor))].sort((a, b) => a - b);

  const addTable = async () => {
    setSaving(true);
    setNotice({ type: "info", text: "Adding table..." });
    try {
      await api("/api/tables", { method: "POST", body: { number: Number(number), seats: Number(seats) } });
      setNumber("");
      setNotice({ type: "success", text: "Table added." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not add table.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tableNumber) => {
    setDeletingNumber(tableNumber);
    setNotice({ type: "info", text: "Deleting table..." });
    try {
      await api(`/api/tables/${tableNumber}`, { method: "DELETE" });
      setNotice({ type: "success", text: "Table deleted." });
      await reload();
    } catch (error) {
      setNotice({ type: "error", text: readableError(error, "Could not delete table.") });
    } finally {
      setDeletingNumber(null);
    }
  };

  return (
    <div className="space-y-5">
      <article className="surface rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
          <input className="field" value={number} onChange={(event) => setNumber(event.target.value)} placeholder={t("admin:tableNumber")} inputMode="numeric" />
          <input className="field" value={seats} onChange={(event) => setSeats(event.target.value)} placeholder={t("admin:seats")} inputMode="numeric" />
          <button className="btn btn-primary" onClick={addTable} disabled={saving}>
            {saving ? <LoadingIcon /> : <Plus size={16} />}
            {saving ? "Adding..." : t("add")}
          </button>
        </div>
        <FeedbackNote type={notice?.type} text={notice?.text} />
      </article>
      {floors.map((floor) => (
        <section key={floor}>
          <h2 className="mb-3 text-lg font-black">{t("floor")} {floor}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {tables.filter((table) => table.floor === floor).map((table) => (
              <article key={table.number} className="surface rounded-xl p-4 text-center">
                <div className="mx-auto mb-3 w-fit rounded-lg bg-white p-2">
                  <QRCodeSVG value={`${baseUrl}/order?table=${table.number}`} size={112} />
                </div>
                <p className="font-black">{t("table")} {table.number}</p>
                <p className="text-sm text-zinc-500">{table.seats} {t("admin:seats")}</p>
                <button className="btn btn-danger mt-3 !min-h-9 !px-3" onClick={() => remove(table.number)} disabled={Boolean(deletingNumber)}>
                  {deletingNumber === table.number ? <LoadingIcon /> : <Trash2 size={14} />}
                  {deletingNumber === table.number ? "Deleting..." : t("delete")}
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function OrdersHistory({ orders }) {
  const { i18n } = useTranslation();
  if (!orders.length) return <EmptyState text="No orders yet" />;
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} language={i18n.language} />
      ))}
    </div>
  );
}
