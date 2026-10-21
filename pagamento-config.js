/* Configuração pública do pagamento. Não inserir credenciais secretas neste arquivo. */
window.PORTO_BUSINESS_PAGAMENTO = Object.freeze({
  /* Webhook do n8n (Porto Business | 01 - Cadastro e checkout): grava o cadastro e cria a assinatura no Mercado Pago. */
  cadastroUrl: "https://ecoplan.app.n8n.cloud/webhook/porto-business-assinatura",
  /* Link fixo de reserva, usado só se o cadastro automático estiver fora do ar. */
  checkoutUrl: "https://mpago.la/2G9mj11",
  versaoContrato: "v1-2026-10"
});
