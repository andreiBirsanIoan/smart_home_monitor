const buttonRegister = document.getElementById("register");
//cand dau click pe buton trimit prin POST username si parola la server si astept raspunsul de la server
//serverul poatetrimite status 400 sau 401 pentru eroare sau tokenul
const btnScanRfid = document.getElementById("btnScanRfid");

btnScanRfid.addEventListener("click", async function () {
  try {
    const response = await fetch("http://localhost:8000/rfid_login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Trimiți UID-ul cardului tău (trebuie să existe în baza de date la un user)
      body: JSON.stringify({ rfid: "A1B2C3D4" }), 
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Autentificare RFID esuata");
    }

    if (data.token) {
      // 1. Salvezi token-ul
      localStorage.setItem("token", data.token);

      // 2. Te duci direct în dashboard!
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || data.message || "Eroare la autentificare!");
    }
  } catch (error) {
    console.error("Eroare cerere RFID:", error);
    alert(error.message || "Nu s-a putut conecta la server!");
  }
});
buttonRegister.addEventListener("click", async function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, password: password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || "Autentificare esuata");
    }

    // Verificăm dacă avem token în răspuns (autentificare reușită)
    if (data.token) {
      localStorage.setItem("token", data.token); //setez token-ul de sesiune
      window.location.href = "dashboard.html"; //deschid pagina de dashboard
    } else {
      // Afișăm eroarea primită de la server (ex: "Password invalid")
      alert(data.error || data.message || "Autentificare esuata!");
    }
  } catch (error) {
    console.error("Eroare de rețea sau server oprit:", error);// in caz de oprire server
    alert(error.message || "Nu s-a putut conecta la server.");
  }
});
