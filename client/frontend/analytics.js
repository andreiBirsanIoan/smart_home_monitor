let objArray=[];
let tempArray=[];
let humidArray=[];
let timeArray=[];
let date=[];
let medieTemp;
let chartInstance = null;
const tempMedie=document.getElementById("avg_sesiune");
const tempCurent=document.getElementById("temp_curent");
const tempMinim=document.getElementById("min_sesiune");
const tempMaxim=document.getElementById("max_sesiune");
const graficDate=document.getElementById("grafic");
const ceasActual=document.getElementById("ceas");
async function afisareDate(){
const token = localStorage.getItem('token');
    const response=await fetch("http://localhost:8000/api/istoric",{
        headers:{
            "Authorization": "Bearer "+token
        }
    });
const data=await response.json();
objArray=data;
date.push(new Date(data.timestamp));
tempArray=objArray.map(obj=>obj.temperatura)
humidArray=objArray.map(obj=>obj.umiditate);
timeArray=objArray.map(obj=>{
    const d=new Date(obj.timestamp);
    const ore=d.getHours().toString().padStart(2,'0');
    const minute=d.getMinutes().toString().padStart(2,'0');
    const secunde=d.getSeconds().toString().padStart(2,'0'); 
    return ore+":"+minute+":"+secunde;   
});
    tempCurent.textContent=`${tempArray[0]}°C`;
    const minim=tempArray.reduce((minimCurent,valoare)=>{
        return valoare < minimCurent ? valoare : minimCurent;
    });
    tempMinim.textContent=`${minim}°C`;
    const maxim=tempArray.reduce((maximCurent,valoare)=>{
        return valoare > maximCurent ? valoare : maximCurent;
    });
    tempMaxim.textContent=`${maxim}°C`;
    medieTemp=tempArray.reduce((suma,valoare)=>suma+valoare,0)/tempArray.length;
    tempMedie.textContent=`${medieTemp.toFixed(1)}°C`;
    if (chartInstance) {
  chartInstance.destroy();
}
    chartInstance=new Chart(graficDate,{
    type:'line',
    data:{
        labels:timeArray.reverse(),
        datasets:[{
            label:'Temperatura',
            data:tempArray.reverse(),
            borderColor:'#4da6ff'
        },
        {
            label:'Umiditate',
            data:humidArray.reverse(),
            borderColor:'#9d88ff'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

}
function ceasRL(){
    const oraCurenta=new Date();
    const ore=oraCurenta.getHours().toString().padStart(2,'0');
    const minute=oraCurenta.getMinutes().toString().padStart(2,'0');
    const secunde=oraCurenta.getSeconds().toString().padStart(2,'0');
    ceasActual.textContent=ore+":"+minute+":"+secunde;
}
afisareDate();
setInterval(afisareDate,5000);
ceasRL();
setInterval(ceasRL,1000);
