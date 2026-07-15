// Form Validation and Password UI Functions
document.addEventListener('DOMContentLoaded', () => {
    // 1. Bootstrap standard form validations
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // 2. Password Show/Hide Toggle
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.password-toggle-btn');
        if (toggleBtn) {
            const targetId = toggleBtn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = toggleBtn.querySelector('i');
            
            if (targetInput && icon) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.className = 'bi bi-eye-slash-fill';
                } else {
                    targetInput.type = 'password';
                    icon.className = 'bi bi-eye-fill';
                }
            }
        }
    });

    // 3. Password Strength Indicator
    const passwordInput = document.getElementById('register-password');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');

    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            let score = 0;
            
            if (val.length === 0) {
                strengthBar.className = 'password-strength-bar';
                if (strengthText) strengthText.textContent = '';
                return;
            }

            if (val.length >= 6) score++;
            if (val.length >= 10) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            strengthBar.className = 'password-strength-bar';
            if (score <= 2) {
                strengthBar.classList.add('strength-weak');
                if (strengthText) {
                    strengthText.textContent = 'Weak Password';
                    strengthText.className = 'text-danger small mt-1';
                }
            } else if (score <= 4) {
                strengthBar.classList.add('strength-medium');
                if (strengthText) {
                    strengthText.textContent = 'Medium Password';
                    strengthText.className = 'text-warning small mt-1';
                }
            } else {
                strengthBar.classList.add('strength-strong');
                if (strengthText) {
                    strengthText.textContent = 'Strong Password';
                    strengthText.className = 'text-success small mt-1';
                }
            }
        });
    }

    // 4. Confirm Password Match Check
    const confirmInput = document.getElementById('register-confirm-password');
    if (passwordInput && confirmInput) {
        const checkMatch = () => {
            if (passwordInput.value !== confirmInput.value) {
                confirmInput.setCustomValidity('Passwords do not match');
            } else {
                confirmInput.setCustomValidity('');
            }
        };
        passwordInput.addEventListener('input', checkMatch);
        confirmInput.addEventListener('input', checkMatch);
    }
});
