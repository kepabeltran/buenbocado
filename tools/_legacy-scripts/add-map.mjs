// add-map.mjs — Añadir mapa Leaflet completo a offers/page.tsx
import fs from "node:fs";

const FILE = "C:\\Users\\Harold\\Desktop\\Proyectos\\contenido\\KEPA 2024\\guapiweb\\buenbocado_ok\\apps\\client\\app\\offers\\page.tsx";

let code = fs.readFileSync(FILE, "utf8");

if (code.includes("showMap")) {
  console.log("El mapa ya existe en el archivo");
  process.exit(0);
}

let changes = 0;

// 1. Añadir campos lat/lng a ApiMenu
code = code.replace(
  /  imageUrl\?: string \| null;\n};/,
  `  imageUrl?: string | null;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
};`
);
changes++;
console.log("1. Campos lat/lng añadidos a ApiMenu");

// 2. Añadir estado showMap y refs
code = code.replace(
  `const [under10, setUnder10] = useState(false);`,
  `const [under10, setUnder10] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const mapRef = React.useRef<HTMLDivElement>(null);
  const leafletMapRef = React.useRef<any>(null);`
);
changes++;
console.log("2. Estado showMap añadido (visible por defecto)");

// 3. Añadir useEffect de Leaflet DESPUÉS de filtered
const leafletEffect = `

  // Leaflet map
  useEffect(() => {
    if (!showMap || !mapRef.current || filtered.length === 0) return;
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapRef.current).setView([36.7213, -4.4214], 14);
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
        maxZoom: 19,
      }).addTo(map);

      const byRestaurant = new Map();
      for (const m of filtered) {
        if (!m.restaurantLat || !m.restaurantLng) continue;
        const key = m.restaurant;
        if (!byRestaurant.has(key)) {
          byRestaurant.set(key, { name: m.restaurant, lat: m.restaurantLat, lng: m.restaurantLng, offers: [] });
        }
        byRestaurant.get(key).offers.push({ title: m.title, price: (m.priceCents / 100).toFixed(2) + " \\u20ac" });
      }

      const greenIcon = L.divIcon({
        className: "",
        html: '<div style="width:32px;height:32px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:grid;place-items:center"><span style="color:#fff;font-weight:900;font-size:14px">BB</span></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
      });

      const bounds = [];

      byRestaurant.forEach((r) => {
        const offersHtml = r.offers.map((o) => '<div style="font-size:12px;margin-top:4px"><strong>' + o.title + "</strong> — " + o.price + "</div>").join("");
        const popup = '<div style="font-family:DM Sans,system-ui,sans-serif;min-width:160px"><div style="font-size:14px;font-weight:800;color:#10b981">' + r.name + "</div>" + offersHtml + "</div>";

        L.marker([r.lat, r.lng], { icon: greenIcon }).addTo(map).bindPopup(popup);
        bounds.push([r.lat, r.lng]);
      });

      if (coords) {
        const userIcon = L.divIcon({
          className: "",
          html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map).bindPopup('<div style="font-size:12px;font-weight:700">T\\u00fa</div>');
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }

      setTimeout(() => map.invalidateSize(), 100);
    };

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [showMap, filtered, coords]);`;

// Buscar el cierre de filtered useMemo
const lines = code.split("\n");
let insertAfter = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("}, [items, sort, typeFilter, under10]);")) {
    insertAfter = i;
    break;
  }
}

if (insertAfter > -1) {
  lines.splice(insertAfter + 1, 0, leafletEffect);
  code = lines.join("\n");
  changes++;
  console.log("3. useEffect de Leaflet añadido después de filtered");
} else {
  console.log("3. AVISO: No se encontró filtered useMemo");
}

// 4. Añadir chip Lista/Mapa
code = code.replace(
  `<Chip active={sort === "near"} onClick={() => setSort("near")}>Cerca</Chip>`,
  `<Chip active={showMap} onClick={() => setShowMap(!showMap)}>{showMap ? "Lista" : "Mapa"}</Chip>
            <Chip active={sort === "near"} onClick={() => setSort("near")}>Cerca</Chip>`
);
changes++;
console.log("4. Chip Lista/Mapa añadido");

// 5. Añadir div del mapa
code = code.replace(
  `{/* Contenido */}
        <section className="px-4 pb-28 pt-2">`,
  `{/* Mapa */}
        {showMap && (
          <div className="px-4 pt-2 pb-3">
            <div ref={mapRef} className="w-full rounded-2xl border border-slate-200 overflow-hidden" style={{ height: 280 }} />
          </div>
        )}

        {/* Contenido */}
        <section className="px-4 pb-28 pt-2">`
);
changes++;
console.log("5. Div del mapa añadido");

fs.writeFileSync(FILE, code, "utf8");
console.log(`\nTotal cambios: ${changes}`);
console.log("Mapa Leaflet añadido correctamente");
