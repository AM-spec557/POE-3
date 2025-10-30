// script.js — Dynamic content and search for Sparks & Wires services

// Service data (dynamic content)
const services = [
  {
    name: "Residential Electrical Wiring and Repairs",
    price: 1200,
    description: "Expert wiring, maintenance, and electrical fault repairs for homes.",
    image: "img/istockphoto-2172352979-612x612.jpg",
    alt: "Residential electrical wiring and repairs service"
  },
  {
    name: "Commercial Electrical Installations",
    price: 800,
    description: "Professional installation for offices, factories, and commercial buildings.",
    image: "img/istockphoto-2181524735-612x612.jpg",
    alt: "Commercial electrical installations by Sparks & Wires"
  },
  {
    name: "Emergency Call-Out Services",
    price: 150,
    description: "24/7 emergency electrical repairs with quick response time.",
    image: "img/istockphoto-951120494-612x612.jpg",
    alt: "Emergency call-out electrician service"
  },
  {
    name: "Lighting Design and Installation",
    price: 200,
    description: "Custom lighting plans and installations for homes and businesses.",
    image: "img/istockphoto-2188989392-612x612.jpg",
    alt: "Lighting design and installation"
  },
  {
    name: "Electrical Safety Inspections",
    price: 500,
    description: "Certified safety inspections to ensure full compliance and protection.",
    image: "img/istockphoto-183770082-612x612.jpg",
    alt: "Electrical safety inspection service"
  }
];

// DOM references
const servicesList = document.getElementById("servicesList");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");

// Render services
function displayServices(list) {
  servicesList.innerHTML = "";

  if (list.length === 0) {
    noResults.style.display = "block";
    return;
  } else {
    noResults.style.display = "none";
  }

  list.forEach(service => {
    const card = document.createElement("div");
    card.className = "service-card";

    card.innerHTML = `
      <img src="${service.image}" alt="${service.alt}">
      <h3>${service.name}</h3>
      <p>${service.description}</p>
      <p class="price">R${service.price}</p>
    `;

    servicesList.appendChild(card);
  });
}

// Filter services as user types
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = services.filter(service =>
    service.name.toLowerCase().includes(query)
  );
  displayServices(filtered);
});

// Initial display
displayServices(services);

// Client-side validation + AJAX form submission for enquiry.html

(() => {
  // ---------- CONFIG ----------
  // Replace this with your Formspree endpoint or other JSON endpoint.
  // Example Formspree endpoint: "https://formspree.io/f/xxxxxxx"
  const FORM_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID"; // <-- change this
  // If using your own API, ensure it accepts JSON and returns 2xx on success.
  // ---------- helpers ----------
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const phoneRx = /^[+]?[\d\s()-]{7,}$/;

  // Elements
  const form = $('#enquiryForm');
  const submitBtn = $('#submitBtn');
  const statusEl = $('#formStatus');

  if (!form) {
    console.error('Enquiry form not found (id=enquiryForm).');
    return;
  }

  // Validation rules
  const validators = {
    name: v => v.trim().length >= 2 || "Enter your full name (min 2 characters).",
    email: v => emailRx.test(v) || "Enter a valid email address.",
    phone: v => (!v.trim() || phoneRx.test(v)) || "Enter a valid phone number (or leave blank).",
    service: v => v.trim().length > 0 || "Please choose a service.",
    message: v => v.trim().length >= 10 || "Please describe your project (min 10 characters).",
    consent: v => v === true || "We need your consent to contact you."
  };

  // Utility: set/clear field error
  function setError(input, message) {
    const id = input.getAttribute('id');
    const err = $(`#err-${id}`) || input.closest('.form-field')?.querySelector('.error-msg');
    if (err) err.textContent = message || '';
    input.setAttribute('aria-invalid', !!message);
  }
  function clearError(input) { setError(input, ''); input.removeAttribute('aria-invalid'); }

  // Validate a single field element
  function validateField(el) {
    if (!el) return true;
    const name = el.name;
    if (!validators[name]) return true; // no validator - assume ok

    let value;
    if (el.type === 'checkbox') value = el.checked;
    else value = el.value;

    const ok = validators[name](value);
    if (ok === true) { clearError(el); return true; }
    setError(el, ok);
    return false;
  }

  // Hook up instant validation
  $$('input, textarea, select', form).forEach(el => {
    el.addEventListener('input', () => validateField(el));
    el.addEventListener('blur', () => validateField(el));
  });

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check (anti-bot)
    const hp = form.querySelector('input[name="hp"]');
    if (hp && hp.value) {
      console.warn('Honeypot filled — likely spam. Aborting.');
      return;
    }

    // Gather all submittable elements and validate
    const elements = Array.from(form.elements).filter(el => el.name && !el.disabled && el.type !== 'submit' && el.type !== 'button');
    let firstInvalid = null;
    let allValid = true;
    elements.forEach(el => {
      const ok = validateField(el);
      if (!ok && !firstInvalid) firstInvalid = el;
      allValid = allValid && ok;
    });

    if (!allValid) {
      // focus first invalid for accessibility
      if (firstInvalid) firstInvalid.focus();
      statusEl.textContent = 'Please correct the highlighted fields.';
      statusEl.style.color = 'var(--danger)';
      return;
    }

    // Build payload
    const formData = new FormData(form);
    // Optional: add extra metadata
    formData.append('source', 'website-enquiry');
    formData.append('page', location.pathname);

    // Convert to JSON
    const payload = {};
    formData.forEach((v,k) => {
      // for checkbox, keep it boolean
      if (k === 'consent') payload[k] = (v === 'on' || v === 'true' || v === true);
      else payload[k] = v;
    });

    // UI: sending
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    statusEl.textContent = 'Sending your enquiry…';
    statusEl.style.color = '#222';

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit'
      });

      if (!res.ok) {
        // attempt to read json error
        let errMsg = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          if (j && j.error) errMsg = j.error;
        } catch(_) {}
        throw new Error(errMsg);
      }

      // Success
      statusEl.textContent = 'Thanks — your enquiry has been sent. We will contact you shortly.';
      statusEl.style.color = 'green';
      form.reset();
      // clear any existing errors
      elements.forEach(clearError);

      // Optionally, track event or show analytics snippet here

    } catch (err) {
      console.error('Form submission error', err);
      statusEl.innerHTML = `Sorry — we couldn't send your enquiry. You can <a href="mailto:info@sparksandwires.co.za">email us directly</a> or try again.`;
      statusEl.style.color = 'var(--danger)';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Enquiry';
    }
  });

})();