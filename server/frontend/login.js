const buttonRegister=document.getElementById("register");
buttonRegister.addEventListener('click',async function(event){
    event.preventDefault();
    const username=document.getElementById("username").value; //value pentru elemente 
    const password=document.getElementById("password").value; //unde scrie userul
    const response=await fetch("http://localhost:8000/api/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({username:username,password:password})
    })
    const data=await response.json();
    if(data.token){
        localStorage.setItem('token', data.token);
        window.location.href='index.html';
    }
});