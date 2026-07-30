const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Allow credentials for session
app.use(express.json());

const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/partes-app')
    .then(async () => {
        console.log('MongoDB Connected');
        // Seed default user
        const User = require('./models/User');
        try {
            const admin = await User.findOne({ username: 'admin' });
            if (!admin) {
                const newAdmin = new User({ username: 'admin', password: 'password123', role: 'admin' });
                await newAdmin.save();
                console.log('Default user "admin" created');
            }
        } catch (err) {
            console.error('Error seeding user:', err);
        }
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const partesRoutes = require('./routes/partes');

app.use('/api/auth', authRoutes);
app.use('/api/partes', partesRoutes);

app.get('/', (req, res) => {
    res.send('Partes App Backend Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
