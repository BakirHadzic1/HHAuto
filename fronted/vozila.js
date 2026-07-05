const OLX_SHOP_URL = "https://hhauto.olx.ba/aktivni";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatSyncDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getVehicleMeta(vehicle) {
  return [
    ["Godiste", vehicle.year],
    ["Kilometraza", vehicle.km],
    ["Gorivo", vehicle.fuel],
    ["Cijena", vehicle.price || "Na upit"]
  ].filter(([, value]) => value);
}

function createCarCard(vehicle) {
  const card = document.createElement("article");
  card.className = "car-card";

  const labels = vehicle.labels?.length ? vehicle.labels : ["Dostupno na PIK-u"];
  const meta = getVehicleMeta(vehicle);

  card.innerHTML = `
    <img src="${escapeHtml(vehicle.image)}" alt="${escapeHtml(vehicle.name)}" loading="lazy">
    <div class="car-body">
      <div class="car-labels">
        ${labels.map(label => `<span class="badge available">${escapeHtml(label)}</span>`).join("")}
      </div>
      <h3>${escapeHtml(vehicle.name)}</h3>
      <p>${escapeHtml(vehicle.condition || "Polovno")} vozilo iz aktivne HH Auto OLX ponude${vehicle.updated ? `, obnovljeno ${escapeHtml(vehicle.updated)}` : ""}.</p>
      <dl class="car-meta">
        ${meta.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
      </dl>
      <a href="${escapeHtml(vehicle.url || OLX_SHOP_URL)}" target="_blank" rel="noopener" class="details-link">Pogledaj oglas</a>
    </div>
  `;

  return card;
}

function showError(container) {
  container.innerHTML = `
    <div class="cars-error">
      <h3>Trenutno ne možemo učitati vozila.</h3>
      <p>Kompletnu aktivnu ponudu možete otvoriti direktno na OLX/PIK profilu.</p>
      <a href="${OLX_SHOP_URL}" target="_blank" rel="noopener" class="details-link">Sva auta na PIK-u</a>
    </div>
  `;
}

function updateSyncInfo(data) {
  const infoElements = document.querySelectorAll("[data-vehicles-info]");
  const updated = formatSyncDate(data.updatedAt);
  const text = updated
    ? `${data.count} aktivnih oglasa • ažurirano ${updated}`
    : `${data.count} aktivnih oglasa`;

  infoElements.forEach(element => {
    element.textContent = text;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const ponudaDiv = document.getElementById("ponuda");
  if (!ponudaDiv) return;

  try {
    const response = await fetch("./data/vozila.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Ne mogu ucitati vozila.json");

    const data = await response.json();
    const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
    if (!vehicles.length) throw new Error("Lista vozila je prazna");

    const isFullPage = document.body.classList.contains("vehicles-page");
    const vehiclesToRender = isFullPage ? vehicles : vehicles.slice(0, 6);

    ponudaDiv.innerHTML = "";
    vehiclesToRender.forEach(vehicle => ponudaDiv.appendChild(createCarCard(vehicle)));
    updateSyncInfo(data);
  } catch (error) {
    console.error(error);
    showError(ponudaDiv);
  }
});
