FROM node:18-alpine
LABEL maintainer="Project Docker Team" version="1.0.0"
WORKDIR /app
RUN adduser -D appuser
COPY package*.json ./
RUN npm install
COPY . .
USER appuser
EXPOSE 5002
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD node -e "require('http').get('http://127.0.0.1:5002/health',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "app.js"]
