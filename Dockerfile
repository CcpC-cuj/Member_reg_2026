FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

# Hugging Face Spaces sets PORT; server.js listens on process.env.PORT
EXPOSE 7860

CMD ["node", "server.js"]


