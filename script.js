'use strict';

const toggle = document.getElementById('menu-toggle');
const menu = document.getElementById('menu');

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open');
  });
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

const leadForm = document.getElementById('lead-form');
const feedback = document.getElementById('form-feedback');
const preparedBlock = document.getElementById('prepared-message');
const preview = document.getElementById('message-preview');
const copyButton = document.getElementById('copy-message');
const planSelect = document.getElementById('plan-select');

document.querySelectorAll('[data-interest]').forEach((link) => {
  link.addEventListener('click', () => {
    if (planSelect) planSelect.value = link.dataset.interest;
  });
});

if (leadForm && feedback && preparedBlock && preview) {
  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!leadForm.reportValidity()) return;

    const data = new FormData(leadForm);
    const name = String(data.get('nome') || '').trim();
    const phone = String(data.get('telefone') || '').trim();
    const email = String(data.get('email') || '').trim();
    const interest = String(data.get('plano') || '').trim();
    const details = String(data.get('mensagem') || '').trim();

    const subject = interest.includes('Ecoplan') || interest.includes('contábeis')
      ? 'Olá! Gostaria de informações sobre serviços contábeis e a parceria com a Ecoplan Contabilidade.'
      : 'Olá! Gostaria de contratar o Plano Essencial de escritório virtual em Porto Seguro por R$ 39,90/mês.';

    const message = [
      subject,
      '',
      'Nome: ' + name,
      'WhatsApp: ' + phone,
      'E-mail: ' + email,
      'Interesse: ' + interest,
      details ? 'Sobre a empresa: ' + details : null,
      '',
      'Estou ciente de que serviços contábeis são contratados à parte, mediante proposta.'
    ].filter((line) => line !== null).join('\n');

    preview.value = message;
    preparedBlock.hidden = false;
    feedback.textContent = 'Sua mensagem está pronta para copiar.';
    preparedBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

if (copyButton && preview) {
  copyButton.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(preview.value);
      } else {
        preview.focus();
        preview.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard indisponível');
      }
      copyButton.textContent = 'Mensagem copiada';
    } catch (error) {
      preview.focus();
      preview.select();
      copyButton.textContent = 'Selecione e copie o texto';
    }
  });
}
