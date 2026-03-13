FROM nginx:alpine
LABEL maintainer="Project Docker Team" version="1.0.0"
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -qO- http://localhost:8080/api/users/health || exit 1
