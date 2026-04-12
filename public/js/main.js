document.addEventListener('DOMContentLoaded', () => {
    // ---- DARK MODE TOGGLE ----
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const root = document.documentElement;
    const body = document.body;

    function applyTheme(isDark) {
        if (isDark) {
            root.classList.add('dark');
            body.classList.add('bg-slate-900', 'text-slate-100');
            body.classList.remove('bg-gray-50', 'text-gray-900');
            localStorage.theme = 'dark';
        } else {
            root.classList.remove('dark');
            body.classList.remove('bg-slate-900', 'text-slate-100');
            body.classList.add('bg-gray-50', 'text-gray-900');
            localStorage.theme = 'light';
        }
    }

    // Init Theme
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isCurrentlyDark = root.classList.contains('dark');
            applyTheme(!isCurrentlyDark);
        });
    });

    // ---- MOBILE MENU ----
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const backdrop = document.getElementById('mobile-backdrop');
    const menuCloseBtn = document.getElementById('mobile-close');

    function toggleMenu(show) {
        if (!mobileMenu) return;
        if (show) {
            mobileMenu.classList.remove('translate-x-full');
            if (backdrop) backdrop.classList.remove('hidden', 'opacity-0');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('translate-x-full');
            if (backdrop) backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop && backdrop.classList.add('hidden'), 300);
            document.body.style.overflow = '';
        }
    }

    if (mobileBtn) mobileBtn.addEventListener('click', () => toggleMenu(true));
    if (menuCloseBtn) menuCloseBtn.addEventListener('click', () => toggleMenu(false));
    if (backdrop) backdrop.addEventListener('click', () => toggleMenu(false));

    // Sticky Header Effect
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('shadow-md');
                if(root.classList.contains('dark')){
                    header.classList.add('bg-slate-900/95');
                    header.classList.remove('bg-slate-900/80');
                } else {
                    header.classList.add('bg-white/95');
                    header.classList.remove('bg-white/80');
                }
            } else {
                header.classList.remove('shadow-md', 'bg-white/95', 'bg-slate-900/95');
                if(root.classList.contains('dark')){
                    header.classList.add('bg-slate-900/80');
                } else {
                    header.classList.add('bg-white/80');
                }
            }
        });
    }
});
