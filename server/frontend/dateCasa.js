let objArray=[];
let tempArray=[];
let timeArray=[];
let btnData=document.getElementById("btn-data");
const graficDate=document.getElementById("grafic");
let valTemp=document.getElementById("valoare");
const progressBar=document.getElementById("progress-bar");
progressBar.min=10;
progressBar.max=40;
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
async function afisareDate(){
const response=await fetch("http://localhost:8000/api/istoric")
const data=await response.json(); 
objArray=data;
tempArray=objArray.map(obj=>obj.temperatura)
timeArray=objArray.map(obj=>{
    const d=new Date(obj.timestamp);
    const ore=d.getHours().toString().padStart(2,'0');
    const minute=d.getMinutes().toString().padStart(2,'0'); 
    return ore+":"+minute;   
});
let tempActual=objArray.slice(-1)[0];
valTemp.textContent+=tempActual.temperatura +"°C";

progressBar.value=tempActual.temperatura;
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
        maintainAspectRatio: false,plugins: {
            title: {
                display: true,             /* Forțează afișarea titlului */
                text: 'ISTORIC EVOLUȚIE TEMPERATURĂ', /* Textul dorit */
                color: '#ffffff',          /* Culoarea textului (alb curat) */
                align: 'start',            /* Aliniere la stânga (specific dashboard-urilor) */
                padding: {
                    top: 10,
                    bottom: 30             /* Spațiu între titlu și liniile graficului */
                },
                font: {
                    family: "'Space Grotesque', 'Rajdhani'", /* Fontul tehnic din Figma */
                    size: 14,
                    weight: '600'          /* Text ușor îngroșat */
                }
            },
            legend: {
                display: false             /* Ascunde legenda implicită dacă nu o vrei */
            }
        }
    }
});

}
afisareDate();
//luareDatele();
//setInterval(luareDatele,2000);
