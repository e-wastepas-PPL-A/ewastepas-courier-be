# Gunakan base image yang mendukung OpenSSL 3.0
FROM node:18-alpine

RUN apk add --no-cache openssl

# Setel direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json untuk instalasi dependencies
COPY package*.json ./

# Instal dependencies aplikasi
RUN npm install

# Salin seluruh kode aplikasi ke dalam container
COPY . .

# Generate Prisma Client dengan target binary yang sesuai
RUN npx prisma generate

# Build app
RUN npm run build

# Ekspos port yang digunakan oleh aplikasi (default Express adalah 80 jika diubah pada server.js)
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]