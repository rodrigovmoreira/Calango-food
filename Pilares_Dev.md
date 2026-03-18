# Pilares do Desenvolvimento


## 1. Pilar do Cliente: O Cardápio e a Venda
O cardápio precisa ser à prova de erros, pois qualquer fricção aqui faz o cliente desistir e ligar para o concorrente.

Identidade Visual: O gradiente que estabilizamos agora deve ser injetado no cabeçalho do cardápio público para passar credibilidade.

Seleção de Itens: Implementar a lógica de "Meio a Meio" e "Adicionais" (Bordas/Ingredientes) com cálculo de preço automático.

Carrinho Inteligente: Validação de horário de funcionamento antes de permitir o fechamento do pedido.

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