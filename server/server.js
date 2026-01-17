const express = require('express');
const sequelize = require('./db');

const User = require('./models/user');
const Subject = require('./models/subject');
const Note = require('./models/note');
const Group = require('./models/group');
const GroupMember = require('./models/groupMember'); 
const SharedNote = require('./models/sharedNote');

const passport = require('passport');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

require('dotenv').config();
require('./authentication.js');

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';


app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'https://web-technologies-web-app-for-taking.onrender.com'],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

app.use(express.json());

const uploadsPath = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)){
    fs.mkdirSync(uploadsPath);
}
app.use('/uploads', express.static(uploadsPath));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

const PORT = process.env.PORT || 8080;

User.hasMany(Subject, { foreignKey: 'userId' });
Subject.belongsTo(User, { foreignKey: 'userId' });

Subject.hasMany(Note, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
Note.belongsTo(Subject, { foreignKey: 'subjectId' });

User.belongsToMany(Group, { through: GroupMember });
Group.belongsToMany(User, { through: GroupMember });

Note.belongsToMany(Group, { through: SharedNote });
Group.belongsToMany(Note, { through: SharedNote });

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (error) {
    console.error(error);
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
    failureRedirect: `${process.env.CLIENT_URL}/login?error=true`,
    session: false
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.redirect(`${CLIENT_URL}/auth-success?token=${token}`);
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

app.put('/api/subjects/:id', authenticateToken, async (req, res) => {
    try {
      const subject = await Subject.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
  
      if (!subject) return res.status(404).json({ message: "Subject not found" });
  
      const { name, professor } = req.body;
      subject.name = name;
      subject.professor = professor;
      await subject.save();
  
      res.json(subject);
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

app.post('/api/subjects/:subjectId/notes', authenticateToken, upload.single('attachment'), async (req, res) => {
  try {
    const subject = await Subject.findOne({ 
      where: { id: req.params.subjectId, userId: req.user.id } 
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const { title, content, tags } = req.body;
    let attachmentUrl = null;

  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? SERVER_URL
    : 'http://localhost:8080';

    if (req.file) {
        attachmentUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const newNote = await Note.create({
      title,
      content,
      tags,
      attachmentUrl,
      subjectId: req.params.subjectId
    });
    res.json(newNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findOne({
             where: { id: req.params.id },
             include: { model: Subject, where: { userId: req.user.id } }
        });

        if (!note) return res.status(404).json({ message: "Note not found" });

        const { title, content, tags } = req.body;
        note.title = title;
        note.content = content;
        note.tags = tags;
        await note.save();

        res.json(note);
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

app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: Group
    });
    res.json(user.Groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({ name, description });
    const user = await User.findByPk(req.user.id);
    await group.addUser(user, { through: { role: 'admin' }});
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups/:groupId/members', authenticateToken, async (req, res) => {
    try {
      const group = await Group.findByPk(req.params.groupId);
      
      if (!group) return res.status(404).json({ message: "Group not found" });

      const isMember = await group.hasUser(req.user.id);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });

      const members = await group.getUsers({
          attributes: ['id', 'name', 'email'],
          joinTableAttributes: [] 
      });

      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
});

app.post('/api/groups/:groupId/members', authenticateToken, async (req, res) => {
    try {
      const { email } = req.body;
      const group = await Group.findByPk(req.params.groupId);
      
      if (!group) return res.status(404).json({ message: "Group not found" });

      const isMember = await group.hasUser(req.user.id);
      if (!isMember) return res.status(403).json({ message: "Not authorized" });
  
      const emailCautat = email ? email.trim().toLowerCase() : '';
      const userToAdd = await User.findOne({ where: { email: emailCautat } });

      if (!userToAdd) return res.status(404).json({ message: "User not found" });
  
      await group.addUser(userToAdd);
      res.json({ message: "User added" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

app.post('/api/notes/:noteId/share', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.body;
        const note = await Note.findByPk(req.params.noteId);
        const group = await Group.findByPk(groupId);

        if(!note || !group) return res.status(404).json({message: "Note or Group not found"});

        await group.addNote(note);
        res.json({ message: "Note shared with group" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/groups/:groupId/notes', authenticateToken, async (req, res) => {
    try {
        const group = await Group.findByPk(req.params.groupId, {
            include: Note
        });
        
        const isMember = await group.hasUser(req.user.id);
        if(!isMember) return res.status(403).json({ message: "Not a member" });

        res.json(group.Notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/groups/:groupId/notes/:noteId', authenticateToken, async (req, res) => {
    try {
        const group = await Group.findByPk(req.params.groupId);
        const note = await Note.findByPk(req.params.noteId);

        if (!group || !note) return res.status(404).json({ message: "Group or Note not found" });

        const isMember = await group.hasUser(req.user.id);
        if (!isMember) return res.status(403).json({ message: "Not authorized" });

        await group.removeNote(note);
        
        res.json({ message: "Note removed from group" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`The server is on port ${PORT}`);
  setupDatabase();
});