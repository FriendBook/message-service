const express = require("express");
const app = express();
const PORT = 8081;
const cors = require("cors");
const amqp = require("amqplib/callback_api");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const Keycloak = require("keycloak-connect");

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log("Listening on " + PORT));

const kcConfig = {
  clientId: "react-auth",
  bearerOnly: true,
  serverUrl: "http://localhost:8080/auth/",
  realm: "Friendbook",
  realmPublicKey:
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi60VZKmGbOEmHJgV2nTylCNjzyLa1DRKDChAoPgWGbURzer1Ba8mivPOlxP2+wr+w/cNcagz4n+N3+03kMa7XEPhzh5C6rMQh38Dw9S43QRF3hbv88sqaweG0KvD5NOrlYLJmJ6RGb2fH6dC0IQ4JkBhtQ6Wa3kt0Omum8f7aLR5BmmEkK77/ebFtoUNPVASP9Y8LR0fO8TjcZwf6OGShI6BOYAtHdErg6lPPIzR2EYg0JR8wCT96zQv0DV9OCyaDqRXaEb2G8fatNxGOWNBG7xTxUgidNxM/BAD22DqTYXm56JF4DchSPU63Mqd3z7wsUG9KjfQSEVgPbsGhEU4cQIDAQAB",
};

const memoryStore = new session.MemoryStore();
const keycloak = new Keycloak({ store: memoryStore }, kcConfig);

let secret = [
  "-----BEGIN PUBLIC KEY-----",
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi60VZKmGbOEmHJgV2nTylCNjzyLa1DRKDChAoPgWGbURzer1Ba8mivPOlxP2+wr+w/cNcagz4n+N3+03kMa7XEPhzh5C6rMQh38Dw9S43QRF3hbv88sqaweG0KvD5NOrlYLJmJ6RGb2fH6dC0IQ4JkBhtQ6Wa3kt0Omum8f7aLR5BmmEkK77/ebFtoUNPVASP9Y8LR0fO8TjcZwf6OGShI6BOYAtHdErg6lPPIzR2EYg0JR8wCT96zQv0DV9OCyaDqRXaEb2G8fatNxGOWNBG7xTxUgidNxM/BAD22DqTYXm56JF4DchSPU63Mqd3z7wsUG9KjfQSEVgPbsGhEU4cQIDAQAB",
  "-----END PUBLIC KEY-----",
].join("\n");

const uri =
  "mongodb+srv://admin:admin@friendbook.ac2qv.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
client.connect();

amqp.connect("amqp://rabbitmq:5672", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    channel.assertQueue("posts", {
      durable: false,
    });

    channel.consume(
      "posts",
      function (msg) {
        const operation = JSON.parse(msg.content);
        switch (operation.type) {
          case "update":
            client
              .db("friendbook-messages")
              .collection("messages")
              .updateMany(
                { userid: operation.id },
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
    .toArray(function (err, messages) {
      if (err) throw err;

      res.status(200).send(messages);
    });
});
app.get("/api/msg/getid", (req, res) => {
  client
    .db("friendbook-messages")
    .collection("messages")
    .findOne({
      username: req.body.username.toString(),
      time: req.body.time.toString(),
      date: req.body.date.toString(),
      title: req.body.title.toString(),
      message: req.body.message.toString(),
    })
    .then((ans) => res.status(200).send(ans._id));
});
//Post a message
app.post("/api/msg/:id", (req, res) => {
  jwt.verify(
    req.headers.authorization.replace("Bearer ", ""),
    secret,
    { algorithms: ["RS256"] },
    function (err, decoded) {
      if (err) {
        throw err;
      }
      client
        .db("friendbook-messages")
        .collection("messages")
        .insertOne({
          userid: req.params.id.toString(),
          username: req.body.name.toString(),
          date: req.body.date.toString(),
          time: req.body.time.toString(),
          title: req.body.title.toString(),
          message: req.body.message.toString(),
        })
        .then(res.status(200).send());
    }
  );
});

//Delete a message
app.delete("/api/msg/:id", (req, res) => {
  jwt.verify(
    req.headers.authorization.replace("Bearer ", ""),
    secret,
    { algorithms: ["RS256"] },
    function (err, decoded) {
      if (err) {
        throw err;
      }
      if (decoded.realm_access.roles.includes("admin")) {
        client
          .db("friendbook-messages")
          .collection("messages")
          .deleteOne({ _id: ObjectId(req.params.id) })
          .then(res.status(200).send());
      }
    }
  );
});
