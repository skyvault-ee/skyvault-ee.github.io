// Illustrative sample only: the enquiry form never leaves the page.
// No fetch, no storage, no endpoint. Without JS all fields stay disabled.
(() => {
  'use strict';
  const form = document.querySelector('#demo-enquiry');
  if (!form) return;
  const status = form.querySelector('#demo-status');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const service = form.elements.service.selectedOptions[0].textContent;
    status.textContent = `Simulácia: v skutočnom webe by sa teraz odoslal dopyt na službu „${service}“. Nič sa neodoslalo, zadaný text ostáva len v tomto okne.`;
  });
  // Enable input only after the no-send handler is installed.
  form.querySelector('fieldset').disabled = false;
  button.disabled = false;
  document.querySelector('[data-nojs-note]').hidden = true;
})();
