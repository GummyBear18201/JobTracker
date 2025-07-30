import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import cors from "cors";
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
let jobTable = [];
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
async function getTable() {
  const result = await db.query("SELECT * FROM jobtable ORDER BY id DESC");
  let tempTable = [];
  result.rows.forEach((job) => {
    tempTable.push(job);
  });
  return tempTable;
}
app.get("/api", async (req, res) => {
  jobTable = await getTable();
  console.log(jobTable);
  res.json(jobTable);
});

app.post("/add", async (req, res) => {
  const { date, company, status, links, notes } = req.body;
  console.log("Received data:", { date, company, status, links, notes });

  const result = await db.query(
    "Insert into jobtable (date,company,links,status,notes) values ($1,$2,$3,$4,$5)",
    [date, company, links, status, notes]
  );
  res.status(201).json({ message: "Job added successfully" });
});

app.put("/edit", async (req, res) => {
  const { id, date, company, status, links, notes } = req.body;
  console.log("Received data:", { date, company, status, links, notes });

  const result = await db.query(
    "UPDATE jobtable SET date = $1, company = $2, links = $3, status = $4, notes = $5 WHERE id = $6",
    [date, company, links, status, notes, id]
  );
  res.status(200).json({ message: "Job updated successfully" });
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
