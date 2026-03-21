# Pilares do Desenvolvimento — Calango Food

> **Convenção**: `[x]` = Implementado · `[/]` = Parcialmente feito · `[ ]` = Pendente

---

## Mapa de Dependências entre Pilares

```
┌──────────────────────────────────────────────────────────────────┐
│                  PILAR 0 — GESTÃO DO CARDÁPIO (Base)             │
│  Cadastro de Categorias · Cadastro de Produtos · Configuração    │
│  da Loja · Identidade Visual · Horários de Funcionamento         │
└───────────────────────────┬──────────────────────────────────────┘
                            │ alimenta
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│             PILAR 1 — O CLIENTE: Cardápio e Venda                │
│  Cardápio público → Seleção → Sacola → Checkout → Pedido criado  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ gera pedido com status "pending"
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│             PILAR 2 — PAGAMENTO: Motor Financeiro                │
│  Gateway PIX/Card → Webhook confirma → status = "paid"           │
└───────────────────────────┬──────────────────────────────────────┘
                            │ dispara evento "paid"
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│             PILAR 3 — COZINHA: Operação do Lojista               │
│  Painel real-time → Preparo → WhatsApp pro cliente               │
└───────────────────────────┬──────────────────────────────────────┘
                            │ status = "ready"
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│             PILAR 4 — ENTREGA: Logística Final                   │
│  Despacho → WhatsApp entregador + cliente → Concluído            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Pilar 0 — Gestão do Cardápio (Alicerce)

> Tudo começa aqui. Se o restaurante não consegue cadastrar seu cardápio de forma fácil e flexível, nenhum pilar funciona. Este pilar existe "por baixo" dos demais e deve estar sólido antes de avançar.

### 0.1. Cadastro e Gestão de Categorias
- [x] Model `Category` com `tenantId`, `name`, `order`
- [x] CRUD de categorias na `Categories.jsx` (admin)
- [x] Reordenação de categorias pelo lojista (drag & order)
- [x] Rota pública `getPublicCategories` para alimentar o cardápio

### 0.2. Cadastro e Gestão de Produtos
- [x] Model `Product` com `attributeGroups` (variações, adicionais, pricing strategy)
- [x] CRUD de produtos na `Products.jsx` (admin)
- [x] Formulário completo: nome, descrição, preço, categoria, imagem, disponibilidade
- [x] Grupos de atributos com `SUM`, `HIGHEST`, `AVERAGE` (estratégia de preço)
- [ ] Upload real de imagem de produto (hoje `imageUrl` é string manual)
- [ ] Preview do produto como o cliente verá (miniatura do card público no admin)

### 0.3. Configuração da Loja
- [x] Cadastro do nome da loja e geração automática do slug
- [x] Horários de funcionamento por dia da semana (abertura/fechamento)
- [x] Pausa de emergência (switch abrir/fechar loja manualmente)
- [x] Integração WhatsApp (QR Code na `Settings.jsx`)
- [ ] **Identidade Visual**: Logo do restaurante (upload)
- [ ] **Identidade Visual**: Cor primária do cabeçalho (personalizável)
- [ ] **Identidade Visual**: Cor de fundo do cardápio (personalizável)
- [ ] Salvar cores/logo no `SystemUser` (campo `branding`) no banco com `tenantId`

### 0.4. Seed e Dados de Teste
- [x] Script `seedProducts.js` para popular produtos de exemplo
- [ ] Criar seed mais robusto com categorias, variações e um restaurante completo para testes end-to-end

---

## Pilar 1 — O Cliente: Cardápio e Venda

> O cardápio precisa ser à prova de erros. Qualquer fricção faz o cliente desistir e ligar pro concorrente. Este é o pilar que estamos **lapidando agora**.

### 1.1. Cardápio Público (`MenuPages.jsx`)
- [x] Rota pública `/cardapio/:slug` carrega loja + produtos
- [x] Validação de horário de funcionamento em tempo real (`isStoreOpen`)
- [x] Agrupamento por categoria respeitando a ordem definida pelo lojista
- [x] Cards de produto com imagem, descrição, preço e botão "Adicionar"
- [x] Bloqueio de interação quando a loja está fechada
- [x] Header dinâmico com nome do restaurante, logo e indicador aberto/fechado
- [ ] Aplicar cores do branding do tenant (cabeçalho, botões) — depende de 0.3
- [ ] Barra de busca / filtro por nome de produto
- [ ] Navegação por categorias (âncoras ou abas laterais em scroll)

### 1.2. Seleção de Itens (`ProductModal.jsx`)
- [x] Modal lateral com imagem, nome, descrição e preço base
- [x] Renderização dinâmica de `attributeGroups` com opções
- [x] Suporte a seleção única (radio-like) e múltipla (stepper +/-)
- [x] Cálculo em tempo real do preço com `SUM`, `HIGHEST`, `AVERAGE`
- [x] Validação de `minOptions` / `maxOptions` por grupo
- [x] Controle de quantidade do item
- [x] Botão "Adicionar" com preço total calculado
- [ ] Exibir observação / nota do cliente (campo de texto livre, ex: "sem cebola")

### 1.3. Sacola de Compras (`CartDrawer.jsx`) ← **FOCO ATUAL**
- [x] Drawer lateral com lista de itens do carrinho
- [x] Remoção individual de itens
- [x] Formulário básico: nome, WhatsApp, endereço
- [x] Validação de dados antes do envio
- [x] Verificação de loja aberta antes de finalizar
- [x] Cálculo do total do pedido
- [ ] **Edição de quantidade** de cada item no carrinho (hoje é 1 por clique)
- [ ] **Exibir customizações** de cada item na sacola (adicionais, sabores escolhidos)
- [ ] **Separar Sacola do Checkout**: A sacola deve ser uma etapa de revisão. Ao confirmar, avançar para o fluxo de checkout (etapas abaixo ↓)

### 1.4. Fluxo de Checkout (Novo — pós-sacola)
> Hoje o `CartDrawer` faz tudo em uma tela só. Precisamos separar em etapas claras para uma experiência guiada.

- [ ] **Etapa 1 — Identificação**: Perguntar o celular. Se já existir no banco, exibir banner confirmando "Você é o João? Confirme seu endereço". Se não existir, formulário de cadastro rápido (nome + celular).
- [ ] **Etapa 2 — Endereço de Entrega**: Formulário de endereço completo (rua, número, bairro, complemento, referência). Opção "Retirada no Balcão" (sem endereço, sem frete).
- [ ] **Etapa 3 — Frete**: Calcular valor do frete baseado no endereço. Mostrar resumo: subtotal dos produtos + frete = total final.
- [ ] **Etapa 4 — Forma de Pagamento**: Opções: PIX, Cartão, Dinheiro na entrega. Cada uma leva a tratamento diferente (Pilar 2). Se "Dinheiro", perguntar "Precisa de troco pra quanto?".
- [ ] **Etapa 5 — Confirmação**: Resumo visual completo do pedido (itens + customizações + endereço + frete + pagamento). Botão "Finalizar Pedido" → cria o Order no backend.
- [ ] **Modelo de Cliente** no banco (`Customer`): telefone, nome, endereços salvos, histórico de pedidos. Permitir reutilização em pedidos futuros.

### 1.5. Pós-Pedido (Confirmação)
- [ ] Tela de acompanhamento do pedido (status em tempo real via polling ou Socket.io)
- [ ] Notificação WhatsApp automática de confirmação para o cliente
- [ ] Eliminar o `window.location.reload()` — usar estado controlado para resetar o carrinho

### 👀 Observações do Pilar 1
- No futuro, criar um "Ambiente do Cliente" (mini-painel) para ele ver pedidos anteriores, repetir pedidos, e gerenciar endereços.
- Considerar login social (Google) como alternativa ao telefone para identificação.

---

## Pilar 2 — Pagamento: O Motor Financeiro

> Já temos a estrutura de Strategy e Adapter. Agora precisamos da execução real confiável. **Só deve ser ativado quando o Pilar 1 estiver entregando pedidos de ponta a ponta.**

### 2.1. Infraestrutura (já existente)
- [x] `PaymentFactory` com pattern Strategy
- [x] `PixStrategy`, `PagBankStrategy`, `StripeStrategy` (scaffolds)
- [x] `WebhookAdapter` para adaptar retornos dos gateways
- [x] Model `Order.payment` com `method`, `status`, `transactionId`, `gatewayProvider`, `failureMessage`
- [/] Cálculo anti-fraude no `OrderController` (valida preços no backend) — funciona mas tem bug no `method` (variável indefinida na linha 168)

### 2.2. Gateway PIX (Prioridade)
- [ ] Configurar chaves reais do PagBank (sandbox primeiro, depois produção)
- [ ] Implementar `PixStrategy.process()` para gerar QR Code / Copia-e-Cola
- [ ] Frontend: Tela de "Escaneie o PIX" com QR Code e texto copiável
- [ ] Frontend: Timer de expiração do PIX (ex: 15 minutos)
- [ ] Frontend: Polling de status do pagamento (ou WebSocket)

### 2.3. Webhook de Confirmação
- [ ] Rota `POST /webhook/pagbank` para receber confirmação
- [ ] `WebhookController` valida assinatura do PagBank e atualiza `Order.payment.status = 'paid'`
- [ ] Acionar notificação automática (WhatsApp + atualizar Kitchen em tempo real)

### 2.4. Gateway de Cartão (Redundância)
- [ ] Configurar Stripe como gateway secundário
- [ ] Tokenização segura (Stripe Elements ou PagBank Checkout Transparente)
- [ ] Lógica de fallback: se PagBank falhar, tentar Stripe

### 2.5. Pagamento na Entrega
- [ ] Opção "Dinheiro" que não gera transação digital
- [ ] Status do pedido vai direto para "preparing" (sem aguardar webhook)
- [ ] Campo "Troco para" no Order e exibido no pedido da Cozinha

---

## Pilar 3 — Cozinha: A Operação do Lojista

> Onde a mágica acontece e o tempo é o maior inimigo.

### 3.1. Painel da Cozinha (`Kitchen.jsx`)
- [x] Listagem de pedidos com status `preparing`
- [x] Exibição de endereço, itens, quantidades
- [x] Indicador de entregadores disponíveis
- [x] Botão "Chamar Entregador" que faz dispatch
- [ ] **Real-Time com Socket.io**: Atualizar automaticamente quando novos pedidos entrarem (hoje é fetch único)
- [ ] **Gestão de Status granular**: Botão "Aceitar Pedido" (pending → preparing) e "Pronto para Entrega" (preparing → ready)
- [ ] **Notificação WhatsApp ao cliente** quando status muda: "Sua pizza entrou no forno!", "Seu pedido está pronto!"
- [ ] Timer visual de preparo por pedido (tempo desde que entrou na cozinha)
- [ ] Agrupamento visual: pedidos novos vs. em preparo vs. prontos (Kanban)

### 3.2. Impressão de Comanda
- [ ] Gerar comanda simplificada para impressora térmica (ESC/POS)
- [ ] Alternativa: botão "Imprimir" que abre versão para impressão no navegador

---

## Pilar 4 — Entrega: A Logística Final

> A comunicação com o entregador é o que diferencia o Calango Food de um cardápio estático.

### 4.1. Cadastro de Entregadores (`Entregadores.jsx`)
- [x] Model `DeliveryDriver` com nome, WhatsApp, status, prioridade
- [x] CRUD de entregadores no admin
- [x] Status: disponível / ocupado / offline
- [ ] Login simples do entregador (WhatsApp como ID) para ele mudar o próprio status

### 4.2. Despacho Automatizado
- [x] Botão "Chamar Entregador" na Kitchen que seleciona entregador disponível
- [/] `DeliveryController` com lógica de despacho
- [ ] Mensagem WhatsApp automática para o entregador: Endereço + Link Google Maps + Valor (se pagamento na entrega)
- [ ] Rotação de entregadores por prioridade (round-robin)

### 4.3. Comunicação com o Cliente
- [ ] WhatsApp automático: "Seu pedido saiu! O entregador [Nome] já está a caminho."
- [ ] Link de rastreamento simples (status do pedido em tempo real)

### 4.4. Conclusão da Entrega
- [ ] Entregador confirma entrega pelo WhatsApp (mensagem ou botão)
- [ ] Status do pedido muda para `delivered`
- [ ] Atualizar `deliveriesToday` do entregador