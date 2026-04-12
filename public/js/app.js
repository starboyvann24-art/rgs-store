// public/js/app.js

// === 1. Data Initialization & Storage Management ===
const DEFAULT_PRODUCTS = [
  {
    id: "prod-001",
    name: "Netflix Premium - 1 Bulan (Sharing)",
    category: "Streaming",
    description: "Akun Netflix Premium Sharing untuk 1 User. Garansi Penuh selama masa aktif. Resolusi Ultra HD (4K). Mendukung semua perangkat.",
    originalPrice: 45000,
    discount: 10,
    finalPrice: 40500,
    stock: 50,
    // Base64 dummy image / fallback URL (using high quality placeholder for demo)
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    variants: ["1 Bulan", "3 Bulan", "6 Bulan"]
  },
  {
    id: "prod-002",
    name: "Spotify Premium - 1 Bulan (Individual)",
    category: "Music",
    description: "Perpanjang Spotify Premium akun pribadi Anda. Legal 100%, tanpa gangguan iklan, dengarkan musik secara offline.",
    originalPrice: 50000,
    discount: 5,
    finalPrice: 47500,
    stock: 200,
    image: "https://images.unsplash.com/photo-1611339555312-e607c83ce7f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    variants: ["1 Bulan", "1 Tahun"]
  },
  {
    id: "prod-003",
    name: "Discord Nitro - 1 Bulan (Full)",
    category: "Discord",
    description: "Tingkatkan pengalaman Discord Anda dengan Nitro. Custom Emoji, 2 Server Boosts, HD Streaming, dan banyak lagi.",
    originalPrice: 150000,
    discount: 15,
    finalPrice: 127500,
    stock: 0, // Mocking out of stock
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    variants: ["1 Bulan", "1 Tahun"]
  },
  {
    id: "prod-004",
    name: "YouTube Premium - 1 Bulan (Add to Fam)",
    category: "Streaming",
    description: "Bebas Iklan di YouTube & YouTube Music. Bisa Play Background. Legal 100%.",
    originalPrice: 20000,
    discount: 0,
    finalPrice: 20000,
    stock: 120,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    variants: ["1 Bulan", "4 Bulan"]
  },
  {
    id: "prod-005",
    name: "Minecraft Java & Bedrock Edition - Full Access",
    category: "Game",
    description: "Akun original Minecraft (Java & Bedrock Edition). Full Access, bisa diubah email, password, dan nickname.",
    originalPrice: 350000,
    discount: 20,
    finalPrice: 280000,
    stock: 5,
    image: "https://images.unsplash.com/photo-1607988795691-3e0147c4323d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    variants: ["Full Access"]
  },
  {
    id: "prod-006",
    name: "Canva Pro - 1 Bulan (Edu Sharing)",
    category: "Productivity",
    description: "Akses semua fitur Canva Pro. Font premium, asset premium, tanpa batas.",
    originalPrice: 15000,
    discount: 0,
    finalPrice: 15000,
    stock: 500,
    image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    variants: ["1 Bulan", "1 Tahun", "Lifetime"]
  }
];

function initDatabase() {
  if (!localStorage.getItem('productsData')) {
    localStorage.setItem('productsData', JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem('cartItems')) {
    localStorage.setItem('cartItems', JSON.stringify([]));
  }
  if (!localStorage.getItem('orderHistory')) {
    localStorage.setItem('orderHistory', JSON.stringify([]));
  }
}

// Call on startup
initDatabase();

// === 2. Global Utilities ===

function getProducts() {
  return JSON.parse(localStorage.getItem('productsData')) || [];
}

function saveProducts(products) {
  localStorage.setItem('productsData', JSON.stringify(products));
}

function getCart() {
  return JSON.parse(localStorage.getItem('cartItems')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cartItems', JSON.stringify(cart));
  updateCartBadge();
}

function getOrders() {
  return JSON.parse(localStorage.getItem('orderHistory')) || [];
}

function saveOrders(orders) {
  localStorage.setItem('orderHistory', JSON.stringify(orders));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser')) || null;
}

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  
  toast.className = `flex items-center w-full max-w-xs p-4 mb-4 text-white ${bgColor} rounded-xl shadow-lg animate-slide-up relative overflow-hidden`;
  toast.innerHTML = `
    <div class="ml-3 text-sm font-medium mr-8">${message}</div>
    <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white bg-opacity-20 text-white hover:bg-opacity-40 rounded-lg focus:ring-2 focus:ring-white p-1.5 inline-flex h-8 w-8 items-center justify-center absolute right-3" onclick="this.parentElement.remove()">
      <span class="sr-only">Close</span>
      <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
      </svg>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.replace('animate-slide-up', 'opacity-0');
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-24 right-5 z-[9999] flex flex-col gap-2';
  document.body.appendChild(container);
  return container;
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalItems;
    badge.classList.toggle('hidden', totalItems === 0);
  }
}

// Ensure the navbar updates on load if badge exists
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    // Auth logic in Navbar
    const authLinks = document.getElementById('navbar-auth');
    const user = getCurrentUser();
    
    if (authLinks) {
        if (user) {
            authLinks.innerHTML = `
                <a href="${user.role === 'admin' ? 'admin.html' : 'dashboard.html'}" class="flex items-center text-gray-700 hover:text-primary-500 transition font-medium">
                    <svg class="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Hai, ${user.name.split(' ')[0]}
                </a>
            `;
        } else {
             authLinks.innerHTML = `
                <a href="auth.html" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-sm transition">Masuk / Daftar</a>
            `;
        }
    }
});

// === 3. Image Upload Helper (Base64) ===
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Expose utilities on window object for easy inline DOM use
window.appUtils = {
    getProducts, saveProducts, getCart, saveCart, getOrders, saveOrders,
    getCurrentUser, formatRupiah, showToast, updateCartBadge, convertImageToBase64
};
