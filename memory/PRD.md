# PRD — Sistema POS Assunção & Paladini

## Problema (pedido do usuário, literal)
Crie um sistema web para padaria e lanchonete com as seguintes funcionalidades:
1. Autenticação com dois perfis: operador de caixa e gerente.
2. Cardápio: cadastro de produtos com variações (ex: tamanhos, ingredientes - pizzas).
3. Pedidos e comanda: abertura de comanda por mesa/atendimento.
4. Caixa: fechamento de vendas (dinheiro, cartão, pix), resumo imprimível.
5. Fiado: controle do saldo devedor de clientes.
6. Encomendas: pedidos futuros.
7. Estoque: alerta de quantidade baixa.
Requisitos: 100% offline (instalação em PC local); customização de pizza (meio-a-meio).

## Perfis
- Gerente: Caixa, Comandas, Cardápio, Insumos, Produção, Revenda, Fiado, Encomendas, Dashboard, Usuários.
- Operador: Caixa, Comandas, Fiado, Encomendas.

## Arquitetura
- Backend: FastAPI + MongoDB; JWT custom + Bcrypt; PIN de 4 dígitos único; fuso America/Sao_Paulo.
- Frontend: React + Shadcn UI; Tailwind.
- Sem integrações de terceiros (requisito offline). Nome/logo: Assunção & Paladini — Padaria · Lanchonete · Pizzaria.

## Modelo de estoque (3 camadas)
- **Insumos**: matéria-prima (farinha, açúcar, ovo, mussarela). Entra por compra, sai por produção.
- **Revenda**: produtos prontos de prateleira (refri, bombom, leite). Baixa automática na venda.
- **Produção**: produtos feitos pela casa (pão, pizza congelada), com lote + data de produção + validade, FIFO.
  - "Produzir lote": consome insumos conforme a ficha técnica e entra no estoque de pronto.
  - Venda baixa do pronto (FIFO). Pizza meio-a-meio divide a baixa entre os sabores (1/N por meia).
  - Descartar: reduz lote + pronto.

## Ficha técnica no Cardápio
- Produto não-pizza: lista de insumos × quantidade por unidade.
- Pizza: `base_recipe` (massa/molho comuns) + `recipe_by_flavor` por sabor.
- Margem % individual por produto; **Custo**, **Preço sugerido** e **Margem real** exibidos.
- Aviso se preço de venda < custo.

## Implementado (2026-11-05 / 2026-11-06)
- Login senha/PIN, roles, PIN único.
- Cardápio com variações + pizza meio-a-meio (até 4 sabores).
- Comandas por mesa, status com transições controladas.
- Caixa: múltiplos pagamentos, troco só em dinheiro, cupom imprimível com o nome Assunção & Paladini.
- Fiado atômico com limite de crédito.
- Encomendas com data/hora, itens com variações/pizza (reusa ProductDialog), sinal validado.
- Estoque dividido em 3 abas: Revenda / Insumos / Produção.
- Lotes com validade, FIFO na venda, descarte, alertas de vencimento (≤3 dias).
- Cálculo de custo e preço sugerido por produto; margem individual.
- Cascade delete: remover produto remove prontos+lotes; remover item pronto remove lotes.
- Layout responsivo com Sheet mobile.
- 97/97 pytest + smoke frontend 100% (iteration_6).

## Backlog (P1/P2)
- P1: @media print no cupom para impressora térmica 80mm.
- P1: Impedir estoque negativo em saída manual (ou avisar).
- P2: Movimento manual em prontos deveria criar um lote implícito.
- P2: Shadcn Calendar na validade (hoje usa input[type=date] nativo).
- P2: KDS para comandas em produção.
- P2: Backup local em .json.
