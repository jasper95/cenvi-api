
FROM node:lts-alpine

WORKDIR /var/app

COPY package*.json ./

RUN npm install -g pm2

RUN apk add --no-cache bash make gcc g++ python linux-headers udev --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing --repository http://dl-cdn.alpinelinux.org/alpine/edge/main gdal gdal-dev



RUN npm install gdal --build-from-source --shared_gdal

RUN npm install

RUN apk del make gcc g++ python

COPY ./ /var/app

RUN npm run build 

CMD npm start