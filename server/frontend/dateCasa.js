let objArray=[];
let tempArray=[];
let timeArray=[];
let humidArray=[];
let btnData=document.getElementById("btn-data");
const graficDate=document.getElementById("grafic");
let valTemp=document.getElementById("valoare");
let valHumid=document.getElementById("umiditate");
const progressBar=document.getElementById("progress-bar");
const progressHumid=document.getElementById("progress-humid");
progressBar.min=10;
progressBar.max=40;
 let chartInstance = null; 
async function luareDatele(){
    
    const response=await fetch("http://localhost:8000/api/senzori");
    const data=await response.json();
    document.getElementById('temperatura').textContent=data.temperatura;
    document.getElementById('umiditate').textContent=data.umiditate;
    //document.getElementById('timestamp').textContent=data.timestamp;
    let date=new Date(data.timestamp);
    document.getElementById('timestamp').textContent=date;
}
let afisare=document.getElementById("lista-date");
async function afisareDate(){
    const token = localStorage.getItem('token');
    const response=await fetch("http://localhost:8000/api/istoric",{
        headers:{
            "Authorization": "Bearer "+token
        }
    });
    const data=await response.json(); 
    objArray=data;
    tempArray=objArray.map(obj=>obj.temperatura)
    humidArray=objArray.map(obj=>obj.umiditate);
    timeArray=objArray.map(obj=>{
        const d=new Date(obj.timestamp);
        const ore=d.getHours().toString().padStart(2,'0');
        const minute=d.getMinutes().toString().padStart(2,'0'); 
        return ore+":"+minute;   
    });
    let tempActual=objArray[0];
    valTemp.textContent=tempActual.temperatura +"°C";
    let humidActual=objArray[0];
    valHumid.textContent=humidActual.umiditate+"%";
    progressBar.value=tempActual.temperatura;
    progressHumid.value=humidActual.umiditate;
    // variabilă globală, ține referința la grafic

// în afisareDate(), înainte de new Chart(...):
if (chartInstance) {
  chartInstance.destroy();
}
chartInstance=new Chart(graficDate,{
        type:'line',
        data:{
            labels:timeArray,
            datasets:[{
                label:'Temperatura',
                data:tempArray,
                borderColor:'#4da6ff'
            },
                {
                    label: 'Umiditate (%)',
                    data: humidArray, // Datele pentru umiditate
                    borderColor: '#ff9f43', // Culoare diferită (portocaliu)
                    backgroundColor: 'rgba(255, 159, 67, 0.1)',
                    tension: 0.3
                }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,plugins: {
                title: {
                    display: true,             /* Forțează afișarea titlului */
                    text: 'ISTORIC EVOLUȚIE TEMPERATURĂ & UMIDITATE', /* Textul dorit */
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
                    display: true           /* Ascunde legenda implicită dacă nu o vrei */
                }
            }
        }
    });

}
afisareDate();
setInterval(afisareDate, 5000);
