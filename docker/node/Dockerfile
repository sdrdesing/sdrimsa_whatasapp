FROM node:20-alpine

WORKDIR /var/www

# Instala dependencias primero (cache)
COPY package*.json ./
RUN npm install

# Copia el resto
COPY . .

CMD ["npm", "run", "dev"]
