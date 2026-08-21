const buttonRegister=document.getElementById("register");
buttonRegister.addEventListener('click',async function(event){
    event.preventDefault();
    const username=document.getElementById("username").value; //value pentru elemente 
    const password=document.getElementById("password").value; //unde scrie userul
    try{
            const response=await fetch("http://localhost:8000/api/register",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({username:username,password:password})
            })
            const data=await response.json();
            if(data.status==='utilizator creat'){
                buttonRegister.innerText="CONT CREAT! REDIRECȚIONARE...";
                buttonRegister.style.backgroundColor="#00ff88";
                buttonRegister.style.color="#000";
                setTimeout(()=>{
                    window.location.href='login.html';
                },2000);
            }
            else{
                alert(data.message || "Eroare la crearea contului!");

            }
    }catch(error){
        console.error("Eroare de conexiune:",error);
        alert("Server indisponibil");
    }
});