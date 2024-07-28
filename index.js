import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: '450613',
  port: 5432,
})

db.connect()

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

  
let visited = [];




app.get("/", async (req, res) => {
  visited = []
  const result = await db.query("SELECT * FROM visited_countries");
  result.rows.forEach(country_code => {
  visited.push(country_code.country_code)})
  res.render("index.ejs", {countries: visited, total: visited.length})
});

// handling input case
app.post('/add', async (req, res) => {
  let data = req.body.country;
  let countries = []

  const result = await db.query("SELECT country_code, country_name FROM countries");

  result.rows.forEach(ob => {
    countries.push(ob.country_name)
  })

  const foundKey = countries.find((k) => k.toLowerCase() === data.toLowerCase())
  if (!foundKey){
    res.render("index.ejs", {error: "Try again, Country does not exist!", countries: visited, total: visited.length})
  } else {
    const key = result.rows.find((code) => code.country_name === foundKey)

    if (visited.includes(key.country_code)){
    
      res.render("index.ejs", {error: "Try again, Country already existed!", countries: visited, total: visited.length})
      res.redirect("/")
    }
 
    db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [key.country_code])
  
  
  }
  

  res.redirect("/")


})



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
