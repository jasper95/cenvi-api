
FROM geodatagouv/node-gdal

WORKDIR /var/app

COPY package.json ./
COPY yarn.lock ./

RUN npm install -g pm2

RUN yarn add gdal --build-from-source --shared_gdal

RUN yarn

COPY ./ /var/app

RUN yarn build 

CMD yarn start