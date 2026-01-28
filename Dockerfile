FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
# Hugging Face Spaces will set PORT=7860 automatically
# Don't set PORT here - let HF Spaces control it
EXPOSE 7860

CMD ["node", "server.js"]


