if (process.env.NODE_ENV === "production") {
    require("@google-cloud/trace-agent").start();
    require("@google-cloud/debug-agent").start({
        serviceContext: JSON.stringify({
            service: "APMS-BACKEND",
            version: "v1.o",
            enableCanary: true
        })
    });
    
}

const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const port = process.env.PORT || 5000;


app.get("/", async (req, res) => {
    console.log(process.env.DB_PASS);
    res.send("Welcome to APMS-BACKEND");
});

app.listen(port, () => {
    console.log(`APMS app is active on port ${port}`);
    // console.log(process.env.SENDINGBLUE_API_KEY);  
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//import routes
var routes = require("./application/routes");
routes(app);