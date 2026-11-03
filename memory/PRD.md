# PRD — Sistema POS Padaria & Lanchonete "Tradição"

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
- Gerente: acesso total (Cardápio, Estoque, Dashboard, Usuários, Caixa, Comandas, Fiado, Encomendas).
- Operador: Caixa, Comandas, Fiado, Encomendas.

## Arquitetura
- Backend: FastAPI + MongoDB; JWT custom + Bcrypt; PIN de 4 dígitos único por usuário; fuso America/Sao_Paulo.
- Frontend: React + Shadcn UI; Tailwind; sem dependências externas de nuvem.
- Sem integrações de terceiros (requisito offline).

## Implementado (2026-11-03)
- Login senha/PIN, roles; placeholder genérico.
- Cardápio com variações (single/multi) e pizza meio-a-meio (até 4 sabores validados).
- Comandas por mesa; adição/remoção de itens; status controlado (`aberta → em_producao → pronta → aguardando_pagamento → fechada/cancelada`).
- Caixa: múltiplos pagamentos (dinheiro, cartão, pix, fiado), cálculo de troco só em dinheiro, cupom imprimível, validações de limite de crédito e fiado atômico.
- Fiado: cadastro de clientes, histórico de vendas/pagamentos, baixa parcial.
- Encomendas: data/hora futura, itens com variações/pizza reutilizando o ProductDialog, sinal validado contra o total, status completo.
- Estoque: entradas/saídas/ajustes, alerta de baixo estoque com badge atualizado via evento.
- Dashboard: faturamento do dia (com troco subtraído), por forma de pagamento, top produtos, fiado total, encomendas de hoje, tendência 7 dias.
- Validações Pydantic (gt=0/ge=0), regex escapado, JWT_SECRET via env, 422 convertido em toast legível.
- Layout responsivo com Sheet mobile e CheckoutDialog scrollável em telas pequenas.
- Testes: 53/53 pytest; 4 iterações do testing_agent 100% verde.

## Backlog (P1/P2)
- P1: @media print no cupom para impressão térmica 80mm.
- P1: Impedir saída de estoque que deixe quantidade negativa (ou avisar).
- P2: Reposição automática sugerida com base no mínimo.
- P2: Modo kitchen display (KDS) para comandas em produção.
- P2: Importação/exportação de backup local (.json).
