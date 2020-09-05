FROM geodatagouv/node-gdal

WORKDIR /var/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn add gdal --build-from-source --shared_gdal

RUN yarn

COPY ./ /var/app