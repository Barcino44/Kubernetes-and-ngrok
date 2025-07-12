FROM nginx:alpine

# Copiar archivos de la aplicación
COPY Home/ /usr/share/nginx/html/Home/
COPY Login/ /usr/share/nginx/html/Login/
COPY Register/ /usr/share/nginx/html/Register/
COPY images/ /usr/share/nginx/html/images/
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html/

EXPOSE 80

