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
sudo modprobe <Nombre-del-modulo> 
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
<img width="1000" height="382" alt="image" src="https://github.com/user-attachments/assets/374717be-1f18-4fec-b19a-63d8457e9aed" />
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
   <img width="1000" height="360" alt="image" src="https://github.com/user-attachments/assets/737dc692-25b0-4ee3-b639-ead1875b42f2" />
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
  <img width="700" height="120" alt="image" src="https://github.com/user-attachments/assets/e6f03688-7151-4822-a57d-37fa2a3d4a80" />
</p>




