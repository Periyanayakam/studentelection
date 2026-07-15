// Theme Toggle logic for Light and Dark Modes
document.addEventListener('DOMContentLoaded', () => {
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeToggleIcons(theme);
    };

    const updateThemeToggleIcons = (theme) => {
        const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
        toggleButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'bi bi-sun-fill';
                } else {
                    icon.className = 'bi bi-moon-fill';
                }
            }
        });
    };

    // Initialize theme
    const currentTheme = getPreferredTheme();
    setTheme(currentTheme);

    // Bind event listeners
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.theme-toggle-btn');
        if (btn) {
            const current = document.documentElement.getAttribute('data-bs-theme');
            const nextTheme = current === 'dark' ? 'light' : 'dark';
            setTheme(nextTheme);
        }
    });
});
