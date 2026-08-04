let objArray=[];
let tempArray=[];
let timeArray=[];
let date=[];
const graficDate=document.getElementById("grafic");
async function afisareDate(){
const response=await fetch("http://localhost:8000/api/istoric")
const data=await response.json(); 
objArray=data;
date.push(new Date(data.timestamp));
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
