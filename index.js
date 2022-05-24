const express = require('express');
const app = express();
const PORT = 8081;
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log('Listening on ' + PORT));

let messages = {
    1: {
        title: "Trying out Friendbook!",
        message: "This website is amazing!",
        userid: 1,
        date: "30/03/2022",
        time: "13:36:00"
    },
    2: {
        title: "First Post!",
        message: "This is my first post, hope to see more!",
        userid: 1,
        date: "30/03/2022",
        time: "14:36:00"
    },
}

//Get all messages
app.get('/api/msg', (_req, res) => {
    res.status(200).send(messages);
});

//Get a message by ID
app.get('/api/msg/:id', (req, res) => {
    var message = messages[req.params.id]

    if(!!message) {
        res.status(200).send(message);
    }
    else
    {
        throw Error('Message by id ' + req.params.id + ' does not exist');
    }
});

//Post a message
app.post('/api/msg', (req, res) => {
    if(!!req.body.message && !!req.body.userid && !!req.body.date && !!req.body.time) {
        var newMessage = {
            title: req.body.title,
            message: req.body.message,
            userid: req.body.userid,
            date: req.body.date,
            time: req.body.time
        }

        messages[Object.keys(messages).length+1] = newMessage;
        res.status(200).send();
    }
    else
    {
        throw new Error('Missing parameter');
    }
});

//Delete a message
app.delete('/api/msg/:id', (req, res) => {
    if(!!messages[req.params.id]) {
        delete messages[req.params.id]
        res.status(200).send();
    }
    else
    {
        throw new Error('Message with ID ' + req.params.id + ' does not exist.');
    }
})