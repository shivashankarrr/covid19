const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "covid19India.db");
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//get states
app.get("/states/", async (request, response) => {
  const statesQuery = `SELECT * FROM state;`;
  const statesList = await database.all(statesQuery);
  response.send(statesList);
});

// get state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(state);
});

//create district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, active, deaths } = request.body;
  const addDistrictQuery = `
    INSERT INTO
    district(district_name,state_id,cases,active,deaths)
    VALUES
    (
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${active}',
        '${deaths}'
    );`;
  await database.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//get district

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT * FROM
  district
  WHERE district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(district);
});

//delete district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE 
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update state
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE
    district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get stats
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM
    district
    WHERE
    state_id = ${stateId};`;
  stats = await database.get(getStatsQuery);
  response.send(stats);
});

//containing state name and district
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_id
    FROM
    district
    WHERE 
    district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
