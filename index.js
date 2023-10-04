require("dotenv").config();
const express = require('express')
const queryString = require('querystring')
const axios = require('axios')
const session = require('express-session')

const app = express()
const PORT= 3000

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

const REDIRECT_URI = `http://localhost:3000/oauth-callback`;
const AUTHURL = `https://app.hubspot.com/oauth/authorize?client_id=0a39d7b1-a8b2-4447-a97e-294a34d80328&redirect_uri=http://localhost:3000/oauth-callback&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20crm.schemas.contacts.read%20crm.schemas.contacts.write`;

const tokenStore = {}

const isAuthorized = (userId) => {
    console.log('authorized', userId);
      console.log("tokennn",tokenStore[userId])
    return tokenStore[userId] ? true : false;
}


// Set Pug as templating engine
app.set('view engine', 'pug');

app.use(
  session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to false if you're not using HTTPS in development
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // Set the session expiration time to 1 hour (in milliseconds)
    },
  })
);

app.get("/", async (req, res) => {

    console.log('homepage reached....');
  
      if (isAuthorized(req.sessionID)) {
        console.log("authorizedddd");

        const access_token = tokenStore[req.sessionID];

        console.log('access',access_token);

        const headers = {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        };


        const contacts =
          "https://api.hubapi.com/contacts/v1/lists/all/contacts/all";

        try {
          console.log("api calling....");
          const { data } = await axios.get(contacts, { headers });
            console.log("contactsdata", data);
            

            res.render("home", { token:access_token,contacts:data.results });





          // Render a page or send a response related to the contacts data here
        } catch (error) {
          // Handle any errors that occur during the API request
          console.error("error occured",error);
          res.status(500).send("Internal Server Error");
        }
      } else {
        // If not authorized, redirect to the home page with AUTHURL
        res.render("home", { AUTHURL });
      }
});


    



app.get("/oauth-callback", async (req, res) => {
  console.log("reached", req.query.code);

  const formData = {
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code: req.query.code,
  };

  try {
    const { data } = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      queryString.stringify(formData)
    );

    console.log("data", data);

    tokenStore[req.sessionID] = data.access_token;

    // Log the req.query.code value or respond with JSON data if needed
    console.log("req.query.code", req.query.code);
    
  } catch (error) {
    console.log(error);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }

  // Redirect after handling the data or error
  res.redirect("/");
});



app.listen(3000,()=>console.log(`App running on Port ${PORT}`))