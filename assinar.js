'use strict';

(function () {
  const config = window.PORTO_BUSINESS_PAGAMENTO || {};
  const form = document.getElementById('signup-form');
  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('submit-btn');
  const fallback = document.getElementById('fallback');
  const fallbackLink = document.getElementById('fallback-link');
  const docInput = document.getElementById('documento');
  const docLabel = document.getElementById('doc-label');
  const empresaInput = document.getElementById('empresa');
  const empresaLabel = document.getElementById('empresa-label');
  const cepInput = document.getElementById('cep');
  if (!form) return;

  const MP_HOSTS = ['mpago.la', 'www.mpago.la', 'www.mercadopago.com.br', 'mercadopago.com.br', 'www.mercadopago.com', 'mercadopago.com'];
  const digits = (v) => String(v || '').replace(/\D/g, '');

  function safeCheckoutUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && MP_HOSTS.includes(u.hostname) ? u.href : '';
    } catch (error) {
      return '';
    }
  }

  function cpfOk(c) {
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    let t = 0;
    for (let i = 0; i < 9; i++) t += Number(c[i]) * (10 - i);
    let d = (t * 10) % 11 % 10;
    if (d !== Number(c[9])) return false;
    t = 0;
    for (let i = 0; i < 10; i++) t += Number(c[i]) * (11 - i);
    d = (t * 10) % 11 % 10;
    return d === Number(c[10]);
  }

  function cnpjOk(c) {
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (n) => {
      const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let t = 0;
      for (let i = 0; i < n; i++) t += Number(c[i]) * w[i];
      const r = t % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
  }

  function tipoPessoa() {
    const checked = form.querySelector('input[name="tipo_pessoa"]:checked');
    return checked ? checked.value : 'PF';
  }

  function updatePersonFields() {
    const pj = tipoPessoa() === 'PJ';
    docLabel.textContent = pj ? 'CNPJ' : 'CPF';
    docInput.placeholder = pj ? '00.000.000/0000-00' : '000.000.000-00';
    empresaLabel.innerHTML = pj ? 'Razão social <span>*</span>' : 'Nome pretendido da empresa <span class="optional">(opcional)</span>';
    empresaInput.required = pj;
  }

  form.querySelectorAll('input[name="tipo_pessoa"]').forEach((input) => input.addEventListener('change', updatePersonFields));
  updatePersonFields();

  cepInput.addEventListener('blur', async () => {
    const cep = digits(cepInput.value);
    if (cep.length !== 8) return;
    try {
      const response = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
      const data = await response.json();
      if (data.erro) return;
      const fill = (id, value) => {
        const el = document.getElementById(id);
        if (el && !el.value && value) el.value = value;
      };
      fill('logradouro', data.logradouro);
      fill('bairro', data.bairro);
      fill('cidade', data.localidade);
      fill('uf', data.uf);
    } catch (error) {
      /* Preenchimento automático é só uma conveniência. */
    }
  });

  function showFallback() {
    const url = safeCheckoutUrl(config.checkoutUrl);
    if (!url) return;
    fallbackLink.href = url;
    fallback.hidden = false;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.classList.remove('form-error');
    fallback.hidden = true;

    if (!form.reportValidity()) return;
    const doc = digits(docInput.value);
    const pj = tipoPessoa() === 'PJ';
    if (pj ? !cnpjOk(doc) : !cpfOk(doc)) {
      feedback.textContent = pj ? 'Confira o CNPJ informado.' : 'Confira o CPF informado.';
      feedback.classList.add('form-error');
      docInput.focus();
      return;
    }
    if (!config.cadastroUrl) {
      showFallback();
      return;
    }

    const body = new URLSearchParams(new FormData(form));
    body.set('versao_contrato', config.versaoContrato || '');
    submitBtn.disabled = true;
    feedback.textContent = 'Registrando seu cadastro...';

    try {
      const response = await fetch(config.cadastroUrl, { method: 'POST', body: body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        feedback.textContent = data.erro || 'Não foi possível registrar o cadastro. Tente novamente.';
        feedback.classList.add('form-error');
        if (!data.erro) showFallback();
        submitBtn.disabled = false;
        return;
      }
      const url = safeCheckoutUrl(data.checkoutUrl);
      if (!url) {
        feedback.textContent = 'Cadastro registrado (pedido ' + data.pedido + '), mas o link de pagamento não pôde ser aberto.';
        showFallback();
        submitBtn.disabled = false;
        return;
      }
      try { sessionStorage.setItem('pb_pedido', String(data.pedido || '')); } catch (error) { /* opcional */ }
      feedback.textContent = data.modo === 'link_fixo'
        ? 'Cadastro registrado (pedido ' + data.pedido + '). Use no Mercado Pago o mesmo e-mail informado. Abrindo o pagamento...'
        : 'Cadastro registrado (pedido ' + data.pedido + '). Abrindo o pagamento seguro...';
      window.location.href = url;
    } catch (error) {
      feedback.textContent = 'Sem conexão com o cadastro automático.';
      feedback.classList.add('form-error');
      showFallback();
      submitBtn.disabled = false;
    }
  });
})();
