const confirmPassTF = document.getElementById('confirmpasswordTF')
const passwordTF = document.getElementById('passwordTF')
const nameTF = document.getElementById('nameTF')
const emailTF = document.getElementById('emailTF')
const registroBTN = document.getElementById('registroBTN')
registroBTN.addEventListener('click', registro);

function registro() {

    if (!nameTF.value.trim()) {
        alert('Por favor ingrese su nombre');
        return;
    }

    else if (!emailTF.value.trim()) {
        alert('Por favor ingrese su correo electrónico');
        return;
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTF.value.trim())) {
        alert("Por favor ingrese un correo electrónico válido");
        return;
    }
    else if (!passwordTF.value.trim()) {
        alert('Por favor ingrese su contraseña');
        return;
    }
    else if (!confirmPassTF.value.trim()) {
        alert('Por favor ingrese la confirmación de contraseña');
        return;
    }

    else if(confirmPassTF.value!=passwordTF.value){
        alert('Las contraseñas no son las mismas')
        return;
    }
    else{
        let name = nameTF.value;
        let email= emailTF.value;
        let password= passwordTF.value;
        let registerRequest ={
            name: name,
            email: email,
            password: password,
        }
        postLogin(registerRequest);
    }
}

async function postLogin(registerRequest){
    let json= JSON.stringify(registerRequest);
    let response = await fetch('/api/client/register',{
       method: 'POST',
       headers:{
         'Content-Type': 'application/json'
       },
       body: json
    });
 
    let data = await response.json()
    if(response.ok) {
        alert(data.message)
        window.location.href = '../Login/login.html';
     } else {
        alert(data.message);
    }
 }
