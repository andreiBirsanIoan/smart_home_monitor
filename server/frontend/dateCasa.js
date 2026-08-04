let objArray=[];
let tempArray=[];
let timeArray=[];
let btnData=document.getElementById("btn-data");
const graficDate=document.getElementById("grafic");

async function luareDatele(){
    const response=await fetch("http://localhost:8000/api/senzori");
    const data=await response.json();
    document.getElementById('temperatura').textContent=data.temperatura;
    document.getElementById('miscare').textContent=data.miscare;
    //document.getElementById('timestamp').textContent=data.timestamp;
    let date=new Date(data.timestamp);
    document.getElementById('timestamp'.textContent)=date;
}
let afisare=document.getElementById("lista-date");
// async function afisareDate(){
// const response=await fetch("http://localhost:8000/api/istoric")
// const data=await response.json(); 
// objArray=data;
// tempArray=objArray.map(obj=>obj.temperatura)
// timeArray=objArray.map(obj=>obj.timestamp)
//     let html=""
//     for(let obj of objArray){
//         html+=`<div class="sensor-data">
//                 <p>Temperatura: ${obj.temperatura}°C</p>
//                <p>Miscare:${obj.miscare}</p>
//                <p>Ora:${obj.timestamp}</p>
//                </div>`
        
//     }
//     afisare.innerHTML=html;
    
// }
//afisareDate();

//btnData.addEventListener('click',afisareDate);
async function afisareDate(){
const response=await fetch("http://localhost:8000/api/istoric")
const data=await response.json(); 
objArray=data;
//date.push(new Date(data.timestamp));
tempArray=objArray.map(obj=>obj.temperatura)
timeArray=objArray.map(obj=>{
    const d=new Date(obj.timestamp);
    const ore=d.getHours().toString().padStart(2,'0');
    const minute=d.getMinutes().toString().padStart(2,'0'); 
    return ore+":"+minute;   
});

    new Chart(graficDate,{
    type:'line',
    data:{
        labels:timeArray,
        datasets:[{
            label:'Temperatura',
            data:tempArray,
            borderColor:'#4da6ff'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

}
afisareDate();
//luareDatele();
//setInterval(luareDatele,2000);
