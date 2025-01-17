
# Ewastepas Courier API

The **Ewastepas Courier API** is a backend service designed to facilitate the management of e-waste collection, user interactions, and platform activities for courier partners. Built using **Node.js** and **ExpressJS** with **MySQL** as the database, this API provides essential functionalities to enhance the efficiency of e-waste management.


## Features

- **View Electronic Waste Types**: Access a list of types and categories of electronic waste eligible for collection.
- **Incoming Pickup Requests**: Check incoming requests for e-waste pickups.
- **Accept Pickup Requests**: Ability to accept requests for e-waste collection.
- **Total Collected Waste**: View the total amount of electronic waste that has been collected.
- **Pickup History**: Access the history of e-waste pickups.


## Run Locally

Clone the project

```bash
  git clone https://github.com/e-wastepas-PPL-A/ewastepas-courier-be.git
```

Go to the project directory

```bash
  cd <your-project>
```

Install dependencies

```bash
  npm install
```
Generate prisma client
```bash
npx prisma generate
```
Start the server

```bash
  npm run start
```

Or after clone you can use .bat or .sh shell to run locally

```bash
.\run-express.bat
```
```bash
chmod +x run-express.sh && ./run-express.sh
```
## Authors

- [@lanangksma](https://github.com/lanangksma)
- [@mrizqh294](https://github.com/mrizqh294)


## Documentation

[API Documentation](https://github.com/e-wastepas-PPL-A/ewastepas-courier-be/blob/main/docs/courier.md)

