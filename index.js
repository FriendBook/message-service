const express = require('express');
const app = express();
const PORT = 8081;

app.use(express.json())

app.listen(PORT, () => console.log('It\'s alive on: http://localhost:' + PORT))

let messages = {
    1: {
        message: "test",
        userid: 1,
        date: "30/03/2022",
        time: "13:36:00"
    },
    2: {
        message: "double test",
        userid: 1,
        date: "30/03/2022",
        time: "14:36:00"
    },
}

//Get all messages
app.get('/msg', (req, res) => {
    res.status(200).send(messages);
});

//Get a message by ID
app.get('/msg/:id', (req, res) => {
    var message = messages[req.params.id]

    if(!!message) {
        res.status(200).send(message);
        return
    }
    else
    {
        throw 'Message by id ' + req.params.id + ' does not exist';
        return
    }
});

//Post a message
app.post('/msg', (req, res) => {
    if(!!req.body.message && !!req.body.userid && !!req.body.date && !!req.body.time) {
        var newMessage = {
            message: req.body.message,
            userid: req.body.userid,
            date: req.body.date,
            time: req.body.time
        }

        messages[Object.keys(messages).length+1] = newMessage;
        res.status(200).send(messages);
    }
    else
    {
        throw 'Missing parameter'
    }
});

//Delete a message
app.delete('/msg/:id', (req, res) => {
    if(!!messages[req.params.id]) {
        delete messages[req.params.id]
        res.status(200).send(messages)
    }
    else
    {
        throw 'Message with ID ' + req.params.id + ' does not exist.'
    }
})