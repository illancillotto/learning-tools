const bcrypt = require('bcryptjs');

const defaultUser = {
  username: 'ilProf',
  password: 'questaPasswordNonEsiste', // This will be hashed before saving
  role: 'admin'
};

module.exports = defaultUser;