const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");

const app = express();
app.use(express.static("public"));

const mailchimp = require("@mailchimp/mailchimp_marketing");

const md5 = require("md5");

mailchimp.setConfig({
  apiKey: process.env.API_KEY,
  server: process.env.SERVER_NO,
});

app.get("/", function (req, res) {
   res.sendFile(__dirname + "/signup.html");
});

app.use(bodyParser.urlencoded({extended: true}));

app.post("/", function (req, res) {
   const listId = process.env.LIST_ID;
   const email = req.body.email;
   const subscriberHash = md5(email.toLowerCase());

   async function add() {
         const response = await mailchimp.lists.addListMember(listId, {
            email_address: req.body.email,
            status: "subscribed",
            merge_fields: {
               FNAME: req.body.fname,
               LNAME: req.body.sname
            }
         });
   
         console.log(`Successfully added contact as an audience member. The contact's id is ${response.id}.`);
   }

   async function check() {
      try {
         const response = await mailchimp.lists.getListMember(listId, subscriberHash);

         console.log(`This user's subscription status is ${response.status}.`);
         if (response.status === "subscribed") {
            res.sendFile(__dirname + "/success.html");
         }
         else if (response.status === "unsubscribed") {
            add();
            res.sendFile(__dirname + "/success.html");
         }
      }
      catch (e) {
         if (e.status === 404) {
            console.error(`This email is not subscribed to this list`, e);
            add();
            res.sendFile(__dirname + "/success.html");
         }
         else if (e.status === 401) {
            console.error('Wrong API Key');
            res.sendFile(__dirname + "/failure.html");
         }
      }
   }
   check();
});

app.post("/failure", function(req, res) {
   apikey = process.env.API_KEY;
   mailchimp.setConfig({
      apiKey: apikey,
      server: process.env.SERVER_NO,
    });
   res.redirect("/");
});

app.listen(3000, function () {
   console.log("server is listening at port 3000.");
});