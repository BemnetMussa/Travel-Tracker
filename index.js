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
let users = [];
let user_response;
let currentUserID = 2;

// Fetch users from the database
async function fetchUsers() {
  try {
    const clients = await db.query("SELECT * FROM users");
    users = clients.rows


  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

// Fetch users initially
fetchUsers();
async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserID]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}


app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});

app.post('/add', async (req, res) => {
  try {
    let data = req.body.country.trim();

    let countries = [];
    const currentUser = await getCurrentUser();
    currentUserID = currentUser.id
  
    
    const result = await db.query("SELECT country_code, country_name FROM countries");
    // Create an array of country names
    result.rows.forEach(ob => {
      countries.push(ob.country_name);
    });

    // Check if the country exists
    const foundKey = countries.find((k) => k.toLowerCase() === data.toLowerCase());

    if (!foundKey) {
      console.log("country doesn't exists try again!")
      return res.render("index.ejs", { 
        error: "Try again, Country does not exist!", 
        countries: visited, 
        total: visited.length,
        users: users,
        color: users[currentUserID-1].color
      });
    }

    // Find the country code for the found country
    const key = result.rows.find((code) => code.country_name === foundKey);

    if (visited.includes(key.country_code)) {
      console.log("country already exists")
      // Country already visited
      return res.render("index.ejs", { 
        error: "Try again, Country already existed!", 
        countries: visited, 
        total: visited.length,
        users: users,
        color: users[currentUserID-1].color

      });
    }
    console.log("Data added successfully ")
    await db.query("INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)", [key.country_code, currentUserID]);
    res.redirect("/");

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserID = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;
  console.log(req.body)
  
  const result = await db.query(
    "INSERT INTO users (user_name, color) VALUES($1, $2)", [name, color]
  );

  const id = users.length+1

  currentUserID = id;

  res.redirect("/");
});
async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserID);
}


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
