import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors";
import bcrypt from "bcrypt";
const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 5000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "jobTracker",
  password: "Clare@2019",
  port: 5432,
});
db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/api/:user_id", async (req, res) => {
  const userId = req.params.user_id;

  try {
    const result = await db.query(
      "SELECT * FROM jobtable WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get jobs error:", err);
    res.status(500).json({ error: "Failed to get jobs" });
  }
});

app.post("/add", async (req, res) => {
  const { date, company, status, links, notes, user_id } = req.body;

  try {
    await db.query(
      "INSERT INTO jobtable (date, company, links, status, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [date, company, links, status, notes, user_id]
    );
    res.status(201).json({ message: "Job added successfully" });
  } catch (err) {
    console.error("Add job error:", err);
    res.status(500).json({ error: "Failed to add job" });
  }
});

app.put("/edit", async (req, res) => {
  const { id, date, company, status, links, notes, user_id } = req.body;

  console.log("Edit request from user:", user_id);

  try {
    const result = await db.query(
      `UPDATE jobtable 
       SET date = $1, company = $2, links = $3, status = $4, notes = $5 
       WHERE id = $6 AND user_id = $7`,
      [date, company, links, status, notes, id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: "Not authorized or job not found" });
    }

    res.status(200).json({ message: "Job updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update job" });
  }
});

app.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM jobtable WHERE id = $1", [id]);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});
// -------------------------
app.post("/logIn/signUp", async (req, res) => {
  const { email, password } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [
      email,
      hashedPassword,
    ]);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/logIn/signIn", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      "SELECT id, password FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const storedHashedPassword = result.rows[0].password;
    const isMatch = await bcrypt.compare(password, storedHashedPassword);

    if (!isMatch) {
      console.log("Invalid password");
      return res.status(401).json({ error: "Invalid email or password" });
    } else {
      console.log("User logged in successfully");
      const userId = result.rows[0].id;
      res.status(200).json({ message: "User logged in successfully", userId });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
