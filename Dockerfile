
FROM geodatagouv/node-gdal

WORKDIR /var/app

COPY package*.json ./

RUN npm install -g pm2

RUN yarn add gdal --build-from-source --shared_gdal

RUN yarn

RUN apk del make gcc g++ python

COPY ./ /var/app

RUN yarn build 

CMD yarn start