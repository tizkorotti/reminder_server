FROM node:alpine as base
RUN apk update && apk add tzdata
RUN cp /usr/share/zoneinfo/Asia/Jerusalem /etc/localtime
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 8765