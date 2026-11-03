import { useEffect, useState } from "react";
import { apiClient, money, formatDateOnly } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CalendarDays, X, Pizza } from "lucide-react";

const STATUS_COLORS = {
  pendente: "bg-blue-100 text-blue-800",
  em_producao: "bg-amber-100 text-amber-800",
  pronta: "bg-emerald-100 text-emerald-800",
  entregue: "bg-stone-100 text-stone-700",
  cancelada: "bg-red-100 text-red-700",
};
const STATUS_LABEL = {
  pendente: "Pendente",
  em_producao: "Em produção",
  pronta: "Pronta",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export default function Encomendas() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [newForm, setNewForm] = useState(null);

  const load = async () => {
    const r = await apiClient.get("/encomendas");
    setList(r.data);
  };

  useEffect(() => {
    load();
    apiClient.get("/products").then((r) => setProducts(r.data));
  }, []);

  const open = () => {
    const today = new Date().toISOString().slice(0, 10);
    setNewForm({
      customer_name: "", customer_phone: "", delivery_date: today, delivery_time: "08:00",
      items: [], deposit: 0, notes: "",
    });
  };

  const addItem = () => {
    setNewForm((s) => ({
      ...s,
      items: [...s.items, { product_id: "", quantity: 1, variations_data: {}, pizza_halves: [], notes: "" }],
    }));
  };

  const updItem = (i, patch) => {
    setNewForm((s) => ({
      ...s,
      items: s.items.map((it, idx) => idx === i ? { ...it, ...patch } : it),
    }));
  };
  const delItem = (i) => setNewForm((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  const save = async () => {
    try {
      await apiClient.post("/encomendas", newForm);
      toast.success("Encomenda registrada");
      setNewForm(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
  };

  const updStatus = async (e, status) => {
    await apiClient.patch(`/encomendas/${e.id}`, { status });
    load();
  };

  const remove = async (e) => {
    if (!confirm("Remover encomenda?")) return;
    await apiClient.delete(`/encomendas/${e.id}`);
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const grouped = {};
  for (const e of list) {
    const key = e.delivery_date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">Encomendas</h1>
          <p className="text-sm text-stone-500 mt-1">Pedidos futuros e entregas programadas</p>
        </div>
        <Button onClick={open} data-testid="new-encomenda-btn" className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-1" /> Nova encomenda
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="p-12 text-center text-stone-500">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 text-stone-300" />
          Nenhuma encomenda. Crie a primeira acima.
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort().map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-amber-600" />
                <h3 className="font-display font-bold text-lg">
                  {date === today ? "Hoje" : formatDateOnly(date)}
                </h3>
                <Badge variant="outline">{items.length}</Badge>
                {date === today && <Badge className="bg-amber-100 text-amber-800">Entrega hoje</Badge>}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {items.map((e) => (
                  <Card key={e.id} className="p-4" data-testid={`encomenda-${e.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-display font-bold">{e.customer_name}</div>
                        <div className="text-xs text-stone-500">{e.customer_phone} · {e.delivery_time}</div>
                      </div>
                      <Badge className={STATUS_COLORS[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                    </div>
                    <div className="text-xs space-y-0.5 mb-2 text-stone-700">
                      {e.items.map((it, i) => (
                        <div key={i}>
                          {it.quantity}× {it.product_name}
                          {it.pizza_halves?.length > 0 && <span className="text-amber-700"> ({it.pizza_halves.join("/")})</span>}
                        </div>
                      ))}
                    </div>
                    {e.notes && <div className="text-xs italic text-stone-500 mb-2">Obs: {e.notes}</div>}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <div className="pos-number text-lg text-amber-700">{money(e.total)}</div>
                        {e.deposit > 0 && <div className="text-xs text-emerald-700">Sinal: {money(e.deposit)}</div>}
                      </div>
                      <div className="flex gap-1">
                        <Select value={e.status} onValueChange={(v) => updStatus(e, v)}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_producao">Em produção</SelectItem>
                            <SelectItem value="pronta">Pronta</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" onClick={() => remove(e)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {newForm && (
        <Dialog open onOpenChange={() => setNewForm(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="encomenda-dialog">
            <DialogHeader><DialogTitle>Nova encomenda</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome do cliente *</Label>
                <Input value={newForm.customer_name} onChange={(e) => setNewForm({ ...newForm, customer_name: e.target.value })} data-testid="encomenda-customer" /></div>
              <div><Label>Telefone</Label>
                <Input value={newForm.customer_phone} onChange={(e) => setNewForm({ ...newForm, customer_phone: e.target.value })} /></div>
              <div><Label>Data de entrega *</Label>
                <Input type="date" value={newForm.delivery_date} onChange={(e) => setNewForm({ ...newForm, delivery_date: e.target.value })} data-testid="encomenda-date" /></div>
              <div><Label>Horário</Label>
                <Input type="time" value={newForm.delivery_time} onChange={(e) => setNewForm({ ...newForm, delivery_time: e.target.value })} /></div>
              <div><Label>Sinal (R$)</Label>
                <Input type="number" step="0.01" value={newForm.deposit} onChange={(e) => setNewForm({ ...newForm, deposit: parseFloat(e.target.value) || 0 })} /></div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens</Label>
                  <Button size="sm" variant="outline" onClick={addItem} data-testid="add-encomenda-item">+ item</Button>
                </div>
                <div className="space-y-2">
                  {newForm.items.map((it, i) => {
                    const prod = products.find((p) => p.id === it.product_id);
                    return (
                      <div key={i} className="p-3 bg-stone-50 rounded space-y-2">
                        <div className="flex gap-2">
                          <Select value={it.product_id} onValueChange={(v) => updItem(i, { product_id: v, pizza_halves: [] })}>
                            <SelectTrigger data-testid={`encomenda-item-${i}`}><SelectValue placeholder="Selecione produto..." /></SelectTrigger>
                            <SelectContent className="max-h-64">
                              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({money(p.base_price)})</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input type="number" min={1} value={it.quantity} onChange={(e) => updItem(i, { quantity: parseFloat(e.target.value) || 1 })} className="w-20" />
                          <Button size="icon" variant="ghost" onClick={() => delItem(i)}><X className="h-4 w-4" /></Button>
                        </div>
                        {prod?.is_pizza && (
                          <div className="pl-2">
                            <div className="text-xs mb-1 text-amber-700 flex items-center gap-1"><Pizza className="h-3 w-3" /> Sabores (até 4):</div>
                            <div className="flex flex-wrap gap-1">
                              {prod.pizza_flavors.map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => {
                                    const cur = it.pizza_halves || [];
                                    const nx = cur.includes(f) ? cur.filter((x) => x !== f) : cur.length < 4 ? [...cur, f] : cur;
                                    updItem(i, { pizza_halves: nx });
                                  }}
                                  className={`text-xs px-2 py-0.5 rounded-full border ${(it.pizza_halves || []).includes(f) ? "bg-amber-100 border-amber-500" : "bg-white border-stone-200"}`}
                                >{f}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <Input placeholder="Observação deste item" value={it.notes} onChange={(e) => updItem(i, { notes: e.target.value })} />
                      </div>
                    );
                  })}
                  {newForm.items.length === 0 && <div className="text-xs text-stone-400 py-2">Nenhum item. Clique em "+ item"</div>}
                </div>
              </div>

              <div className="col-span-2"><Label>Observações gerais</Label>
                <Textarea rows={2} value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewForm(null)}>Cancelar</Button>
              <Button onClick={save} data-testid="encomenda-save" className="bg-amber-600 hover:bg-amber-700">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
