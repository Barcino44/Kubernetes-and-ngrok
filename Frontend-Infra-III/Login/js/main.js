const passwordTF = document.getElementById('passwordTF')
const emailTF = document.getElementById('emailTF')
const loginBTN = document.getElementById('loginBTN')
loginBTN.addEventListener('click', login);

function login() {
    if (!emailTF.value.trim()) {
        alert('Por favor ingrese su correo electrónico');
        return;
    }
    
    if (!passwordTF.value.trim()) {
        alert('Por favor ingrese su contraseña');
        return;
    }
        let email= emailTF.value;
        let password= passwordTF.value;
    
        let LoginRequest ={
            email: email,
            password: password,
        }
        postLogin(LoginRequest);
}

async function postLogin(LoginRequest){
    let json= JSON.stringify(LoginRequest);
    let response = await fetch('/api/client/login',{
       method: 'POST',
       headers:{
         'Content-Type': 'application/json'
       },
       body: json
    });
 
    let data = await response.json()
    if(response.ok) {
        let client= JSON.stringify(data);
        localStorage.setItem('client', data.id);
        window.location.href = '../Home/home.html';
     } else {
        alert(data.message);
    }
 }
