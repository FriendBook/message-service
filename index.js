const express = require("express");
const app = express();
const PORT = 8081;
const cors = require("cors");
var amqp = require("amqplib/callback_api");
const { MongoClient, ObjectId } = require("mongodb");

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log("Listening on " + PORT));

const uri =
  "mongodb+srv://admin:admin@friendbook.ac2qv.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
client.connect();

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    channel.assertQueue("actions", {
      durable: false,
    });

    channel.consume(
      "actions",
      function (msg) {
        var operation = JSON.parse(msg.content);
        switch (operation.type) {
          case "update":
            client
              .db("friendbook-messages")
              .collection("messages")
              .updateOne(
                { _id: operation.id },
                { $set: { username: `${operation.name}` } }
              );
            break;
          case "delete":
            client
              .db("friendbook-messages")
              .collection("messages")
              .updateOne(
                { _id: operation.id },
                { $set: { username: `${"User Removed"}` } }
              );
            break;
          default:
            break;
        }
      },
      {
        noAck: true,
      }
    );
  });
});

//Get all messages
app.get("/api/msg", (_req, res) => {
  client
    .db("friendbook-messages")
    .collection("messages")
    .find({})
    .toArray(function (err, msgs) {
      if (err) throw err;

      res.status(200).send(msgs);
    });
});

//Get all messages from id
app.get("/api/msg/usr/:id", (req, res) => {
  client
    .db("friendbook-messages")
    .collection("messages")
    .find({ userid: req.params.id })
    .toArray(function (err, msgs) {
      if (err) throw err;

      res.status(200).send(msgs);
    });
});
app.get("/api/msg/getid", (req, res) => {
  client
    .db("friendbook-messages")
    .collection("messages")
    .findOne({
      username: req.body.username,
      time: req.body.time,
      date: req.body.date,
      title: req.body.title,
      message: req.body.message,
    })
    .then((ans) => res.status(200).send(ans._id));
});
//Post a message
app.post("/api/msg/:id", (req, res) => {
  client
    .db("friendbook-messages")
    .collection("messages")
    .insertOne({
      userid: req.params.id,
      username: req.body.name,
      date: req.body.date,
      time: req.body.time,
      title: req.body.title,
      message: req.body.message,
    })
    .then(res.status(200).send());
});

//Delete a message
app.delete("/api/msg/:id", (req, res) => {
  client
    .db("friendbook-messages")
    .collection("messages")
    .deleteOne({_id: ObjectId(req.params.id)})
    .then(res.status(200).send());
});
