DEVICE_CATALOG = [
    {"id": "fridge", "icon": "🧊", "name": "Buzdolabı", "w": 150, "h": 24, "shift": False, "max_hours": 24},
    {"id": "ac", "icon": "❄️", "name": "Klima", "w": 1500, "h": 4, "shift": False, "max_hours": 12},
    {"id": "water", "icon": "🔥", "name": "Termosifon", "w": 2000, "h": 2, "shift": True, "max_hours": 12},
    {"id": "wash", "icon": "👕", "name": "Çamaşır mak.", "w": 1200, "h": 1, "shift": True, "max_hours": 12},
    {"id": "tv", "icon": "📺", "name": "TV", "w": 120, "h": 5, "shift": False, "max_hours": 12},
    {"id": "light", "icon": "💡", "name": "Aydınlatma", "w": 300, "h": 6, "shift": False, "max_hours": 12},
    {"id": "pc", "icon": "💻", "name": "Bilgisayar", "w": 200, "h": 5, "shift": False, "max_hours": 12},
    {"id": "dish", "icon": "🍽️", "name": "Bulaşık mak.", "w": 1100, "h": 1, "shift": True, "max_hours": 12},
]

RECO_META = {
    "shift": {
        "icon": "🌙",
        "badge": "hi",
        "badge_t": "Yüksek etki",
        "desc": "Puant saatten gece tarifesine kaydır · şebeke dostu",
    },
    "ac": {
        "icon": "🌡️",
        "badge": "md",
        "badge_t": "Orta",
        "desc": "Her 1°C ~%7 daha az tüketim",
    },
    "led": {
        "icon": "💡",
        "badge": "hi",
        "badge_t": "Yüksek etki",
        "desc": "Aydınlatmada LED ile ~%80 düşüş",
    },
}

PALETTE = [
    "#ffd400", "#38bdf8", "#22c55e", "#f472b6",
    "#fb923c", "#a78bfa", "#f87171", "#2dd4bf",
]
