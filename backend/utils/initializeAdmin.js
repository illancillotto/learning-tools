const User = require('../models/User');

const defaultAdmin = {
  username: 'ilProf',
  password: 'questaPasswordNonEsiste',
  role: 'admin'
};

async function initializeAdmin() {
  try {
    const adminExists = await User.findOne({ username: defaultAdmin.username });
    
    if (!adminExists) {
      const admin = new User({
        username: defaultAdmin.username,
        password: defaultAdmin.password,
        role: defaultAdmin.role
      });
      
      await admin.save();
      console.log('Default admin user created:');
      console.log('Username:', defaultAdmin.username);
      console.log('Password:', defaultAdmin.password);
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

module.exports = initializeAdmin;