let objArray = [];
let tempArray = [];
let timeArray = [];
let humidArray = [];
let afisare = document.getElementById("lista-date");
let valTemp = document.getElementById("valoare");
let valHumid = document.getElementById("umiditate");
const graficDate = document.getElementById("grafic");
const butonLogout = document.getElementById("btnLogout");
const progressBar = document.getElementById("progress-bar");
const progressHumid = document.getElementById("progress-humid");
const ceasAutomat = document.getElementById("ceas");
const valoareTemp = document.getElementById("valoare");
progressBar.min = 10;
progressBar.max = 40;
let chartInstance = null;

//citesc adresa web din browser
const urlParams = new URLSearchParams(window.location.search);
const tokenDinUrl = urlParams.get("token");

if (tokenDinUrl) {
  // Salvare în localStorage
  localStorage.setItem("token", tokenDinUrl);

  // Curățare URL (șterge "?token=..." din bara de adrese fără refresh)
  window.history.replaceState({}, document.title, window.location.pathname);
}

// 2. Verificare existență token
const token = localStorage.getItem("token");

if (!token) {
  // Dacă nu există deloc token, redirecționăm la login
  window.location.href = "login.html";
} else {
  // 3. VERIFICARE REALA: Validăm token-ul cu backend-ul
  fetch("http://localhost:8000/api/verify-token", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => {
      if (!response.ok) {
        // Token invalid, modificat sau expirat!
        throw new Error("Token invalid");
      }
      return response.json();
    })
    .then((data) => {
      // Utilizatorul este cu adevărat autentificat
      console.log("Autentificare reușită pentru:", data.user);
    })
    .catch((error) => {
      // Curățăm token-ul invalid și trimitem utilizatorul la login
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
}

//deconectare din aplicatie(sterg token+ redirect la login)
butonLogout.addEventListener("click", (event) => {
  event.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

//doar afisez status esp32
async function verificaStatusESP() {
  try {
    const response = await fetch("http://localhost:8000/api/status-esp");
    if (!response.ok) throw new Error("Status request failed");
    const data = await response.json();
    const element = document.getElementById("esp-status-badge");
    if (!element) return;

    if (data.online) {
      element.innerText = "ESP32: ONLINE";
      element.style.color = "#10b981"; // Verde
    } else {
      element.innerText = "ESP32: OFFLINE";
      element.style.color = "#ff6b6b"; // Roșu
    }
  } catch (err) {
    console.error("Eroare la verificare status ESP:", err);
  }
}

//afisez datele de la senzori
async function afisareDate() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  const response = await fetch("http://localhost:8000/api/istoric", {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }
  if (!response.ok) throw new Error("History request failed");
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    valTemp.textContent = "Nicio dată";
    valHumid.textContent = "Nicio dată";
    return;
  }
  objArray = data;
  tempArray = objArray.map((obj) => obj.temperatura);
  humidArray = objArray.map((obj) => obj.umiditate);
  timeArray = objArray.map((obj) => {
    const d = new Date(obj.timestamp);
    const ore = d.getHours().toString().padStart(2, "0");
    const minute = d.getMinutes().toString().padStart(2, "0");
    const secunde = d.getSeconds().toString().padStart(2, "0");
    return ore + ":" + minute + ":" + secunde;
  });
  let tempActual = objArray[0];
  if (tempActual.temperatura > 28) {
    valoareTemp.style.color = "red";
  } else {
    valoareTemp.style.color = "white";
  }
  valTemp.textContent = tempActual.temperatura + "°C";
  let humidActual = objArray[0];
  valHumid.textContent = humidActual.umiditate + "%";
  progressBar.value = tempActual.temperatura;
  progressHumid.value = humidActual.umiditate;
  // variabilă globală, ține referința la grafic

  // în afisareDate(), înainte de new Chart(...):
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(graficDate, {
    type: "line",
    data: {
      labels: timeArray,
      datasets: [
        {
          label: "Temperatura",
          data: tempArray,
          borderColor: "#4da6ff",
        },

        {
          label: "Umiditate (%)",
          data: humidArray, // Datele pentru umiditate
          borderColor: "#9d88ff", // Culoare diferită (portocaliu)
          backgroundColor: "rgba(255, 159, 67, 0.1)",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true /* Forțează afișarea titlului */,
          text: "ISTORIC EVOLUȚIE TEMPERATURĂ & UMIDITATE" /* Textul dorit */,
          color: "#ffffff" /* Culoarea textului (alb curat) */,
          align: "start" /* Aliniere la stânga (specific dashboard-urilor) */,
          padding: {
            top: 10,
            bottom: 30 /* Spațiu între titlu și liniile graficului */,
          },
          font: {
            family:
              "'Space Grotesque', 'Rajdhani'" /* Fontul tehnic din Figma */,
            size: 14,
            weight: "600" /* Text ușor îngroșat */,
          },
        },
        legend: {
          display: true /* Ascunde legenda implicită dacă nu o vrei */,
        },
      },
    },
  });
}

//ceas
function ceasRL() {
  const oraCurenta = new Date();
  const ore = oraCurenta.getHours().toString().padStart(2, "0");
  const minute = oraCurenta.getMinutes().toString().padStart(2, "0");
  const secunde = oraCurenta.getSeconds().toString().padStart(2, "0");
  ceasAutomat.textContent = ore + ":" + minute + ":" + secunde;
}

afisareDate();
//afisez datele la 5 secunde
setInterval(afisareDate, 5000);
ceasRL();
//update la fiecare secunda pentru ceas
setInterval(ceasRL, 1000);
