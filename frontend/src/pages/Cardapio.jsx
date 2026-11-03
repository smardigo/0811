import { useEffect, useState } from "react";
import { apiClient, money } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X, Pizza } from "lucide-react";

const emptyProduct = {
  name: "", category_id: "", base_price: 0, description: "", image_url: "",
  is_pizza: false, pizza_flavors: [], pizza_pricing: "maior",
  variations: [], active: true,
};

export default function Cardapio() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [newCat, setNewCat] = useState("");

  const load = () => {
    apiClient.get("/categories").then((r) => setCats(r.data));
    apiClient.get("/products/all").then((r) => setProducts(r.data));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const payload = { ...editing };
      if (!payload.category_id) { toast.error("Selecione a categoria"); return; }
      if (!payload.name) { toast.error("Informe o nome"); return; }
      if (payload.id) {
        await apiClient.patch(`/products/${payload.id}`, payload);
        toast.success("Produto atualizado");
      } else {
        await apiClient.post("/products", payload);
        toast.success("Produto criado");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
  };

  const remove = async (p) => {
    if (!confirm(`Remover "${p.name}"?`)) return;
    await apiClient.delete(`/products/${p.id}`);
    toast.success("Removido");
    load();
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await apiClient.post("/categories", { name: newCat });
    setNewCat("");
    toast.success("Categoria adicionada");
    load();
  };

  const removeCategory = async (cid) => {
    try {
      await apiClient.delete(`/categories/${cid}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">Cardápio</h1>
          <p className="text-sm text-stone-500 mt-1">Gerencie produtos, preços e variações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCatDialog(true)} data-testid="manage-categories-btn">Categorias</Button>
          <Button onClick={() => setEditing({ ...emptyProduct })} data-testid="new-product-btn" className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-1" /> Novo produto
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {cats.map((cat) => {
          const items = products.filter((p) => p.category_id === cat.id);
          return (
            <Card key={cat.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-amber-800">{cat.name}</h3>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 group" data-testid={`product-row-${p.id}`}>
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-xl font-bold text-amber-700">{p.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate flex items-center gap-1">
                        {p.is_pizza && <Pizza className="h-3 w-3 text-amber-600" />}
                        {p.name}
                        {!p.active && <Badge variant="outline" className="text-xs">inativo</Badge>}
                      </div>
                      <div className="pos-number text-xs text-amber-700">{money(p.base_price)}</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(p)} data-testid={`edit-product-${p.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p)} data-testid={`delete-product-${p.id}`}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="col-span-full text-xs text-stone-400 italic py-2">Sem produtos nesta categoria</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <ProductEditor
          data={editing}
          setData={setEditing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent data-testid="categories-dialog">
          <DialogHeader><DialogTitle>Categorias</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-stone-50 rounded">
                <span>{c.name}</span>
                <Button size="icon" variant="ghost" onClick={() => removeCategory(c.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Input placeholder="Nova categoria" value={newCat} onChange={(e) => setNewCat(e.target.value)} data-testid="new-category-input" />
              <Button onClick={addCategory} data-testid="add-category-btn">Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductEditor({ data, setData, cats, onClose, onSave }) {
  const upd = (k, v) => setData((s) => ({ ...s, [k]: v }));

  const addVariation = () => upd("variations", [...data.variations, { name: "", type: "single", required: false, options: [] }]);
  const updVar = (i, v) => upd("variations", data.variations.map((x, idx) => idx === i ? { ...x, ...v } : x));
  const delVar = (i) => upd("variations", data.variations.filter((_, idx) => idx !== i));

  const addOpt = (vi) => updVar(vi, { options: [...data.variations[vi].options, { label: "", price_delta: 0 }] });
  const updOpt = (vi, oi, o) => updVar(vi, { options: data.variations[vi].options.map((x, idx) => idx === oi ? { ...x, ...o } : x) });
  const delOpt = (vi, oi) => updVar(vi, { options: data.variations[vi].options.filter((_, idx) => idx !== oi) });

  const addFlavor = () => upd("pizza_flavors", [...data.pizza_flavors, ""]);
  const updFlavor = (i, v) => upd("pizza_flavors", data.pizza_flavors.map((x, idx) => idx === i ? v : x));
  const delFlavor = (i) => upd("pizza_flavors", data.pizza_flavors.filter((_, idx) => idx !== i));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="product-editor">
        <DialogHeader>
          <DialogTitle>{data.id ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2">
            <Label>Nome *</Label>
            <Input value={data.name} onChange={(e) => upd("name", e.target.value)} data-testid="prod-edit-name" />
          </div>
          <div>
            <Label>Categoria *</Label>
            <Select value={data.category_id} onValueChange={(v) => upd("category_id", v)}>
              <SelectTrigger data-testid="prod-edit-cat"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preço base (R$) *</Label>
            <Input type="number" step="0.01" value={data.base_price} onChange={(e) => upd("base_price", parseFloat(e.target.value) || 0)} data-testid="prod-edit-price" />
          </div>
          <div className="col-span-2">
            <Label>Descrição</Label>
            <Textarea rows={2} value={data.description || ""} onChange={(e) => upd("description", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>URL da imagem</Label>
            <Input value={data.image_url || ""} onChange={(e) => upd("image_url", e.target.value)} placeholder="https://..." />
          </div>

          <div className="col-span-2 flex items-center gap-3 p-3 bg-amber-50 rounded border border-amber-200">
            <Pizza className="h-5 w-5 text-amber-700" />
            <div className="flex-1">
              <div className="font-semibold text-sm">Pizza com múltiplos sabores</div>
              <div className="text-xs text-stone-600">Permite montar meio-a-meio (até 4 sabores)</div>
            </div>
            <Switch checked={data.is_pizza} onCheckedChange={(v) => upd("is_pizza", v)} data-testid="prod-edit-is-pizza" />
          </div>

          <div className="col-span-2 flex items-center gap-3">
            <Switch checked={data.active} onCheckedChange={(v) => upd("active", v)} />
            <Label>Produto ativo (aparece no caixa)</Label>
          </div>

          {data.is_pizza && (
            <div className="col-span-2 p-3 bg-stone-50 rounded">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Sabores disponíveis</Label>
                <Button size="sm" variant="outline" onClick={addFlavor}>+ sabor</Button>
              </div>
              <div className="space-y-1.5">
                {data.pizza_flavors.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={f} onChange={(e) => updFlavor(i, e.target.value)} placeholder="Ex: Calabresa" data-testid={`flavor-${i}`} />
                    <Button size="icon" variant="ghost" onClick={() => delFlavor(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="col-span-2 p-3 bg-stone-50 rounded">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Variações (tamanho, ingredientes, etc.)</Label>
              <Button size="sm" variant="outline" onClick={addVariation}>+ variação</Button>
            </div>
            <div className="space-y-3">
              {data.variations.map((v, vi) => (
                <div key={vi} className="p-3 bg-white rounded border">
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    <Input className="col-span-2" placeholder="Nome (ex: Tamanho)" value={v.name} onChange={(e) => updVar(vi, { name: e.target.value })} />
                    <Select value={v.type} onValueChange={(val) => updVar(vi, { type: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Escolha única</SelectItem>
                        <SelectItem value="multiple">Múltipla</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch checked={v.required} onCheckedChange={(x) => updVar(vi, { required: x })} />
                      <span className="text-xs">obrig.</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => delVar(vi)}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-1 pl-3 border-l-2 border-amber-200">
                    {v.options.map((o, oi) => (
                      <div key={oi} className="flex gap-1.5">
                        <Input placeholder="Opção (ex: Pequeno)" value={o.label} onChange={(e) => updOpt(vi, oi, { label: e.target.value })} />
                        <Input type="number" step="0.01" placeholder="+R$" value={o.price_delta} onChange={(e) => updOpt(vi, oi, { price_delta: parseFloat(e.target.value) || 0 })} className="w-24" />
                        <Button size="icon" variant="ghost" onClick={() => delOpt(vi, oi)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => addOpt(vi)}>+ opção</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} className="bg-amber-600 hover:bg-amber-700" data-testid="prod-edit-save">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
