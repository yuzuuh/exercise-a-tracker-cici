'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Conectar MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MODELOS -------------------------

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// RUTAS FCC ------------------------

// Crear usuario
app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  const user = new User({ username });
  await user.save();

  res.json({
    username: user.username,
    _id: user._id,
  });
});

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Agregar ejercicio
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.json({ error: 'User not found' });

  const realDate = date ? new Date(date) : new Date();

  const exercise = new Exercise({
    userId,
    description,
    duration: Number(duration),
    date: realDate,
  });

  await exercise.save();

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id,
  });
});

// Obtener logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = await User.findById(userId);
  if (!user) return res.json({ error: 'User not found' });

  const filter = { userId };

  let fromDate, toDate;
  if (from) fromDate = new Date(from);
  if (to) toDate = new Date(to);

  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = fromDate;
    if (toDate) filter.date.$lte = toDate;
  }

  let query = Exercise.find(filter);

  if (limit) query = query.limit(Number(limit));

  const exercises = await query.exec();

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    })),
  });
});

// Puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Exercise Tracker running on port ${PORT}`);
});
