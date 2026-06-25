/* Global JS: Language Switcher and Scroll Animations */

const setLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
    } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
    }
};

// Initial Load
const savedLang = localStorage.getItem('lang') || 'en';
setLanguage(savedLang);

// Reveal Animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
