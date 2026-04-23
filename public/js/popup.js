// ============================================================
// RGS STORE — Premium Store Popup v1.0
// Self-contained: CSS injected, HTML injected, logic self-managed
// Shows once per day (localStorage based)
// ============================================================

(function () {
    'use strict';

    const POPUP_KEY = 'rgs_popup_dismissed';
    const today = new Date().toDateString();

    // Don't re-show if already dismissed today
    if (localStorage.getItem(POPUP_KEY) === today) return;
    // Don't show on admin page
    if (window.location.pathname.includes('admin')) return;

    // ── Inject CSS ───────────────────────────────────────────
    const style = document.createElement('style');
    style.id = 'rgs-popup-styles';
    style.textContent = `
        #rgs-popup-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.88);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            opacity: 0;
            transition: opacity 0.45s ease;
        }
        #rgs-popup-overlay.rgs-visible {
            opacity: 1;
        }
        #rgs-popup-card {
            background: #ffffff;
            border-radius: 28px;
            width: 100%;
            max-width: 500px;
            overflow: hidden;
            box-shadow: 0 30px 100px rgba(0,0,0,0.6), 0 0 80px rgba(255,122,0,0.25);
            transform: translateY(50px) scale(0.92);
            transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #rgs-popup-overlay.rgs-visible #rgs-popup-card {
            transform: translateY(0) scale(1);
        }

        /* ── Header ── */
        .rgs-popup-header {
            background: linear-gradient(135deg, #ff7a00 0%, #e05000 50%, #1a1a1a 100%);
            padding: 1.5rem 1.75rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            overflow: hidden;
        }
        .rgs-popup-header::before {
            content: '';
            position: absolute;
            width: 250px; height: 250px;
            background: rgba(255,255,255,0.06);
            border-radius: 50%;
            top: -120px; right: -80px;
        }
        .rgs-popup-header::after {
            content: '';
            position: absolute;
            width: 150px; height: 150px;
            background: rgba(255,255,255,0.04);
            border-radius: 50%;
            bottom: -80px; left: 30px;
        }
        .rgs-popup-brand {
            font-size: 1.75rem;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: -1.5px;
            line-height: 1;
            position: relative;
            z-index: 1;
        }
        .rgs-popup-brand span { color: rgba(255,255,255,0.65); }
        .rgs-popup-tag {
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.25);
            color: #ffffff;
            font-size: 0.62rem;
            font-weight: 800;
            padding: 4px 12px;
            border-radius: 999px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 6px;
            display: inline-block;
            position: relative;
            z-index: 1;
        }
        .rgs-popup-close {
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.25);
            color: #ffffff;
            width: 34px; height: 34px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, transform 0.2s;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }
        .rgs-popup-close:hover { background: rgba(255,255,255,0.35); transform: scale(1.1); }

        /* ── Body ── */
        .rgs-popup-body { padding: 2rem 1.75rem 1.5rem; }
        .rgs-popup-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, rgba(255,122,0,0.12), rgba(255,122,0,0.05));
            border: 1px solid rgba(255,122,0,0.35);
            color: #ff7a00;
            font-size: 0.7rem;
            font-weight: 800;
            padding: 5px 14px;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 1.1rem;
        }
        .rgs-popup-title {
            font-size: 1.9rem;
            font-weight: 900;
            color: #1a1a1a;
            line-height: 1.15;
            margin-bottom: 0.75rem;
            letter-spacing: -1.5px;
        }
        .rgs-popup-title .rgs-accent { color: #ff7a00; }
        .rgs-popup-subtitle {
            font-size: 0.88rem;
            color: #64748b;
            margin-bottom: 1.5rem;
            line-height: 1.65;
            font-weight: 500;
        }

        /* ── Feature Grid ── */
        .rgs-popup-features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 1.75rem;
        }
        .rgs-popup-feat {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            gap: 9px;
            font-size: 0.82rem;
            font-weight: 700;
            color: #1a1a1a;
            transition: border-color 0.2s, background 0.2s;
        }
        .rgs-popup-feat:hover { border-color: rgba(255,122,0,0.4); background: #fff8f0; }
        .rgs-popup-feat-icon { font-size: 1.15rem; }

        /* ── CTA Buttons ── */
        .rgs-popup-cta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 1.25rem;
        }
        .rgs-popup-btn-discord, .rgs-popup-btn-shop {
            padding: 13px 16px;
            border-radius: 14px;
            font-weight: 800;
            font-size: 0.85rem;
            text-decoration: none;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .rgs-popup-btn-discord {
            background: #5865F2;
            color: white;
        }
        .rgs-popup-btn-discord:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(88,101,242,0.45);
            color: white;
        }
        .rgs-popup-btn-shop {
            background: linear-gradient(135deg, #ff7a00, #ff9a44);
            color: white;
        }
        .rgs-popup-btn-shop:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255,122,0,0.45);
            color: white;
        }

        /* ── Footer ── */
        .rgs-popup-footer {
            padding: 1rem 1.75rem 1.5rem;
            border-top: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .rgs-popup-footer label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.78rem;
            color: #94a3b8;
            cursor: pointer;
            font-weight: 600;
            user-select: none;
        }
        .rgs-popup-footer input[type="checkbox"] {
            accent-color: #ff7a00;
            width: 14px; height: 14px;
            cursor: pointer;
        }

        /* ── Ticker / Stats Row ── */
        .rgs-popup-stats {
            display: flex;
            gap: 0;
            background: #1a1a1a;
            border-top: 1px solid #2d2d2d;
        }
        .rgs-popup-stat {
            flex: 1;
            padding: 0.875rem 0.5rem;
            text-align: center;
            border-right: 1px solid #2d2d2d;
        }
        .rgs-popup-stat:last-child { border-right: none; }
        .rgs-popup-stat-val {
            font-size: 1.1rem;
            font-weight: 900;
            color: #ff7a00;
            display: block;
            letter-spacing: -0.5px;
        }
        .rgs-popup-stat-lbl {
            font-size: 0.6rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        /* ── Mobile ── */
        @media (max-width: 520px) {
            #rgs-popup-card { border-radius: 22px; }
            .rgs-popup-title { font-size: 1.55rem; }
            .rgs-popup-cta { grid-template-columns: 1fr; }
            .rgs-popup-features { grid-template-columns: 1fr 1fr; }
        }
    `;
    document.head.appendChild(style);

    // ── Inject HTML ──────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'rgs-popup-overlay';
    overlay.innerHTML = `
        <div id="rgs-popup-card">
            <div class="rgs-popup-header">
                <div>
                    <div class="rgs-popup-brand">RGS <span>STORE</span></div>
                    <div class="rgs-popup-tag">✦ Premium Digital Marketplace</div>
                </div>
                <button class="rgs-popup-close" id="rgs-popup-close-btn" aria-label="Tutup">✕</button>
            </div>

            <div class="rgs-popup-stats">
                <div class="rgs-popup-stat">
                    <span class="rgs-popup-stat-val">500+</span>
                    <span class="rgs-popup-stat-lbl">Transaksi</span>
                </div>
                <div class="rgs-popup-stat">
                    <span class="rgs-popup-stat-val">4.9★</span>
                    <span class="rgs-popup-stat-lbl">Rating</span>
                </div>
                <div class="rgs-popup-stat">
                    <span class="rgs-popup-stat-val">1×24 Jam</span>
                    <span class="rgs-popup-stat-lbl">Garansi</span>
                </div>
            </div>

            <div class="rgs-popup-body">
                <div class="rgs-popup-badge">🔥 Promo Eksklusif Member Baru</div>
                <h2 class="rgs-popup-title">Digital Premium,<br>Harga <span class="rgs-accent">Terjangkau!</span></h2>
                <p class="rgs-popup-subtitle">Netflix, Spotify, Discord Nitro &amp; Panel Pterodactyl dengan harga termurah se-Indonesia. Login &amp; mulai belanja sekarang!</p>
                <div class="rgs-popup-features">
                    <div class="rgs-popup-feat"><span class="rgs-popup-feat-icon">⚡</span>Proses Instan</div>
                    <div class="rgs-popup-feat"><span class="rgs-popup-feat-icon">🛡️</span>Garansi 1x24 Jam</div>
                    <div class="rgs-popup-feat"><span class="rgs-popup-feat-icon">💰</span>Harga Termurah</div>
                    <div class="rgs-popup-feat"><span class="rgs-popup-feat-icon">💬</span>CS Siap Bantu</div>
                </div>
                <div class="rgs-popup-cta">
                    <a href="/api/auth/discord" class="rgs-popup-btn-discord">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.115 18.105.134 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 19.839 19.839 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                        Login Discord
                    </a>
                    <a href="/#katalog" class="rgs-popup-btn-shop">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        Belanja Sekarang
                    </a>
                </div>
            </div>

            <div class="rgs-popup-footer">
                <label>
                    <input type="checkbox" id="rgs-popup-dontshow">
                    Jangan tampilkan hari ini
                </label>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Show after short delay
    requestAnimationFrame(() => {
        setTimeout(() => overlay.classList.add('rgs-visible'), 800);
    });

    // ── Close Logic ──────────────────────────────────────────
    function closePopup() {
        overlay.classList.remove('rgs-visible');
        const dontShow = document.getElementById('rgs-popup-dontshow');
        if (dontShow && dontShow.checked) {
            localStorage.setItem(POPUP_KEY, today);
        }
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 450);
    }

    document.getElementById('rgs-popup-close-btn').addEventListener('click', closePopup);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });

})();
