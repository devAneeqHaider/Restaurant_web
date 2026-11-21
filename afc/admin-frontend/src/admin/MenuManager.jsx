import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../api";
import { rs, defaultImage, defaultPath } from "../util";
import FoodImg from "../components/FoodImg";
import PageHead from "./PageHead";
import { rs, defaultImage, defaultPath, resolveMediaUrl } from "../util";
const showing = resolveMediaUrl(preview || (!removeImg && item?.image)) || defaultImage({ name: f.name, category_name: catName });

function Modal({ title, onClose, children }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}

function CategoryForm({ cat, onSaved, onClose }) {
  const [f, setF] = useState({ name: cat?.name || "", tagline: cat?.tagline || "", is_active: cat?.is_active ?? true });
  const [err, setErr] = useState("");
  const save = async (e) => {
    e.preventDefault();
    try { await api.saveCategory({ ...(cat || {}), ...f }); onSaved(); } catch (x) { setErr(x.name?.[0] || x.detail || "Could not save category"); }
  };
  return (
    <form className="form" onSubmit={save}>
      <label>Category name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Cakes" required /></label>
      <label>Tagline on website<input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} placeholder="e.g. 20+ Items or Up to 30% OFF" /></label>
      <label className="check"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Show on customer website</label>
      {err && <p className="alert-err">{err}</p>}
      <div className="form-act"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-grad">Save category</button></div>
    </form>
  );
}

function ItemForm({ item, cats, defaultCat, onSaved, onClose }) {
  const [f, setF] = useState({
    name: item?.name || "", description: item?.description || "", price: item?.price || "",
    category: item?.category || defaultCat || cats[0]?.id || "", is_best_seller: item?.is_best_seller || false, is_available: item?.is_available ?? true,
  });
  const [file, setFile] = useState(null);
  const [removeImg, setRemoveImg] = useState(false);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const catName = cats.find((c) => String(c.id) === String(f.category))?.name;

  const pick = (e) => {
    const fl = e.target.files[0];
    if (!fl) return;
    if (!fl.type.startsWith("image/")) return setErr("Please choose an image file (JPG, PNG or WebP)");
    if (fl.size > 5 * 1024 * 1024) return setErr("Image is too large. Max 5 MB");
    setErr(""); setFile(fl); setRemoveImg(false); setPreview(URL.createObjectURL(fl));
  };
  const showing = preview || (!removeImg && item?.image) || defaultImage({ name: f.name, category_name: catName });
  const usingDefault = !preview && (removeImg || !item?.image);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    if (removeImg && !file) fd.append("remove_image", "true");
    try { await api.saveItem(item?.id, fd); onSaved(); }
    catch (x) { setErr(Object.values(x).flat().join(" ") || "Could not save item"); }
    finally { setBusy(false); }
  };

  return (
    <form className="form" onSubmit={save}>
      <div className="photo-pick">
        <img src={showing} alt="Item preview" onError={(e) => (e.currentTarget.src = defaultPath("generic"))} />
        <div>
          <label className="btn btn-ghost"><ImagePlus size={17} /> {item?.image || preview ? "Change photo" : "Upload photo"}<input type="file" accept="image/*" hidden onChange={pick} /></label>
          {(item?.image || preview) && <button type="button" className="link-btn" onClick={() => { setFile(null); setPreview(null); setRemoveImg(true); }}>Remove photo</button>}
          <small>{usingDefault ? "No photo uploaded — the default photo will be shown." : "Custom photo will be shown on the website."}</small>
        </div>
      </div>
      <label>Item name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
      <label>Description<input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="two">
        <label>Price (PKR)<input type="number" min="1" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></label>
        <label>Category<select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} required>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <label className="check"><input type="checkbox" checked={f.is_best_seller} onChange={(e) => setF({ ...f, is_best_seller: e.target.checked })} /> Show in Best Sellers</label>
      <label className="check"><input type="checkbox" checked={f.is_available} onChange={(e) => setF({ ...f, is_available: e.target.checked })} /> Available to order</label>
      {err && <p className="alert-err">{err}</p>}
      <div className="form-act"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-grad" disabled={busy}>{busy ? "Saving…" : "Save item"}</button></div>
    </form>
  );
}

export default function MenuManager({ dealsOnly = false }) {
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null); // {type:'cat'|'item', data}
  const load = useCallback(async () => { setCats(await api.adminCategories()); setItems(await api.adminItems()); }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const dealCat = cats.find((c) => /deal/i.test(c.name));
  const shownCats = dealsOnly ? cats.filter((c) => c === dealCat) : cats;
  const shown = dealsOnly ? items.filter((i) => i.category === dealCat?.id) : items;
  const done = () => { setModal(null); load(); };
  const delItem = async (i) => { if (confirm(`Delete “${i.name}”?`)) { await api.deleteItem(i.id); load(); } };
  const delCat = async (c) => { if (confirm(`Delete category “${c.name}” and all items inside it?`)) { await api.deleteCategory(c.id); load(); } };

  return (
    <>
      <PageHead title={dealsOnly ? "Deals" : "Menu"} subtitle={dealsOnly ? "Create and manage combo deals" : "Manage categories and items — changes show on the website immediately"} />
      {!dealsOnly && (
        <section className="card mm-cats">
          <div className="mm-head"><h3>Categories</h3><button className="btn btn-orange" onClick={() => setModal({ type: "cat" })}><Plus size={17} /> Add category</button></div>
          <div className="cat-chips">
            {cats.map((c) => (
              <span key={c.id} className={`cchip ${c.is_active ? "" : "off"}`}>
                <b>{c.name}</b><small>{items.filter((i) => i.category === c.id).length} items{c.is_active ? "" : " · hidden"}</small>
                <button aria-label={`Edit ${c.name}`} onClick={() => setModal({ type: "cat", data: c })}><Pencil size={14} /></button>
                <button aria-label={`Delete ${c.name}`} onClick={() => delCat(c)}><Trash2 size={14} /></button>
              </span>
            ))}
          </div>
        </section>
      )}
      <section className="card mm-items">
        <div className="mm-head"><h3>{dealsOnly ? "Deals" : "Items"}</h3>
          <button className="btn btn-grad" disabled={!cats.length} onClick={() => setModal({ type: "item", cat: dealsOnly ? dealCat?.id : undefined })}><Plus size={17} /> {dealsOnly ? "Add deal" : "Add item"}</button>
        </div>
        {dealsOnly && !dealCat && <p className="alert-err">Create a category named “Deals” in Menu first.</p>}
        <div className="mm-grid">
          {shown.map((i) => (
            <article key={i.id} className={`mm-card ${i.is_available ? "" : "off"}`}>
              <FoodImg item={i} className="mm-img" />
              <div className="mm-body">
                <small>{i.category_name}{i.is_best_seller ? " · Best seller" : ""}{i.is_available ? "" : " · Unavailable"}</small>
                <b>{i.name}</b><span className="price">{rs(i.price)}</span>
              </div>
              <div className="mm-act">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "item", data: i })}><Pencil size={14} /> Edit</button>
                <button className="btn btn-ghost btn-sm danger" onClick={() => delItem(i)}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
          {!shown.length && <p className="muted">Nothing here yet. Add your first {dealsOnly ? "deal" : "item"}.</p>}
        </div>
      </section>
      {modal?.type === "cat" && <Modal title={modal.data ? "Edit category" : "Add category"} onClose={() => setModal(null)}><CategoryForm cat={modal.data} onSaved={done} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "item" && <Modal title={modal.data ? "Edit item" : "Add item"} onClose={() => setModal(null)}><ItemForm item={modal.data} cats={shownCats.length ? (dealsOnly ? shownCats : cats) : cats} defaultCat={modal.cat} onSaved={done} onClose={() => setModal(null)} /></Modal>}
    </>
  );
}
