FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
