import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: process.env.POSTGRES_KEY,
  port: 5432,
});
db.connect();

const app = express();
const port = 3000;

async function updateCountries() {
  let result = await db.query("SELECT country_code FROM visited_countries");
  let visitedCountries = [];
  result.rows.forEach((country) => {
    visitedCountries.push(country.country_code);
  });
  return visitedCountries;
}

async function insertCountryCode(country, res) {
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%' ",
      [country.lowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      visitedCountries.push(countryCode);
      res.redirect("/");
    } catch (error) {
      let visitedCountries = await updateCountries();
      res.render("index.ejs", {
        countries: visitedCountries,
        total: visitedCountries.length,
        error: "Country already visited",
      });
    }
  } catch (error) {
    let visitedCountries = await updateCountries();
    res.render("index.ejs", {
      countries: visitedCountries,
      total: visitedCountries.length,
      error: "No country found, try again",
    });
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  let visitedCountries = await updateCountries();
  console.log(visitedCountries);
  res.render("index.ejs", {
    countries: visitedCountries,
    total: visitedCountries.length,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  insertCountryCode(input, res);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
