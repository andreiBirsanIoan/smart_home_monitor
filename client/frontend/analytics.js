let objArray = [];
let tempArray = [];
let humidArray = [];
let timeArray = [];
let date = [];
let medieTemp;
let chartInstance = null;
const tempMedie = document.getElementById("avg_sesiune");
const tempCurent = document.getElementById("temp_curent");
const tempMinim = document.getElementById("min_sesiune");
const tempMaxim = document.getElementById("max_sesiune");
const humidMedie = document.getElementById("avg_sesiune_h");
const humidCurent = document.getElementById("humid_curent");
const humidMinim = document.getElementById("min_sesiune_h");
const humidMaxim = document.getElementById("max_sesiune_h");
const graficDate = document.getElementById("grafic");
const ceasActual = document.getElementById("ceas");
const butonLogout = document.getElementById("btnLogout");
butonLogout.addEventListener("click", (event) => {
  event.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

async function verificaStatusESP() {
  try {
    const response = await fetch("http://localhost:8000/api/status-esp");
    if (!response.ok) throw new Error("Status request failed");
    const data = await response.json();
    const element = document.getElementById("esp-status-badge");
    if (data.online) {
      element.innerText = "ESP32 : ONLINE";
      element.style.color = "#10b981";
    } else {
      element.innerText = "ESP32 : OFFLINE";
      element.style.color = "#ff6b6b";
    }
  } catch (err) {
    console.error("Eroare la verificare status:", err);
  }
}
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
    tempCurent.textContent = "Nicio dată";
    humidCurent.textContent = "Nicio dată";
    return;
  }
  objArray = data;
  date.push(new Date(data.timestamp));
  tempArray = objArray.map((obj) => obj.temperatura);
  humidArray = objArray.map((obj) => obj.umiditate);
  timeArray = objArray.map((obj) => {
    const d = new Date(obj.timestamp);
    const ore = d.getHours().toString().padStart(2, "0");
    const minute = d.getMinutes().toString().padStart(2, "0");
    const secunde = d.getSeconds().toString().padStart(2, "0");
    return ore + ":" + minute + ":" + secunde;
  });
  tempCurent.textContent = `${tempArray[0]}°C`;
  const minim = tempArray.reduce((minimCurent, valoare) => {
    return valoare < minimCurent ? valoare : minimCurent;
  });
  tempMinim.textContent = `${minim}°C`;
  const maxim = tempArray.reduce((maximCurent, valoare) => {
    return valoare > maximCurent ? valoare : maximCurent;
  });
  tempMaxim.textContent = `${maxim}°C`;
  medieTemp =
    tempArray.reduce((suma, valoare) => suma + valoare, 0) / tempArray.length;
  tempMedie.textContent = `${medieTemp.toFixed(1)}°C`;
  humidCurent.textContent = `${humidArray[0]}%`;
  const minim_h = humidArray.reduce((minimCurent, valoare) => {
    return valoare < minimCurent ? valoare : minimCurent;
  });
  humidMinim.textContent = `${minim_h}%`;
  const maxim_h = humidArray.reduce((maximCurent, valoare) => {
    return valoare > maximCurent ? valoare : maximCurent;
  });
  humidMaxim.textContent = `${maxim_h}%`;
  medieHumid =
    humidArray.reduce((suma, valoare) => suma + valoare, 0) / humidArray.length;
  humidMedie.textContent = `${medieHumid.toFixed(1)}%`;
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(graficDate, {
    type: "line",
    data: {
      labels: timeArray.reverse(),
      datasets: [
        {
          label: "Temperatura",
          data: tempArray.reverse(),
          borderColor: "#4da6ff",
        },
        {
          label: "Umiditate",
          data: humidArray.reverse(),
          borderColor: "#9d88ff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
function ceasRL() {
  const oraCurenta = new Date();
  const ore = oraCurenta.getHours().toString().padStart(2, "0");
  const minute = oraCurenta.getMinutes().toString().padStart(2, "0");
  const secunde = oraCurenta.getSeconds().toString().padStart(2, "0");
  ceasActual.textContent = ore + ":" + minute + ":" + secunde;
}
setInterval(verificaStatusESP, 3000);
afisareDate();
setInterval(afisareDate, 5000);
ceasRL();
setInterval(ceasRL, 1000);
