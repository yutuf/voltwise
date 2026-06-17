export type CatalogDevice = {
  id: string;
  icon: string;
  name: string;
  w: number;
  h: number;
  shift: boolean;
  maxHours: number;
};

export const DEVICE_CATALOG: CatalogDevice[] = [
  { id: "fridge", icon: "🧊", name: "Buzdolabı", w: 150, h: 24, shift: false, maxHours: 24 },
  { id: "ac", icon: "❄️", name: "Klima", w: 1500, h: 4, shift: false, maxHours: 12 },
  { id: "water", icon: "🔥", name: "Termosifon", w: 2000, h: 2, shift: true, maxHours: 12 },
  { id: "wash", icon: "👕", name: "Çamaşır mak.", w: 1200, h: 1, shift: true, maxHours: 12 },
  { id: "tv", icon: "📺", name: "TV", w: 120, h: 5, shift: false, maxHours: 12 },
  { id: "light", icon: "💡", name: "Aydınlatma", w: 300, h: 6, shift: false, maxHours: 12 },
  { id: "pc", icon: "💻", name: "Bilgisayar", w: 200, h: 5, shift: false, maxHours: 12 },
  { id: "dish", icon: "🍽️", name: "Bulaşık mak.", w: 1100, h: 1, shift: true, maxHours: 12 },
];

export type DeviceId = (typeof DEVICE_CATALOG)[number]["id"];

export const RECO_META = {
  shift: { icon: "🌙", badge: "hi", badgeT: "Yüksek etki", desc: "Puant saatten gece tarifesine kaydır · şebeke dostu" },
  ac: { icon: "🌡️", badge: "md", badgeT: "Orta", desc: "Her 1°C ~%7 daha az tüketim" },
  led: { icon: "💡", badge: "hi", badgeT: "Yüksek etki", desc: "Aydınlatmada LED ile ~%80 düşüş" },
};

export const PALETTE = ["#ffd400", "#38bdf8", "#22c55e", "#f472b6", "#fb923c", "#a78bfa", "#f87171", "#2dd4bf"];

export function catalogMap() {
  return Object.fromEntries(DEVICE_CATALOG.map((d) => [d.id, d]));
}
