
FROM node:10.15-alpine

WORKDIR /var/app

COPY ./package.json /var/app/package.json
RUN npm install

COPY ./ /var/app

ENV PORT 5000
# ENV NODE_ENV development
EXPOSE 5000

CMD npm start