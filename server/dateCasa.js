async function luareDatele(){
    const response=await fetch("http://localhost:8000/api/senzori");
    const data=await response.json();
    document.getElementById('temperatura').textContent=data.temperatura;
    document.getElementById('miscare').textContent=data.miscare;
}
luareDatele();
setInterval(luareDatele,2000);