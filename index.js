require('dotenv').config();

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const randomString = require('randomstring');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let users = [];
let logs = [];

function findUserById(id) {
  return users.filter(user => user._id === id)[0];
}

function findUserByUsername(username) {
  return users.filter(user => user.username === username)[0];
}

app.get('/api/users', (_, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let id = randomString.generate(24);

  let user = findUserByUsername(username);

  if (user === undefined) {
    user = {
      "username": username,
      "_id": id,
    };

    users.push(user);
  }

  res.json(user);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let id = req.params._id;
  let user = findUserById(id);

  if (user === undefined) {
    return res.json({ "error": "Incorrect user id" });
  }

  let exercise = Object.assign({}, user);

  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date !== undefined
    && req.body.date !== ''
    && req.body.date.match(/^\d{4}-\d{2}-\d{2}/)
    ? new Date(req.body.date)
    : new Date();

  exercise.description = description;
  exercise.duration = duration * 1;
  exercise.date = date.toDateString();

  logs.push(exercise);

  res.json(exercise);
});

app.get('/api/users/:_id/logs', (req, res) => {
  let id = req.params._id;
  let user = findUserById(id);
  let log = Object.assign({}, user);

  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;

  let results = logs.filter(log => log._id === id);

  if (from !== undefined && from !== '') {
    results = results.filter(log => {
      let minDate = new Date(from);
      let date = new Date(log.date);

      return date >= minDate;
    });
  }

  if (to !== undefined && to !== '') {
    results = results.filter(log => {
      let maxDate = new Date(to);
      let date = new Date(log.date);

      return date <= maxDate;
    });
  }

  if (limit > 0) {
    results = results.splice(0, limit);
  }

  log.count = results.length;
  log.log = results.map(result => {
    return {
      "description": result.description,
      "duration": result.duration,
      "date": result.date,
    };
  });

  res.json(log);
});

app.listen(port, () => {
  console.log('Server running at http://localhost:' + port)
})
