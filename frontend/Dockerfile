# ./frontend/Dockerfile

FROM node:25.2.1

WORKDIR /app

# Install deps using local package.json before mounting
COPY package*.json ./

RUN rm -rf package-lock.json && npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
