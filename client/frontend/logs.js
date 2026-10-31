const ceasActual = document.getElementById("ceas");
const tbody = document.getElementById("tabel-istoric");
const salvarePrag = document.getElementById("salveazaPrag");
const pragCitit = document.getElementById("prag");
const butonLogout = document.getElementById("btnLogout");
function removeTable() {
  tbody.innerHTML = "";
}
salvarePrag.addEventListener("click", async function () {
  const token = localStorage.getItem("token");
  const valoareInput = pragCitit.value;

  if (valoareInput.trim() === "") {
    alert("Setează o valoare");
    return;
  }
  const pragNou = Number(valoareInput);
  if (pragNou < -40 || pragNou > 100) {
    alert("Pragul trebuie să fie între -40 și 100");
    return;
  }

  if (!token) {
    alert("Trebuie să fii autentificat");
    return;
  } else {
    try {
      const response = await fetch("http://localhost:8000/api/prag", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({ prag: pragNou }),
      });
      if (response.status === 400) {
        alert("Prag invalid");
      } else if (response.status === 401) {
        alert("Trebuie să te autentifici");
      } else if (response.status === 403) {
        alert("Nu ai drepturi de administrator");
      } else if (response.ok) {
        alert("Pragul a fost modificat cu succes!");
      } else {
        alert("A apărut o eroare");
      }
    } catch (error) {
      console.error(error);
      alert("Eroare de comunicare cu serverul");
    }
  }
});
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
butonLogout.addEventListener("click", (event) => {
  event.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

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
