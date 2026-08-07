"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  _count: { products: number };
};

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categorias");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // Initial data fetch on mount; load() manages its own loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setNewName("");
    setNewDescription("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoria?")) return;
    const res = await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingDescription(category.description);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/categorias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName, description: editingDescription }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    setEditingId(null);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-blue-dark">Categorias</h1>

      <form onSubmit={handleCreate} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de la nueva categoria"
          required
          className="flex-1 max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        />
        <input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Descripcion (opcional, se muestra en la tienda)"
          className="flex-1 max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-dark"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No hay categorias aun.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {editingId === category.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1"
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {editingId === category.id ? (
                      <input
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        className="w-full rounded border border-gray-200 px-2 py-1"
                      />
                    ) : (
                      <span className="line-clamp-1">{category.description || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{category.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{category._count.products}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === category.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => saveEdit(category.id)} className="text-emerald-600 hover:text-emerald-700">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => startEdit(category)} className="text-gray-400 hover:text-brand-blue">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
