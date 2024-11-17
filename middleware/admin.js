const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (err) {
    console.error('Error in admin middleware:', err);
    res.status(500).send('Server Error');
  }
};
