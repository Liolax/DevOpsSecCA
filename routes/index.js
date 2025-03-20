import express from 'express';
import { check, validationResult } from 'express-validator';

const router = express.Router();

router.get('/', (_, res) => {
  res.send('Welcome!');
});

// GET home page with input validation
router.get('/home', [
  // Validate that title is not purely numeric.
  check('title').custom(value => {
    if (!isNaN(value)) {
      throw new Error('Title must be a string');
    }
    return true;
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return a 400 response with the validation errors as JSON.
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Render the home view with the provided title or default text.
  const title = req.query.title || 'Simple Application';
  res.render('index', { title });
});

export default router;
