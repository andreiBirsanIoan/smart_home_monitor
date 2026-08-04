let objArray=[];
let btnData=document.getElementById("btn-data");
async function luareDatele(){
    const response=await fetch("http://localhost:8000/api/senzori");
    const data=await response.json();
    document.getElementById('temperatura').textContent=data.temperatura;
    document.getElementById('miscare').textContent=data.miscare;
    document.getElementById('timestamp').textContent=data.timestamp;
}
let afisare=document.getElementById("lista-date");
async function afisareDate(){
const response=await fetch("http://localhost:8000/api/istoric")
const data=await response.json(); 
objArray=data;
    let html=""
    for(let obj of objArray){
        html+=`<div class="sensor-data">
                <p>Temperatura: ${obj.temperatura}°C</p>
               <p>Miscare:${obj.miscare}</p>
               <p>Ora:${obj.timestamp}</p>
               </div>`
        
    }
    afisare.innerHTML=html;
}
//afisareDate();
btnData.addEventListener('click',afisareDate);
//luareDatele();
//setInterval(luareDatele,2000);
