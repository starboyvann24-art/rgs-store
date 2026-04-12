const productsData = [
  {
    id: "p1",
    name: "Netflix Premium",
    category: "Streaming",
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    sold: 1250,
    description: "Nikmati streaming Netflix kualitas 4K HDR. Akses penuh tanpa hambatan, garansi akun resmi dan legal 100%.",
    variants: [
      { id: "v1_1", name: "Sharing 1 Bulan", price: 35000 },
      { id: "v1_2", name: "Private 1 Bulan", price: 120000 },
      { id: "v1_3", name: "Private 3 Bulan", price: 350000 }
    ]
  },
  {
    id: "p2",
    name: "Spotify Premium",
    category: "Audio",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    sold: 3400,
    description: "Dengarkan lagu favorit bebas iklan, bebas skip, bisa download untuk offline. Proses instan via invite link/upgrade akun lama.",
    variants: [
      { id: "v2_1", name: "Individu 1 Bulan", price: 40000 },
      { id: "v2_2", name: "Individu 3 Bulan", price: 110000 },
      { id: "v2_3", name: "Family 1 Bulan (1 Akun)", price: 20000 }
    ]
  },
  {
    id: "p3",
    name: "Discord Nitro",
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1614680376593-902f74adc561?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    sold: 840,
    description: "Tingkatkan pengalaman Discord Anda dengan custom emoji di semua server, profile banner, HD streaming, dan upload size besar.",
    variants: [
      { id: "v3_1", name: "Basic 1 Bulan", price: 45000 },
      { id: "v3_2", name: "Boost 1 Bulan", price: 90000 },
      { id: "v3_3", name: "Boost 1 Tahun", price: 900000 }
    ]
  },
  {
    id: "p4",
    name: "Youtube Premium",
    category: "Streaming",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=400",
    rating: 4.7,
    sold: 2100,
    description: "Nonton Youtube bebas iklan, bisa background play di HP, gratis akses Youtube Music Premium. Garansi legal anti kick.",
    variants: [
      { id: "v4_1", name: "Individu 1 Bulan", price: 15000 },
      { id: "v4_2", name: "Family 1 Bulan (Invite)", price: 25000 }
    ]
  },
  {
    id: "p5",
    name: "Canva Pro",
    category: "Productivity",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    sold: 4520,
    description: "Akses jutaan template premium, hapus background sekali klik, dan resize desain otomatis. Upgrade di akun pribadi via invite team.",
    variants: [
      { id: "v5_1", name: "Sharing 1 Bulan", price: 15000 },
      { id: "v5_2", name: "Sharing 1 Tahun", price: 45000 }
    ]
  },
  {
    id: "p6",
    name: "Zoom Pro",
    category: "Productivity",
    image: "https://images.unsplash.com/photo-1611162618828-bc409f073cbf?auto=format&fit=crop&q=80&w=400",
    rating: 4.6,
    sold: 950,
    description: "Meeting lebih lama tanpa batas 40 menit, record cloud, dan akses tools bisnis premium lainnya.",
    variants: [
      { id: "v6_1", name: "Host 1 Hari", price: 10000 },
      { id: "v6_2", name: "Host 1 Bulan", price: 150000 }
    ]
  }
];

// Helper global
window.productsData = productsData;
