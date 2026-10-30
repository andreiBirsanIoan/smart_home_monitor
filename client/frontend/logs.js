const ceasActual = document.getElementById("ceas");
const tbody = document.getElementById("tabel-istoric");
function removeTable() {
  tbody.innerHTML = "";
}
async function incarcaIstoric() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }
    const res = await fetch("http://localhost:8000/api/istoric", {
      headers: { Authorization: "Bearer " + token },
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }
    if (!res.ok) throw new Error("History request failed");
    const date = await res.json();

    tbody.replaceChildren();
    date.forEach((r) => {
      const row = document.createElement("tr");
      [
        new Date(r.timestamp).toLocaleTimeString(),
        `${r.temperatura} °C`,
        `${r.umiditate} %`,
        r.miscare ? "DETECTATĂ" : "OK",
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Eroare incarcare date:", err);
  }
}

async function verificaStatusESP() {
  try {
    const res = await fetch("http://localhost:8000/api/status-esp");
    if (!res.ok) throw new Error("Status request failed");
    const data = await res.json();
    const badge = document.getElementById("esp-status-badge");

    badge.innerText = data.online ? "ESP32: ONLINE" : "ESP32: OFFLINE";
    badge.style.color = data.online ? "#10b981" : "#ff6b6b";
  } catch (e) {
    console.error("Eroare verificare status ESP:", e);
  }
}

function ceasRL() {
  const oraCurenta = new Date();
  const ore = oraCurenta.getHours().toString().padStart(2, "0");
  const minute = oraCurenta.getMinutes().toString().padStart(2, "0");
  const secunde = oraCurenta.getSeconds().toString().padStart(2, "0");
  ceasActual.textContent = ore + ":" + minute + ":" + secunde;
}
// Rulare
removeTable();
incarcaIstoric();
verificaStatusESP();
ceasRL();

setInterval(incarcaIstoric, 5000);
setInterval(verificaStatusESP, 3000);
setInterval(ceasRL, 1000);
