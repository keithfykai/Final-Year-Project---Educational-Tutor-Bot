# ./frontend/Dockerfile

FROM node:18

WORKDIR /app

# Install deps using local package.json before mounting
COPY package*.json ./
RUN npm install

COPY . .

# Don't copy source files — volume mount will override anyway
EXPOSE 3000

CMD ["npm", "run", "dev"]
