const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');

const SKILLS_DATA = [
  { name: 'JavaScript', category: 'Programming' },
  { name: 'Python', category: 'Programming' },
  { name: 'Java', category: 'Programming' },
  { name: 'C++', category: 'Programming' },
  { name: 'React', category: 'Programming' },
  { name: 'Node.js', category: 'Programming' },
  { name: 'SQL', category: 'Programming' },
  { name: 'TypeScript', category: 'Programming' },
  { name: 'Go', category: 'Programming' },
  { name: 'Rust', category: 'Programming' },
  { name: 'Figma', category: 'Design' },
  { name: 'Photoshop', category: 'Design' },
  { name: 'Illustrator', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Canva', category: 'Design' },
  { name: '3D Modeling', category: 'Design' },
  { name: 'Guitar', category: 'Music' },
  { name: 'Piano', category: 'Music' },
  { name: 'Vocals', category: 'Music' },
  { name: 'Music Production', category: 'Music' },
  { name: 'Violin', category: 'Music' },
  { name: 'Drums', category: 'Music' },
  { name: 'French', category: 'Languages' },
  { name: 'Spanish', category: 'Languages' },
  { name: 'Japanese', category: 'Languages' },
  { name: 'German', category: 'Languages' },
  { name: 'Mandarin', category: 'Languages' },
  { name: 'Tamil', category: 'Languages' },
  { name: 'Hindi', category: 'Languages' },
  { name: 'Stock Trading', category: 'Finance' },
  { name: 'Personal Finance', category: 'Finance' },
  { name: 'Accounting', category: 'Finance' },
  { name: 'Excel', category: 'Finance' },
  { name: 'Crypto Basics', category: 'Finance' },
  { name: 'Yoga', category: 'Fitness' },
  { name: 'Nutrition Planning', category: 'Fitness' },
  { name: 'Personal Training', category: 'Fitness' },
  { name: 'Meditation', category: 'Fitness' },
  { name: 'Photography', category: 'Creative' },
  { name: 'Video Editing', category: 'Creative' },
  { name: 'Creative Writing', category: 'Creative' },
  { name: 'Drawing', category: 'Creative' },
  { name: 'Watercolor', category: 'Creative' },
  { name: 'Public Speaking', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'SEO', category: 'Business' },
  { name: 'Copywriting', category: 'Business' },
  { name: 'Product Management', category: 'Business' },
  { name: 'Cooking', category: 'Life Skills' },
  { name: 'Driving', category: 'Life Skills' },
  { name: 'First Aid', category: 'Life Skills' },
  { name: 'Time Management', category: 'Life Skills' },
  { name: 'Journaling', category: 'Life Skills' },
  { name: 'Math Tutoring', category: 'Academic' },
  { name: 'Physics', category: 'Academic' },
  { name: 'Chemistry', category: 'Academic' },
  { name: 'History', category: 'Academic' },
  { name: 'Essay Writing', category: 'Academic' }
];


const DEMO_USERS = [
  { fullName: 'Alex Johnson', email: 'alex@demo.com', password: 'Demo@123', dob: '1998-05-15', gender: 'Male', mobile: '9876543210', preferredLanguage: 'en', location: 'Chennai', reputationScore: 4.5, teachSkills: [{ name: 'JavaScript', level: 'Expert' }, { name: 'React', level: 'Expert' }], learnSkills: ['Python', 'Guitar'] },
  { fullName: 'Priya Sharma', email: 'priya@demo.com', password: 'Demo@123', dob: '1999-08-22', gender: 'Female', mobile: '9876543211', preferredLanguage: 'hi', location: 'Mumbai', reputationScore: 4.2, teachSkills: [{ name: 'Python', level: 'Expert' }, { name: 'SQL', level: 'Intermediate' }], learnSkills: ['JavaScript', 'Yoga'] },
  { fullName: 'Karthik Rajan', email: 'karthik@demo.com', password: 'Demo@123', dob: '1997-03-10', gender: 'Male', mobile: '9876543212', preferredLanguage: 'ta', location: 'Coimbatore', reputationScore: 4.8, teachSkills: [{ name: 'Guitar', level: 'Expert' }, { name: 'Music Production', level: 'Intermediate' }], learnSkills: ['React', 'French'] },
  { fullName: 'Deepa Lakshmi', email: 'deepa@demo.com', password: 'Demo@123', dob: '2000-11-05', gender: 'Female', mobile: '9876543213', preferredLanguage: 'en', location: 'Bangalore', reputationScore: 3.8, teachSkills: [{ name: 'Yoga', level: 'Expert' }, { name: 'Meditation', level: 'Expert' }], learnSkills: ['Python', 'Photography'] },
  { fullName: 'Rahul Verma', email: 'rahul@demo.com', password: 'Demo@123', dob: '1996-07-18', gender: 'Male', mobile: '9876543214', preferredLanguage: 'en', location: 'Delhi', reputationScore: 4.0, teachSkills: [{ name: 'Photography', level: 'Expert' }, { name: 'Video Editing', level: 'Intermediate' }], learnSkills: ['Guitar', 'JavaScript'] }
];

const seedDatabase = async () => {
  try {
    const skillCount = await Skill.count();
    if (skillCount > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    console.log('Seeding database...');

    // Insert skills
    const skills = await Skill.bulkCreate(SKILLS_DATA);
    console.log(`Inserted ${skills.length} skills`);

    // Build skill name to ID map
    const allSkills = await Skill.findAll();
    const skillMap = {};
    allSkills.forEach(s => { skillMap[s.name] = s.id; });

    // Create admin user
    const adminHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      fullName: 'Admin User', email: 'admin@skillswap.com', passwordHash: adminHash,
      dob: '1990-01-01', gender: 'Male', mobile: '9999999999',
      preferredLanguage: 'en', location: 'Platform', role: 'admin',
      reputationScore: 5.0, skillSetupComplete: true
    });
    console.log('Admin: admin@skillswap.com / Admin@123');

    // Create demo users
    for (const demo of DEMO_USERS) {
      const hash = await bcrypt.hash(demo.password, 12);
      const user = await User.create({
        fullName: demo.fullName, email: demo.email, passwordHash: hash,
        dob: demo.dob, gender: demo.gender, mobile: demo.mobile,
        preferredLanguage: demo.preferredLanguage, location: demo.location,
        reputationScore: demo.reputationScore, skillSetupComplete: true
      });

      for (const skill of demo.teachSkills) {
        await UserSkill.create({
          userId: user.id, skillId: skillMap[skill.name], skillName: skill.name,
          type: 'teach', experienceLevel: skill.level, isVerified: true, validationScore: 85
        });
      }

      for (const skillName of demo.learnSkills) {
        await UserSkill.create({
          userId: user.id, skillId: skillMap[skillName], skillName: skillName,
          type: 'learn', experienceLevel: 'Beginner'
        });
      }
      console.log(`Demo: ${demo.email} / ${demo.password}`);
    }

    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Seeding error:', error.message);
  }
};

module.exports = seedDatabase;
