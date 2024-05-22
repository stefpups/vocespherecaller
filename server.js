// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const authRoutes = require("./routes/authRoutes");
const leadListRoutes = require('./routes/leadListRoutes'); // Added for lead list upload functionality
const apiRoutes = require('./routes/apiRoutes'); // Added for AI script suggestions and saving
const scheduleRoutes = require('./routes/scheduleRoutes'); // Added for call scheduling functionality
const subscriptionRoutes = require('./routes/subscriptionRoutes'); // Added for subscription management functionality
const aiTrainingRoutes = require('./routes/aiTrainingRoutes'); // Added for AI training functionality
const analyticsRoutes = require('./routes/analyticsRoutes'); // Added for analytics dashboard functionality
const aiFeedbackRoutes = require('./routes/aiFeedbackRoutes'); // Added for AI feedback functionality
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger'); // Assuming logger utility is implemented in utils/logger.js

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  logger.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setting the templating engine to EJS
app.set("view engine", "ejs");

// Serve static files
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    logger.log("Database connected successfully");
  })
  .catch((err) => {
    logger.error(`Database connection error: ${err.message}`, err.stack);
    process.exit(1);
  });

// Session configuration with connect-mongo
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  }),
);

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  process.exit(1); // Exiting the process after logging the uncaught exception
});

// Global handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, reason.stack);
  process.exit(1); // Exiting the process after logging the unhandled rejection
});

// Logging session creation and destruction
app.use((req, res, next) => {
  const sess = req.session;
  // Make session available to all views
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    logger.log("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    logger.log(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

// Authentication Routes
app.use(authRoutes);

// Lead List Routes - for uploading lead lists
app.use(leadListRoutes);

// API Routes - for AI script suggestions and saving and scheduling calls
app.use('/api', apiRoutes);
app.use('/api', scheduleRoutes);

// Subscription Routes - for managing subscriptions
app.use('/subscription', subscriptionRoutes);

// AI Training Routes - for uploading training data and training AI models
app.use('/api', aiTrainingRoutes);

// Analytics Routes - for viewing campaign analytics
app.use('/api', analyticsRoutes);

// AI Feedback Routes - for submitting and analyzing AI feedback
app.use('/api', aiFeedbackRoutes);

// Root path response
app.get("/", (req, res) => {
  res.render("index");
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Unhandled application error: ${err.message}`, err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  logger.log(`Server running at http://localhost:${port}`);
});