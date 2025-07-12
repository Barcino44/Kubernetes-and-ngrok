# Backend

El Backend se encuentra desarrollado en Java SpringBoot, dado a que ya se trabajado con este Framework en materias anteriores. Su estructura consta de una carpeta de src que cuenta con toda la información referente al proyecto, al interior de  src/main/java/org/example/backendproject se encuentran los componentes más importantes entre los que se destacan las carpetas:

-	Entity: contiene información de los clases que referencian a las entidades hace parte del proyecto, por ejemplo, Cliente, Producto, Carrito, etc.
-	ResponseRequest: Es usada en el código para responder con un mensaje adicional dada la respuesta que sea dada por el servidor.
-	repository: Hace la conexión directa con la base de datos, representa las tablas asociadas con cada entidad. Cuando se realiza algún evento que implique almacenar datos, se realiza el llamado a repository para realizar esta acción en la tabla asociada a esa entidad. 
-	service: Contiene un archivo que permite generar los productos que son ofrecidos a los clientes.

Cabe destacar la función que Echocontroller cumple, ya 	que es el encargado de generar los endpoints que posteriormente pueden ser utilizados por el FrontEnd para realizar operaciones en la base de datos. 
