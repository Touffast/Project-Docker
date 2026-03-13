FROM node:18-alpine
WORKDIR /app
RUN adduser -D myuser
COPY package*.json ./
RUN npm install
COPY . .
USER myuser
EXPOSE 5001
CMD ["node", "app.js"]
