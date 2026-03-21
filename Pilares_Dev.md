# Pilares do Desenvolvimento


## 1. Pilar do Cliente: O Cardápio e a Venda
O cardápio precisa ser à prova de erros, pois qualquer fricção aqui faz o cliente desistir e ligar para o concorrente.

Identidade Visual: O gradiente que estabilizamos agora deve ser injetado no cabeçalho do cardápio público para passar credibilidade.

Seleção de Itens: Implementar a lógica de "Meio a Meio" e "Adicionais" (Bordas/Ingredientes) com cálculo de preço automático.

Carrinho Inteligente: Validação de horário de funcionamento antes de permitir o fechamento do pedido.

### 1.1. O que deve ser feito para testar o início do pedido
Precisamos de um cardápio de teste para testar o cardápio público.
O usuário deve ser capaz de adicionar itens ao carrinho, fechar o pedido e receber uma confirmação no WhatsApp.

O usuário pode fazer um pedido sem login, mas deve informar o telefone para contato.

### 1.2. A Sacola de compras
Precisamos fazer a continuidade do processo. Quando o cliente faz o pedido, ele tem a sacola montada, agora ele precisa ver todos os produtos, confirmar que estão corretos e deve cadastrar o endereço.

Temos que criar um componente para mostrar os produtos da sacola e um componente para mostrar o formulário de entrega. Nesse ponto podemos perguntar o celular dele. Se já existir no nosso banco, podemos mostrar um banner para ele confirmar se está correto. Se não existir, podemos mostrar um formulário para ele cadastrar o celular.

Já poderemos calcular o valor do frete e mostrar o valor total do pedido. Além disso, o cliente deve escolher a forma de pagamento.

O cliente vai cadastrar um número de telefone de contato e informar o endereço de recebimento.
Nós já podemos guardar esses dados do cliente, para que ele não precise cadastrar novamente em um futuro próximo.



### 👀 Observações do Pilar 1
Pode ser necessário criar um ambiente do cliente em um futuro próximo, para ele ter opção de ver os pedidos realizados e o status de cada um.

## 2. Pilar do Pagamento: O Motor Financeiro
Já temos a estrutura de Strategy e Adapter, agora precisamos da execução.

Gateways Ativos: Configurar as chaves reais de PagBank (principal) e Stripe (redundância).

Geração de PIX: O sistema deve apresentar o "Copia e Cola" imediatamente após o clique em "Finalizar".

Webhook de Confirmação: O sistema deve "ouvir" o banco e mudar o status do pedido para paid sem intervenção humana.

## 3. Pilar da Cozinha: A Operação do Lojista
Onde a mágica acontece e o tempo é o maior inimigo.

Painel Real-Time: A Kitchen.jsx deve atualizar via Socket.io assim que o Webhook confirmar o pagamento.

Gestão de Status: O botão de "Iniciar Preparo" deve disparar um WhatsApp automático: "Sua pizza entrou no forno!".

## 4. Pilar da Entrega: A Logística Final
A comunicação com o entregador é o que diferencia o Calango Food de um cardápio estático.

Despacho Automatizado: Ao clicar em "Chamar Entregador", o sistema envia para o WhatsApp do entregador: Endereço do Cliente + Link do Google Maps + Valor a Receber (se for pagamento na entrega).

Aviso ao Cliente: Notificação simultânea no WhatsApp do cliente: "Seu pedido saiu! O entregador [Nome] já está a caminho".