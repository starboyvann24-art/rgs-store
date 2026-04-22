document.addEventListener('DOMContentLoaded', async () => {
    const productList = document.getElementById('product-list');
    const emptyState  = document.getElementById('empty-state');
    const catPills    = document.querySelectorAll('.cat-pill');
    const searchInput = document.getElementById('main-search');

    let currentCat = 'All';

    async function loadProducts(query = '', cat = 'All') {
        if (!productList) return;
        
        // STRICT DOM CLEARING
        productList.innerHTML = `
            <div class="product-card skeleton" style="height:320px"></div>
            <div class="product-card skeleton" style="height:320px"></div>
            <div class="product-card skeleton" style="height:320px"></div>
            <div class="product-card skeleton" style="height:320px"></div>`;

        const params = {};
        if (query) params.search = query;
        if (cat !== 'All') params.category = cat;

        try {
            // GET /api/products returns only is_active = 1
            const products = await store.getProducts(params);
            
            if (!products || !products.length) {
                productList.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            productList.style.display = 'grid';
            emptyState.style.display = 'none';
            productList.innerHTML = '';
            
            for (const [i, p] of products.entries()) {
                const finalPrice = store.formatRupiah(p.final_price);
                const origPrice  = p.discount > 0 ? store.formatRupiah(p.price) : '';
                const disc       = p.discount > 0 ? `<div class="discount-badge">-${p.discount}%</div>` : '';
                
                // Placeholder image if image_url is missing
                const imgSrc     = p.image_url || 'https://placehold.co/400x400/f97316/ffffff?text=RGS+STORE';

                productList.insertAdjacentHTML('beforeend', `
                    <div class="product-card fade-up" style="animation-delay:${i * 0.05}s" onclick="location.href='/product.html?id=${p.id}'">
                        <div class="product-card-img">
                            ${disc}
                            <img src="${imgSrc}" alt="${p.name}" loading="lazy">
                        </div>
                        <div class="product-card-body">
                            <div class="product-cat">${p.category}</div>
                            <div class="product-name">${p.name}</div>
                            <div class="product-stock" style="font-size:11px;color:${p.stock < 10 ? '#ef4444' : '#64748b'};margin-bottom:8px;font-weight:600;">Stok: ${p.stock}</div>
                            <div class="product-price-row" style="display:flex; flex-direction:column; gap:2px">
                                ${origPrice ? `<div class="price-was">${origPrice}</div>` : ''}
                                <div class="price-now">${finalPrice}</div>
                            </div>
                            <div class="btn-detail">Lihat Detail →</div>
                        </div>
                    </div>`);
            }
        } catch (err) {
            console.error('Home Load Error:', err);
            productList.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                    <p style="color:var(--text-muted); margin-bottom: 20px;">Gagal memuat produk. Silakan coba lagi nanti.</p>
                    <button onclick="location.reload()" class="btn-orange" style="padding: 10px 20px;">Refresh Halaman 🔄</button>
                </div>`;
        }
    }

    // Event Delegation for category pills (or direct listeners as they are static)
    catPills.forEach(btn => {
        btn.addEventListener('click', () => {
            catPills.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCat = btn.dataset.val;
            loadProducts(searchInput.value, currentCat);
        });
    });

    let searchTimer;
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => loadProducts(e.target.value, currentCat), 400);
        });
    }

    // Initial Load from URL or default
    const urlCat = new URLSearchParams(location.search).get('category');
    if (urlCat) {
        currentCat = urlCat;
        catPills.forEach(b => {
            const match = b.dataset.val === urlCat || (b.dataset.val === 'All' && urlCat === 'All');
            b.classList.toggle('active', match);
        });
    }

    loadProducts('', currentCat);

    // ─── CAROUSEL LOGIC ─────────────────────────────────────────
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((s, idx) => {
            s.classList.toggle('active', idx === index);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Auto-play 3000ms as requested
    let slideTimer = setInterval(nextSlide, 3000);


});
