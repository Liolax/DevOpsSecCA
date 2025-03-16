import express from 'express';
const router = express.Router();

// Define the routes
router.get('/', (_, res) => {
  res.send('Welcome!');
});

/* GET home page. */
router.get('/home', function(_, res) {
  res.render('index', { title: "Simple Application" });
});

// Export the router as a default export
export default router;