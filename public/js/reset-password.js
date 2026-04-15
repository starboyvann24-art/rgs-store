/**
 * RGS STORE — Reset Password Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const loading = document.getElementById('reset-loading');
    const formContainer = document.getElementById('reset-form-container');
    const errorContainer = document.getElementById('reset-error');
    const errorMsg = document.getElementById('error-msg');

    if (!token) {
        loading.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        errorMsg.textContent = 'Token reset tidak ditemukan di URL.';
        return;
    }

    // Token exists, assume valid until submit fail or we could add a verify endpoint
    // For now, let's just show the form
    setTimeout(() => {
        loading.classList.add('hidden');
        formContainer.classList.remove('hidden');
    }, 1000);

    const form = document.getElementById('form-reset');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pass = document.getElementById('new_password').value;
        const confirm = document.getElementById('confirm_password').value;
        const btn = document.getElementById('btn-reset');

        if (pass !== confirm) {
            store.showToast('Konfirmasi password tidak cocok.', 'error');
            return;
        }

        if (pass.length < 6) {
            store.showToast('Password minimal 6 karakter.', 'error');
            return;
        }

        try {
            store.setLoading(btn, true, 'Memproses...');
            const res = await store.resetPassword(token, pass);

            if (res.success) {
                store.showToast(res.message, 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                store.showToast(res.message || 'Gagal reset password.', 'error');
                store.setLoading(btn, false);
            }
        } catch (err) {
            console.error('Reset password error:', err);
            store.showToast('Terjadi kesalahan koneksi.', 'error');
            store.setLoading(btn, false);
        }
    });
});
