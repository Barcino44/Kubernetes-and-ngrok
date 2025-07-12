# 1. INTRODUCCIÓN

El presente repositorio busca:

- Ofrecer una guia para la inicialización de un propio cluster de kubernetes mediante el uso de máquinas virtuales Rocky Linux 8.10 usando Kubeadm. 

- Explicar el despliegue de una aplicación web dentro del cluster.

- Exponer dicha aplicación web ante internet mediante el tunel ngrok.

Espero que sea de su interés.

<p align="center">
  <img src="https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif" alt="Alt Text" />
</p>

# 2. PROCESO DE INICIALIZACIÓN DEL CLUSTER. 
 
## 2.1 CONFIGURACIÓN PREVIA  

Se parte del hecho de que es necesario el correcto aprovisionamiento de las máquinas para la configuración del cluster de Kubernetes. En este laboratorio, se instanciarán cuatro máquinas virtuales: una como nodo master, dos como nodos workers. 

Por tal motivo, cada una de estas se contará con la siguiente configuración. 
 
•	Memoria RAM = 4GB. 

•	Imagen del sistema operativo = Rocky Linux 8.10. 

•	Adaptadores de red:
-	Adaptador #1 = Modo anfitrión (host-only). 
-	Adaptador #2 = Modo puente (bridge) a interfaz Wi-Fi. 

La inicialización de las mismas se realizó con ayuda de Vagrant con ayuda del siguiente esquema.
```
Vagrant.configure("2") do |config|
  config.vm.define "master" do |master|
    master.vm.box = "generic/rocky8"
    master.vm.hostname = 'master'
    master.vm.network "private_network", ip: "192.168.56.10", virtualbox__intnet: false
    master.vm.network "public_network", bridge: "Realtek 8821CE Wireless LAN 802.11ac PCI-E NIC"  #Tu Interfaz Wi-Fi
    master.vm.provider "virtualbox" do |vb|
      vb.memory = "4096"    
      vb.cpus = 2         
    end
  end
  config.vm.define "worker1" do |worker1|
    worker1.vm.box = "generic/rocky8"
    worker1.vm.hostname = 'worker1'
    worker1.vm.network "private_network", ip: "192.168.56.11", virtualbox__intnet: false
    worker1.vm.network "public_network", bridge: "Realtek 8821CE Wireless LAN 802.11ac PCI-E NIC"  #Tu Interfaz Wi-Fi
    worker1.vm.provider "virtualbox" do |vb|
      vb.memory = "4096"    
      vb.cpus = 2         
    end
  end
  config.vm.define "worker2" do |worker2|
    worker2.vm.box = "generic/rocky8"
    worker2.vm.hostname = 'worker2'
    worker2.vm.network "private_network", ip: "192.168.56.12", virtualbox__intnet: false
    worker2.vm.network "public_network", bridge: "Realtek 8821CE Wireless LAN 802.11ac PCI-E NIC"  #Tu Interfaz Wi-Fi
    worker2.vm.provider "virtualbox" do |vb|
      vb.memory = "4096"  
      vb.cpus = 2         
    end
  end
end
```
## 2.2 CONFIGURACIÓN DE LOS PARÁMETROS NECESARIOS PARA LA CREACIÓN DEL CLUSTER. 
 
**Aclaración: Todos los comandos de esta sección deberían ser ejecutados también por los workers, ya que se realiza la instalación de todos los componentes necesarios para el correcto manejo de Kubernetes. (Toda la sección 2.2)**
 
Una vez, que se ha garantizado la conexión con cada uno de los nodos. El siguiente paso es adecuar el entorno para la inicialización del cluster. Por tal motivo, se añaden módulos de configuración necesarios para containerd con ayuda del comando.

``` 
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf 
> overlay 
> br_netfilter 
> EOF 
```
 
Posteriormente, se prueba que estos módulos hayan sido cargados correctamente al entorno de containerd con ayuda de. 
``` 
sudo modprobe overlay
sudo modprobe br_netfilter 
``` 
Luego, se establece la configuración necesaria para garantizar networking dentro de los Kubernetes con ayuda del siguiente comando. 

``` 
cat <<EOF | sudo tee /etc/sysctl.d/99-Kubernetes-cri.conf 
> net.bridge.bridge-nf-call-iptables = 1 
> net.ipv4.ip_forward = 1 
> net.bridge.bridge-nf-call-ip6tables = 1 
> EOF 
```
Finalmente se aplican todos los cambios con ayuda del comando. 
````
sudo sysctl –system
````
Tras esto, realizamos la actualización de los paquetes con ayuda del comando.

````
sudo dnf update
````
Se instala containerd con ayuda del repositorio de Docker ya que es requerido para inicialización del cluster.
````
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 
sudo dnf install -y containerd 
````
Una vez realizado el paso anterior, se genera una configuración por defecto para containerd con ayuda del comando.
````
[vagrant@master containerd]$ sudo containerd config default | sudo tee /etc/containerd/config.toml 
````

Se reinicia el servicio de containerd tras aplicar la configuración por defecto. Lo anterior, se consigue con ayuda de los comandos.

````
sudo systemctl restart containerd 
sudo systemctl status containerd 
````
<p align="center">
<img width="600" height="250" alt="image" src="https://github.com/user-attachments/assets/374717be-1f18-4fec-b19a-63d8457e9aed" />
 </p>


Una vez verificado que el servicio se encuentra corriendo, lo siguiente será deshabilitar swap de forma permanente, lo anterior se consigue con ayuda del comando: 

````
sudo swapoff -a 
````

Y posteriormente, para deshabilitar el swap de manera permanente se modifica el archivo ```/etc/fstab ````, comentando la línea que hace referencia al swap. Todo lo anterior con ayuda del siguiente comando:

````
sudo nano /etc/fstab
````
<p align="center">
   <img width="600" height="250" alt="image" src="https://github.com/user-attachments/assets/737dc692-25b0-4ee3-b639-ead1875b42f2" />
</p>

Tras esto, son instaladas las dependencias requeridas para los kubenetes, estas son curl, ca-certificates, dnf-plugins-core, gnupg2. 


````
sudo dnf install -y curl ca-certificates dnf-plugins-core gnupg2
````

Después, se agregan los repositorios de Kubernetes, para esto, se importan las llaves GPG de Google.
````
sudo rpm --import https://packages.cloud.google.com/yum/doc/yum-key.gpg
````
````
sudo rpm --import https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
````
````
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
>[kubernetes]
>name=Kubernetes
>baseurl=https://pkgs.k8s.io/core:/stable:/v1.29/rpm/
>enabled=1
>gpgcheck=1
>repo_gpgcheck=1
>gpgkey=https://pkgs.k8s.io/core:/stable:/v1.29/rpm/repodata/repomd.xml.key
>EOF
````

Tras esto, se borra la cache y se reconstruye con la nueva información de los repositorios.
````
sudo dnf clean all 
sudo dnf makecache 
````

Una vez cargado el repositorio de Kubernetes, el paso siguiente es descargar kubectl, kubelet y kubeadm para luego realizar la inicialización del cluster. 

````
sudo dnf install -y kubelet kubeadm kubectl
````

Finalmente, se realiza un bloqueo de la versión de kubectl, kubelet y kubeadm, con el fin de que estas no puedan recibir más actualizaciones que puedan afectar el cluster. Para lo anterior, se hace necesario la descarga del plugin versionlock.
````
sudo dnf install -y python3-dnf-plugin-versionlock
````
````
sudo dnf versionlock kubelet kubeadm kubectl
````

Tras lo anterior, se habilita Kubelet con ayuda del comando enable para que cada vez que se reinicie la máquina, el servicio también se levante con ella. Para esto, se emplea el comando:  
 ````
sudo systemctl enable --now kubelet
````
````
sudo systemctl enable --now containerd
````
## 2.4 INICIALIZACIÓN DEL CLUSTER DE KUBERNETES  

Tras lo anterior , se inicia el cluster de Kubernetes en el nodo master. La pod network cidr especifica las direcciones ip que serán asignadas a los pods dentro del cluster, lo anterior se consigue con ayuda del comando:  
````
sudo kubeadm init --apiserver-advertise-address 192.168.56.10 --pod-network-cidr=192.168.0.0/16.
````
Donde la primera ip hace referencia a la dirección del control-plane, mientras que la segunda hace referencia a la red de pods.

Después, se realiza la configuración inicial al cluster copiando el archivo de configuración admin.conf al entorno ./kube/config. Lo anterior, se finaliza con la adición de los correspondientes permisos.  
````
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

````
Finalmente, es necesario realizar la instalación de un componente de networking en el nodo maestro. En este caso, se decidió por usar calico. 
````
kubectl apply -f https://docs.projectcalico.org/manifests/crds.yaml 
````
````
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml
````
Una realizados este paso, se creó el token con el fin de que los nodos workers pudiesen ingresar al cluster.

````
kubeadm token create --print-join-command kubeadm 
````
El resultado del anterior comando es el que deben usar los nodos workers para unirse al cluster. Un ejemplo de una salida es la siguiente.
````
sudo join 192.168.56.10:6443 --token w1r27x.vtr34utrhptdq20g -discovery-token-ca-cert-hash sha256:e88b8ac3d6bfb0523038828e3dfccf610846206b5afe21d2067be0f84bd2e307  
````
Si todo funciona de manera correcta, el siguiente comando debería mostrar todos los nodos en estado Ready.
````
kubectl get pods 
````
<p align="center">
  <img width="600" height="120" alt="image" src="https://github.com/user-attachments/assets/e6f03688-7151-4822-a57d-37fa2a3d4a80" />
</p>

Puedes verificar la ip con la que se encuentran corriendo los nodos con ayuda del comando.
````
kubectl get pods -o wide
````
En caso de que los nodos se generen con la ip de otra interfaz que no sea host-only (En mi caso los nodos usaban la ip de la interfaz en NAT), añadiendo la ip correspondiente como --node-ip=<ip-de-la-interfaz> de la siguiente manera.

````
sudo vim /var/lib/kubelet/kubeadm-flags.env
````
<p align="center">
    <img width="928" height="81" alt="image" src="https://github.com/user-attachments/assets/d81f6889-613b-4666-a486-6fd32bb8db1e" />
</p>

# 3. DESPLIEGUE DE UNA APLICACIÓN PROPIA CON AYUDA DE KUBERNETES Y CONTENEDORES

Antes de continuar, se definen algunos conceptos básicos en el contexto de Kubernetes.

**Pods:**

Son la unidad más pequeña de despliegue en Kubernetes. Un pod puede contener uno o varios contenedores que comparten almacenamiento, red y especificaciones de ejecución. 

**Deployments:**

Son objetos de Kubernetes que administran la creación y actualización de pods de manera declarativa. Permiten definir la cantidad de réplicas de un pod y manejar sus actualizaciones. 

**Service:**

Un Service en Kubernetes es un recurso que expone un conjunto de Pods y permite la comunicación estable entre ellos o con el exterior. 

## 3.1 BACKEND: 

La estructura del backend es la siguiente.
<p align="center">
  <img width="900" height="500" alt="image" src="https://github.com/user-attachments/assets/46eb7d53-db53-4b20-a2cf-60493564748f" />
</p>

El archivo mvnw, no es archivo propio del repositorio, sino que es generado al momento de compilar la aplicación. Es por eso se debe descargar un compilador de java para Linux como puede ser SDKMAN. En el repositorio, el Backend ya se encuentra compilado pero si se requiere, la guia de instalación y compilación con ayuda de SDKMAN es mostrada a continuación.

````
# 1. Instalación
curl -s "https://get.sdkman.io" | bash
````
````
# 2. Carga SDKMAN en shell
source "$HOME/.sdkman/bin/sdkman-init.sh"
````
````
# 3. Instalación de Java 21 (Correspondiente a la versión del proyecto)
sdk install java 21-tem
````
````
# 4. Establezco Java 21 como predeterminado
sdk default java 21-tem
````
````
# 5. Verificación
java -version                      
````
````
# 6. Compilación (Ejecutar en la carpeta del Backend)
./mvnw clean package -DskipTests                 
````
Posteriormente, se genera el DockerFile ***Vease en el repositorio***. Este DockerFile se pushea a un repositorio remoto (Recuerda iniciar sesión primero como sudo). Por cada cambio en la imagen se recomienda generar una nueva versión.
````
# Construcción de la imagen basado en el Dockerfile:
sudo docker build -t <NombreImagen> .  
````
````
# Tageo y posterior push de la imagen a DockerHub:
sudo docker tag <NombreImagen> <NombreImagen>:<version>
sudo docker push <NombreImagen>:<version>
````

### 3.1.1 Deployment y service 

Se genera un archivo llamado **”backend-deployment.yaml”** para generar un deployment y un service con ayuda de kubernetes. Se establecen atributos importantes como un environment (env) para realizar la conexión con la base de datos. ***Vease en el repositorio***. 

Se debe cambiar la imagen de acuerdo con el nombre puesto al realizar el docker build.

````
<omitted>
spec:
      containers:
        - name: backend
          image: <tu-imagen>
          ports:
            - containerPort: 8080
<omitted>
````

Se deben aplicar los cambios y generar el service y deployment.
````
kubectl apply -f backend-deployment.yaml 
````

## 3.2 BASE DE DATOS 

Para la base de datos, únicamente se genera el archivo **“mysql-deployment.yaml”**, debido a que no es necesaria la construcción de una imagen, en ella se emplean atributos como nombre de usuario y contraseña que deberán ser usados por el backend para su conexión con esta. ***Vease en el repositorio***.

Nuevamente, se aplican los cambios con ayuda de.

````
kubectl apply -f mysql-deployment.yaml 
````

## 3.3 FRONTEND

La estructura del frontend es la siguiente:
<p align="center">
  <img width="800" height="150" alt="image" src="https://github.com/user-attachments/assets/465c06cd-9a05-4d5c-8bd2-6c96b8517e2f" />
</p>

Entre aspectos importantes del frontend encuentran el **Dockerfile** y **ngnix.conf** para el despliegue. ***Vease en el repositorio***

Con respecto a **ngnix.conf** un aspecto clave a resaltar es el proxy-pass que permite enmascarar consulta de http. Los navegadores al usar https, bloquearan las consultas al backend en caso de que se omita este aspecto.

````
location /api/ {
        proxy_pass http://192.168.56.11:30000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
````

Nuevamente, lo ideal es actualizar la versión de la imagen del contenedor. Para esto, se realiza.

````
# Construcción de la imagen basado en el Dockerfile:
sudo docker build -t <NombreImagen> .  
````

````
# Tageo y posterior push de la imagen a DockerHub:
sudo docker tag <NombreImagen> <NombreImagen>:<version>
sudo docker push <NombreImagen>:<version>
````

### 3.3.1 Deployment y Service:

Se crea un archivo llamado ”frontend-deployment.yaml” para el despliegue del servicio ***Vease en el repositorio***.

- Se crea un deployment para manejar los pods que son creados.
- Se crea un service para exponer el servicio de frontend.

No olvide usar la imagen construida con Docker build.

````
    spec:
      containers:
        - name: frontend
          image: barcino/miapp-frontend:4.4
          ports:
          - containerPort: 80
---
````

En la parte de service, es importante saber que significa cada puerto. A continuación, breves definiciones.

•	ContainerPort: Puerto del contenedor, debe coincidir con el targetPort.

•	port: Se refiere al puerto del service, por aquí se establece comunicación con otros pods de manera interna en el cluster.

•	targetPort: Se refiere al puerto donde escucha la aplicación (Ngnix).

•	NodePort: Puerto por donde escucha el nodo, accesible fuera del cluster.

````
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: NodePort
````

Si no se especifica NodePort, Kubernetes escoge uno por defecto entre 30000 y 32767 (Como en este caso).

Tras lo anterior, podremos acceder a la página desplegada usando la ip de uno de los nodos configurados en combinación con el puerto ‘NodePort’ definido en el service del frontend.
<p align="center">
  <img width="600" height="159" alt="image" src="https://github.com/user-attachments/assets/dd932b4f-03a8-4aba-8420-898696bd6878" />
</p>
En este caso, se utilizaría el puerto de 32324 (Servicio de frontend). No se va a acceder al backend (Puerto 30000), el uso de este puerto es solo para comunicación desde el frontend hacia la API.

Si todo se realizó de manera correcta el resultado deberá ser el siguiente.

<p align="center">
  <img width="600" height="400" alt="image" src="https://github.com/user-attachments/assets/0176eb49-bf2f-4fc6-8786-2f3e241dbd3e" />
</p>

# 4. EXPOSICIÓN DE LA APLICACIÓN ANTE INTERNET CON AYUDA DEL TÚNEL DE NGROK 

Para finalizar se realizará el despliegue ante internet de la aplicación construida con ayuda del clúster de Kubernetes. Para esto, se realizará la exposición del servicio del Frontend usando el tunel de ngrok.

Se instala ngrok con los siguientes comandos.

````
unzip ngrok-stable-linux-amd64.zip
````
````
chmod +x ngrok
````
````
sudo mv ngrok /usr/local/bin/
````

Y se configura un token de autenticación con ayuda de:

````
ngrok config add-authtoken <Token-generado-por-ngrok>
````

En una terminal se port-forwardea el svc frontend que escucha por el puerto 80 [ngnix] hacia localhost:8080.

````
kubectl port-forward svc/frontend-service 8080:80
````
Mientras que se expone mi localhost:8080 hacia internet con ayuda de ngrok.

````
ngrok http 8080
````
<p align="center">
  <img width="600" height="394" alt="image" src="https://github.com/user-attachments/assets/ba3a4725-7cf6-48b2-9f1c-2510037124bf" />
</p>

Habrás expuesto tu aplicación ante internet con ayuda de ngrok. 
<p align="center">
  <img width="600" height="407" alt="image" src="https://github.com/user-attachments/assets/1ee3cf15-388a-44f6-84b9-df1d6133695e" />
</p>

# 5. BIBLIOGRAFÍA

CASTILLO, Mario. Crea tu Propio Cluster de Kubernetes: Instalación Paso a Paso con Kubeadm y VirtualBox. Cali: Youtube, 2024. Disponible en:  
https://www.youtube.com/watch?v=2iCXmroXVXs&t=620s 
 
CASTILLO, Mario. Laboratorio Práctico de Kubernetes: Deployment, ReplicaSet, Service, Secrets y ConfigMaps. Cali: Youtube, 2024. Disponible en:  
https://www.youtube.com/watch?v=2iCXmroXVXs 
 
Kubernetes. (s.f.). kubeadm init. Recuperado el 28 de marzo de 2025. Disponible en: https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-init/ 

<p align="center">
<img src= "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTJ6aGNrZ2JwbHJkd2c1eDdhdGU5bDdsNDd0eGgyMGxiOG9rOTNqZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/W6dHvprT7oks6BpX5R/giphy.gif">
</p>
