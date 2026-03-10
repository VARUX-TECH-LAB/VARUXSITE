document.documentElement.classList.remove('no-js');

const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const siteHeader = document.getElementById('siteHeader');
const titleEl = document.querySelector('title');
const metaDescriptionEl = document.querySelector('meta[name="description"]');
const ogTitleEl = document.querySelector('meta[property="og:title"]');
const ogDescriptionEl = document.querySelector('meta[property="og:description"]');
const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
const twitterDescriptionEl = document.querySelector('meta[name="twitter:description"]');
const languageButtons = document.querySelectorAll('.language-option');
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const formSubmitButton = contactForm?.querySelector('button[type="submit"]');
const STORAGE_KEY = 'varux_lang';

const defaultCopy = {};
document.querySelectorAll('[data-i18n]').forEach((node) => {
    defaultCopy[node.dataset.i18n] = node.textContent;
});

const defaultMeta = {
    title: document.title,
    description: metaDescriptionEl?.getAttribute('content') || '',
    ogTitle: ogTitleEl?.getAttribute('content') || document.title,
    ogDescription: ogDescriptionEl?.getAttribute('content') || metaDescriptionEl?.getAttribute('content') || '',
    twitterTitle: twitterTitleEl?.getAttribute('content') || document.title,
    twitterDescription: twitterDescriptionEl?.getAttribute('content') || metaDescriptionEl?.getAttribute('content') || ''
};

const translations = window.pageTranslations || {};

function setFormStatus(state, message = '') {
    if (!formStatus) return;
    formStatus.className = 'form-status';
    if (state) formStatus.classList.add(`is-${state}`);
    formStatus.textContent = message;
}

function closeMenu() {
    if (!menuBtn || !mobileNav) return;
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
}

function openMenu() {
    if (!menuBtn || !mobileNav) return;
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
}

if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
        const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeMenu());
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });
}

function setLanguage(lang) {
    const activeLang = translations[lang] ? lang : 'en';
    const dictionary = translations[activeLang] || {};

    document.documentElement.lang = activeLang;

    languageButtons.forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.lang === activeLang ? 'true' : 'false');
    });

    document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.dataset.i18n;
        node.textContent = Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : defaultCopy[key];
    });

    document.title = dictionary.metaTitle || defaultMeta.title;
    metaDescriptionEl?.setAttribute('content', dictionary.metaDescription || defaultMeta.description);
    ogTitleEl?.setAttribute('content', dictionary.ogTitle || dictionary.metaTitle || defaultMeta.ogTitle);
    ogDescriptionEl?.setAttribute('content', dictionary.ogDescription || dictionary.metaDescription || defaultMeta.ogDescription);
    twitterTitleEl?.setAttribute('content', dictionary.twitterTitle || dictionary.metaTitle || defaultMeta.twitterTitle);
    twitterDescriptionEl?.setAttribute('content', dictionary.twitterDescription || dictionary.metaDescription || defaultMeta.twitterDescription);

    try {
        localStorage.setItem(STORAGE_KEY, activeLang);
    } catch (error) {
        void error;
    }
}

languageButtons.forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang || 'en'));
});

window.addEventListener('scroll', () => {
    siteHeader?.classList.toggle('scrolled', window.scrollY > 18);
}, { passive: true });

const revealNodes = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

revealNodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent) return;
    const revealSiblings = Array.from(parent.children).filter((child) => child.classList.contains('reveal'));
    const siblingIndex = Math.max(revealSiblings.indexOf(node), 0);
    node.style.setProperty('--reveal-delay', `${Math.min(siblingIndex * 36, 108)}ms`);
});

if (!prefersReducedMotion) {
    const root = document.documentElement;
    let currentX = 50;
    let currentY = 18;
    let targetX = 50;
    let targetY = 18;
    let pointerFrame = null;

    const renderAmbientPointer = () => {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        root.style.setProperty('--pointer-x', `${currentX.toFixed(2)}%`);
        root.style.setProperty('--pointer-y', `${currentY.toFixed(2)}%`);

        const delta = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
        if (delta > 0.08) {
            pointerFrame = window.requestAnimationFrame(renderAmbientPointer);
        } else {
            pointerFrame = null;
        }
    };

    window.addEventListener('pointermove', (event) => {
        targetX = (event.clientX / window.innerWidth) * 100;
        targetY = (event.clientY / window.innerHeight) * 100;
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderAmbientPointer);
    }, { passive: true });

    window.addEventListener('mouseout', (event) => {
        if (event.relatedTarget) return;
        targetX = 50;
        targetY = 18;
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderAmbientPointer);
    });
}

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealNodes.forEach((node) => node.classList.add('is-visible'));
} else {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -12px 0px' });

    revealNodes.forEach((node) => observer.observe(node));
}

if (contactForm) {
    const defaultButtonLabel = formSubmitButton?.textContent || 'Submit Request';

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!contactForm.reportValidity()) return;

        const endpoint = contactForm.getAttribute('action');
        if (!endpoint) return;

        setFormStatus('', '');
        contactForm.setAttribute('aria-busy', 'true');
        if (formSubmitButton) {
            formSubmitButton.disabled = true;
            formSubmitButton.textContent = 'Sending...';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) throw new Error('Form submission failed');

            contactForm.reset();
            setFormStatus('success', 'Request received. We will follow up by email.');
        } catch (error) {
            void error;
            setFormStatus('error', 'Submission failed. Please email contact@varuxcyber.com.');
        } finally {
            contactForm.removeAttribute('aria-busy');
            if (formSubmitButton) {
                formSubmitButton.disabled = false;
                formSubmitButton.textContent = defaultButtonLabel;
            }
        }
    });
}

let savedLanguage = 'en';
try {
    savedLanguage = localStorage.getItem(STORAGE_KEY) || 'en';
} catch (error) {
    void error;
}

setLanguage(savedLanguage);
