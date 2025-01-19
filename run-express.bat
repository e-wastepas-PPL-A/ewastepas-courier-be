@echo off

echo Installing dependencies and generating Prisma client...
call npm install && call npx prisma generate

echo Starting Express.js application...
call npm run start