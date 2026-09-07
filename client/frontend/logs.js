const ceasActual = document.getElementById("ceas");
const tbody = document.getElementById("tabel-istoric");
function removeTable() {
  tbody.innerHTML = "";
}
async function incarcaIstoric() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8000/api/istoric", {
      headers: { Authorization: "Bearer " + token },
    });
    const date = await res.json();

    tbody.innerHTML = date
      .map(
        (r) => `
            <tr >
                <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
                <td>${r.temperatura} °C</td>
                <td>${r.umiditate} %</td>
                <td>${r.miscare ? " DETECTATĂ" : " OK"}</td>
            </tr>
        `,
      )
      .join("");
  } catch (err) {
    console.error("Eroare incarcare date:", err);
  }
}

async function verificaStatusESP() {
  try {
    const res = await fetch("http://localhost:8000/api/status-esp");
    const data = await res.json();
    const badge = document.getElementById("esp-status-badge");

    badge.innerText = data.online ? "ESP32: ONLINE" : "ESP32: OFFLINE";
    badge.style.color = data.online ? "#10b981" : "#ff6b6b";
  } catch (e) {}
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
