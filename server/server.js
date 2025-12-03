const express = require('express');
const sequelize = require('./db');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Note = require('./models/Note');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv').config();
require('./authentication.js');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 8080;

User.hasMany(Subject, { foreignKey: 'userId' });
Subject.belongsTo(User, { foreignKey: 'userId' });

Subject.hasMany(Note, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
Note.belongsTo(Subject, { foreignKey: 'subjectId' });

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('The connection with the database is a success.');
    await sequelize.sync({ alter: true });
    console.log('Models have been synchronized with the database.');
  } catch (error) {
    console.error('Error connecting/syncing with the database: ', error);
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get('/api/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:5173/login?error=true',
    session: false
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.redirect(`http://localhost:5173/auth-success?token=${token}`);
  }
);

app.get('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      where: { userId: req.user.id }
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const { name, professor, description } = req.body;
    const newSubject = await Subject.create({
      name,
      professor,
      description,
      userId: req.user.id
    });
    res.json(newSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subjects/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Subject.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    if (result) res.json({ message: "Subject deleted" });
    else res.status(404).json({ message: "Subject not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subjects/:subjectId/notes', authenticateToken, async (req, res) => {
  try {
    const subject = await Subject.findOne({ 
      where: { id: req.params.subjectId, userId: req.user.id } 
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const notes = await Note.findAll({
      where: { subjectId: req.params.subjectId }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects/:subjectId/notes', authenticateToken, async (req, res) => {
  try {
    const subject = await Subject.findOne({ 
      where: { id: req.params.subjectId, userId: req.user.id } 
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const { title, content, tags } = req.body;
    const newNote = await Note.create({
      title,
      content,
      tags,
      subjectId: req.params.subjectId
    });
    res.json(newNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Note.destroy({
            where: { id: req.params.id }
        });
        if (result) res.json({ message: "Note deleted" });
        else res.status(404).json({ message: "Note not found" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`The server is on port ${PORT}`);
  setupDatabase();
});