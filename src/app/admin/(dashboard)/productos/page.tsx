"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, ArrowLeft, Upload, Search } from "lucide-react";
import { ProductImage } from "@/components/product-image";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  originalPriceUsd: number | null;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  featured: boolean;
  onSale: boolean;
  category: { id: string; name: string };
};

const emptyForm = {
  name: "",
  description: "",
  priceUsd: "",
  originalPriceUsd: "",
  stock: "",
  categoryId: "",
  imageUrl: null as string | null,
  active: true,
  featured: false,
  onSale: false,
};

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (categoriaFilter) params.set("categoria", categoriaFilter);
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`/api/admin/productos?${params.toString()}`),
      fetch("/api/admin/categorias"),
    ]);
    const data = await productsRes.json();
    setProducts(data.products);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setCategories(await categoriesRes.json());
    setLoading(false);
  }

  useEffect(() => {
    // Refetch whenever page/search/category filter changes; load() manages its own state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, categoriaFilter]);

  function startCreate() {
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setEditingId(null);
    setError(null);
    setView("form");
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description,
      priceUsd: String(product.priceUsd),
      originalPriceUsd: product.originalPriceUsd !== null ? String(product.originalPriceUsd) : "",
      stock: String(product.stock),
      categoryId: product.category.id,
      imageUrl: product.imageUrl,
      active: product.active,
      featured: product.featured,
      onSale: product.onSale,
    });
    setEditingId(product.id);
    setError(null);
    setView("form");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm((f) => ({ ...f, imageUrl: data.url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      priceUsd: Number(form.priceUsd),
      originalPriceUsd: form.onSale && form.originalPriceUsd ? Number(form.originalPriceUsd) : null,
      stock: Number(form.stock),
      categoryId: form.categoryId,
      imageUrl: form.imageUrl,
      active: form.active,
      featured: form.featured,
      onSale: form.onSale,
    };

    const res = await fetch(editingId ? `/api/admin/productos/${editingId}` : "/api/admin/productos", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setView("list");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/admin/productos/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    if (data.deactivated) {
      alert("El producto tiene pedidos asociados, se desactivo en lugar de eliminarse.");
    }
    load();
  }

  async function handleToggle(product: Product, field: "featured" | "onSale") {
    // Optimistic update so the checkbox feels instant.
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [field]: !p[field] } : p)));
    const res = await fetch(`/api/admin/productos/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !product[field] }),
    });
    if (!res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [field]: product[field] } : p)));
      const data = await res.json();
      alert(data.error ?? "No se pudo actualizar.");
    }
  }

  if (view === "form") {
    return (
      <div className="max-w-2xl">
        <button
          onClick={() => setView("list")}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <h1 className="mb-6 text-2xl font-bold text-brand-blue-dark">
          {editingId ? "Editar producto" : "Nuevo producto"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Precio (USD)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.priceUsd}
                onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            >
              <option value="" disabled>
                Selecciona una categoria
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Imagen</label>
            <div className="flex items-center gap-3">
              <ProductImage imageUrl={form.imageUrl} name={form.name} className="h-16 w-16 rounded-lg" />
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo..." : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Producto activo (visible en la tienda)
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Destacado (aparece en la sección &ldquo;Destacados&rdquo; del inicio)
          </label>

          <div className="rounded-lg border border-gray-200 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.onSale}
                onChange={(e) => setForm({ ...form, onSale: e.target.checked })}
              />
              En oferta (aparece en la sección &ldquo;Ofertas&rdquo; del inicio)
            </label>
            {form.onSale && (
              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">Precio original (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio antes de la oferta"
                  value={form.originalPriceUsd}
                  onChange={(e) => setForm({ ...form, originalPriceUsd: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Se muestra tachado junto al precio de oferta ({form.priceUsd ? `$${form.priceUsd}` : "el de arriba"}).
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="mt-2 w-fit rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-dark"
          >
            {editingId ? "Guardar cambios" : "Crear producto"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-blue-dark">Productos</h1>
        <button
          onClick={startCreate}
          className="flex items-center gap-1 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-dark"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            defaultValue={q}
            placeholder="Buscar productos..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setQ((e.target as HTMLInputElement).value);
              }
            }}
            className="w-64 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-blue focus:outline-none"
          />
        </div>
        <select
          value={categoriaFilter}
          onChange={(e) => {
            setPage(1);
            setCategoriaFilter(e.target.value);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        >
          <option value="">Todas las categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{total} productos</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Destacado</th>
              <th className="px-4 py-3 text-center">Oferta</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  No hay productos con esos filtros.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage imageUrl={product.imageUrl} name={product.name} className="h-10 w-10 rounded-lg" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{product.category.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {product.onSale && product.originalPriceUsd ? (
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-xs text-gray-400 line-through">
                          ${product.originalPriceUsd.toFixed(2)}
                        </span>
                        <span>${product.priceUsd.toFixed(2)}</span>
                      </span>
                    ) : (
                      `$${product.priceUsd.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={product.featured}
                      onChange={() => handleToggle(product, "featured")}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={product.onSale}
                      onChange={() => handleToggle(product, "onSale")}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => startEdit(product)} className="text-gray-400 hover:text-brand-blue">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
