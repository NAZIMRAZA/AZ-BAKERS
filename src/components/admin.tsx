"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, LockKeyhole, PackagePlus, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { money, type Product } from "@/lib/products";
import { useCatalog } from "@/components/catalog-provider";

const blankProduct = (): Product => ({ id: "", name: "", category: "Pastries", price: 0, description: "", image: "/images/bake-placeholder.svg", tags: [], serves: "One treat", ingredients: "", allergens: "", prepDays: 0, featured: false, stock: 0 });
const slug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AdminPage() {
  const { products, setProducts, source, refresh } = useCatalog();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/admin/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Admin access was not accepted.");
      setAuthorized(true);
      if (data.mode === "local-demo") setNotice("Local preview mode: add ADMIN_PASSWORD to .env.local before publishing the admin panel.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open the bakery desk."); }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault(); if (!draft || !draft.name.trim() || draft.price < 0) return;
    const isNew = !draft.id;
    const savedProduct = { ...draft, id: draft.id || slug(draft.name) || crypto.randomUUID() };
    if (isNew && products.some(item => item.id === savedProduct.id)) savedProduct.id = `${savedProduct.id}-${Date.now().toString().slice(-4)}`;
    setBusy(true); setError(""); setNotice("");
    try {
      if (source === "google-sheets") {
        const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ action: isNew ? "create" : "update", product: savedProduct }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save the product.");
        await refresh();
        setNotice("Saved to the Google Sheets menu.");
      } else {
        const next = isNew ? [...products, savedProduct] : products.map(item => item.id === savedProduct.id ? savedProduct : item);
        setProducts(next);
        setNotice("Saved in this browser. Connect Google Sheets to share menu changes across devices.");
      }
      setDraft(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the product."); }
    finally { setBusy(false); }
  }

  async function removeProduct(item: Product) {
    if (!window.confirm(`Remove “${item.name}” from the menu?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (source === "google-sheets") {
        const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ action: "delete", id: item.id }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not remove the product.");
        await refresh(); setNotice("Removed from the Google Sheets menu.");
      } else {
        setProducts(products.filter(product => product.id !== item.id));
        setNotice("Removed from this browser's menu.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove the product."); }
    finally { setBusy(false); }
  }

  return <main className="page-wrap admin-page">
    <div className="page-kicker"><Link href="/">Home</Link><span>/</span><span>Bakery desk</span></div>
    <Link className="back-shop" href="/"><ArrowLeft size={14}/> Back to the front of the shop</Link>
    {!authorized ? <section className="admin-login"><span className="login-icon"><LockKeyhole size={26}/></span><span className="eyebrow">A LITTLE ROOM FOR OUR TEAM</span><h1>The bakery <em>desk.</em></h1><p>Manage your menu, prices and availability from one place.</p><form onSubmit={login}><label>BAKERY ACCESS CODE <small>(leave blank for a local preview)</small><input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Your admin access code" autoComplete="current-password"/></label>{error && <div className="admin-error">{error}</div>}<button className="btn btn-primary">Open the desk <ArrowRight size={15}/></button></form><span className="admin-security"><ShieldCheck size={14}/> Admin password is checked server-side. Keep it in .env.local.</span></section> : <>
      <header className="admin-header"><div><span className="eyebrow">YOUR AZ BAKERS MENU</span><h1>A good day's <em>work.</em></h1><p>Add bakes, adjust prices and keep availability up to date.</p></div><button className="btn btn-primary" onClick={() => setDraft(blankProduct())}><Plus size={16}/> Add an item</button></header>
      <div className="sheet-status"><span className={source === "google-sheets" ? "sheet-status-dot connected" : "sheet-status-dot"}/><div><strong>{source === "google-sheets" ? "Connected to Google Sheets" : "Browser preview menu"}</strong><small>{source === "google-sheets" ? "Saved changes appear across your storefront." : "Changes are saved in this browser until a Sheet is connected."}</small></div><Link href="/menu">View the public price list <ArrowRight size={14}/></Link></div>
      {notice && <p className="admin-notice"><Check size={15}/>{notice}</p>}{error && <p className="admin-error admin-live-error">{error}</p>}
      {draft && <form className="product-editor" onSubmit={saveProduct}><div className="editor-heading"><div><span className="eyebrow">{draft.id ? "EDIT THE MENU" : "ADD A NEW BAKE"}</span><h2>{draft.id ? "A little update." : "Something new."}</h2></div><button type="button" className="icon-button" onClick={() => setDraft(null)} aria-label="Close editor">×</button></div><div className="admin-edit-grid"><label>Product name<input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Raspberry almond loaf"/></label><label>Category<input required value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} placeholder="Cakes, pastries, bread…"/></label><label>Price (₹)<input required type="number" min="0" step="1" value={draft.price || ""} onChange={event => setDraft({ ...draft, price: Number(event.target.value) })}/></label><label>Stock available<input type="number" min="0" value={draft.stock} onChange={event => setDraft({ ...draft, stock: Number(event.target.value) })}/></label><label>Preparation days<input type="number" min="0" value={draft.prepDays} onChange={event => setDraft({ ...draft, prepDays: Number(event.target.value) })}/></label><label>Serves / pack size<input value={draft.serves} onChange={event => setDraft({ ...draft, serves: event.target.value })} placeholder="Box of 4"/></label><label className="full-field">Short description<input value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })}/></label><label className="full-field">Image URL (optional)<input type="url" value={draft.image.startsWith("/") ? "" : draft.image} onChange={event => setDraft({ ...draft, image: event.target.value || "/images/bake-placeholder.svg" })} placeholder="https://… (a local illustrated fallback is used if it fails)"/></label><label className="full-field">Craving / occasion tags<input value={draft.tags.join(", ")} onChange={event => setDraft({ ...draft, tags: event.target.value.split(",").map(tag => tag.trim()).filter(Boolean) })} placeholder="chocolate, birthday, gift"/></label><label className="full-field">Ingredients<input value={draft.ingredients} onChange={event => setDraft({ ...draft, ingredients: event.target.value })}/></label><label className="full-field">Allergen information<input value={draft.allergens} onChange={event => setDraft({ ...draft, allergens: event.target.value })}/></label><label className="featured-check"><input type="checkbox" checked={Boolean(draft.featured)} onChange={event => setDraft({ ...draft, featured: event.target.checked })}/> Feature on the home page</label></div><div className="editor-actions"><button type="button" className="btn btn-secondary" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}><Save size={15}/>{busy ? "Saving…" : "Save menu item"}</button></div></form>}
      <div className="admin-stats"><div><span>ON THE MENU</span><strong>{products.length}</strong><small>little good things</small></div><div><span>READY TO GO</span><strong>{products.filter(product => product.stock > 0).length}</strong><small>available today</small></div><div><span>NEEDS A TOP-UP</span><strong>{products.filter(product => product.stock < 6).length}</strong><small>getting low on stock</small></div></div>
      <section className="admin-list"><div className="admin-list-heading"><span>PRODUCTS & PRICES</span><span>{products.length} menu items</span></div>{products.map(product => <div key={product.id} className="admin-product"><div className="admin-product-icon"><PackagePlus size={16}/></div><div className="admin-product-copy"><strong>{product.name}</strong><span>{product.category} · {product.serves}</span></div><div className="admin-product-price">{money(product.price)}</div><div className={product.stock < 6 ? "stock-badge low" : "stock-badge"}>{product.stock === 0 ? "Out of stock" : `${product.stock} available`}</div><button className="edit-item" onClick={() => setDraft({ ...product })}>Edit</button><button className="remove-item" disabled={busy} onClick={() => removeProduct(product)} aria-label={`Remove ${product.name}`}><Trash2 size={15}/></button></div>)}</section>
      <details className="sheets-setup"><summary><span><PackagePlus size={17}/> Connect the Google Sheets menu</span><ArrowRight size={15}/></summary><ol><li>Create a Google Sheet and add a tab named <strong>Products</strong>.</li><li>Paste the project’s <code>google-apps-script/Code.gs</code> into Extensions → Apps Script.</li><li>In Apps Script project settings, add script properties <code>SHEET_ID</code> and <code>ADMIN_KEY</code>.</li><li>Deploy the script as a Web app (execute as you; access available to anyone). Keep the write key private.</li><li>Copy <code>.env.example</code> to <code>.env.local</code>, set the deployment URL, a private admin password, and the matching key, then restart the app.</li></ol><p>Menu reads are public; edits pass through this server and the Apps Script checks its private key. Don’t put these secrets in a <code>NEXT_PUBLIC_</code> variable.</p><Link href="https://script.google.com/home" target="_blank" rel="noreferrer">Open Google Apps Script <ExternalLink size={13}/></Link></details>
    </>}
  </main>;
}
