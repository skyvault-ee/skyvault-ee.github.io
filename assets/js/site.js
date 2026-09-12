(() => {
  'use strict';

  const menus = [...document.querySelectorAll('.nav-disclosure')];
  for (const menu of menus) {
    menu.addEventListener('toggle', () => {
      if (menu.open) menus.filter(other => other !== menu).forEach(other => { other.open = false; });
    });
    menu.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      menu.open = false;
      if (link.hash && link.pathname === location.pathname) {
        const target = document.getElementById(link.hash.slice(1));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      }
    });
  }
  document.addEventListener('click', event => {
    menus.filter(menu => !menu.contains(event.target)).forEach(menu => { menu.open = false; });
  });
  document.addEventListener('focusin', event => {
    menus.filter(menu => !menu.contains(event.target)).forEach(menu => { menu.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    for (const menu of menus.filter(item => item.open)) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });

  function openLinkedProject() {
    if (!/^#portfolioModal\d+$/.test(location.hash)) return;
    const project = document.getElementById(location.hash.slice(1));
    if (project instanceof HTMLDetailsElement) project.open = true;
  }
  window.addEventListener('hashchange', openLinkedProject);
  openLinkedProject();

  const form = document.querySelector('#contactForm');
  if (!form) return;

  const status = form.querySelector('#success');
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('[data-submit-label]');
  const originalLabel = label.textContent;
  let sending = false;

  for (const field of form.querySelectorAll('[required]')) {
    field.addEventListener('invalid', () => {
      field.setAttribute('aria-invalid', 'true');
      field.setCustomValidity(field.dataset.error);
    });
    field.addEventListener('input', () => {
      field.removeAttribute('aria-invalid');
      field.setCustomValidity('');
    });
  }

  function showStatus(state, text) {
    status.dataset.state = state;
    status.textContent = text;
  }

  function failure(kind) {
    showStatus('error', `${form.dataset[`msg${kind}Lead`]} ${form.dataset[`msg${kind}Advice`]}`);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    if (!form.reportValidity()) return;

    sending = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    label.textContent = form.dataset.msgSending;
    status.textContent = '';
    delete status.dataset.state;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
        signal: controller.signal,
        credentials: 'omit',
      });
      const body = (await response.text()).trim();
      if (response.status === 400 && /no arguments provided/i.test(body)) {
        failure('Invalid');
        return;
      }
      if (!response.ok) throw new Error('Contact service unavailable');
      // The existing PHP endpoint returns an empty 200 on success. Keep its
      // contract, but never accept arbitrary error output as a successful send.
      if (body === '' || /^(success|ok|sent|true|1)$/i.test(body)) {
        showStatus('success', form.dataset.msgSuccess);
        form.reset();
      } else {
        failure(/no arguments provided/i.test(body) ? 'Invalid' : 'Fail');
      }
    } catch {
      failure('Offline');
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
      label.textContent = originalLabel;
    }
  });
})();
