import "pg";

const Pool = require("pg").Pool;
const pool = new Pool ({
    user: "my_user",
    host: "localhost", 
    database: "my_database",
    password: "root",
    port: 5432,
});

export default async function handler(req, res) {



    try {
        const { eventDetails, token } = req.body;
        

    }
}


const newApiResponse = await axios.post("/api/create-shared-calendar", {
    userToken: { token },
    calendarDetails,
  });