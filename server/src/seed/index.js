const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');

const SKILLS_DATA = [
  // Programming
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
  // Design
  { name: 'Figma', category: 'Design' },
  { name: 'Photoshop', category: 'Design' },
  { name: 'Illustrator', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Canva', category: 'Design' },
  { name: '3D Modeling', category: 'Design' },
  // Music
  { name: 'Guitar', category: 'Music' },
  { name: 'Piano', category: 'Music' },
  { name: 'Vocals', category: 'Music' },
  { name: 'Music Production', category: 'Music' },
  { name: 'Violin', category: 'Music' },
  { name: 'Drums', category: 'Music' },
  // Languages
  { name: 'French', category: 'Languages' },
  { name: 'Spanish', category: 'Languages' },
  { name: 'Japanese', category: 'Languages' },
  { name: 'German', category: 'Languages' },
  { name: 'Mandarin', category: 'Languages' },
  { name: 'Tamil', category: 'Languages' },
  { name: 'Hindi', category: 'Languages' },
  // Finance
  { name: 'Stock Trading', category: 'Finance' },
  { name: 'Personal Finance', category: 'Finance' },
  { name: 'Accounting', category: 'Finance' },
  { name: 'Excel', category: 'Finance' },
  { name: 'Crypto Basics', category: 'Finance' },
  // Fitness
  { name: 'Yoga', category: 'Fitness' },
  { name: 'Nutrition Planning', category: 'Fitness' },
  { name: 'Personal Training', category: 'Fitness' },
  { name: 'Meditation', category: 'Fitness' },
  // Creative
  { name: 'Photography', category: 'Creative' },
  { name: 'Video Editing', category: 'Creative' },
  { name: 'Creative Writing', category: 'Creative' },
  { name: 'Drawing', category: 'Creative' },
  { name: 'Watercolor', category: 'Creative' },
  // Business
  { name: 'Public Speaking', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'SEO', category: 'Business' },
  { name: 'Copywriting', category: 'Business' },
  { name: 'Product Management', category: 'Business' },
  // Life Skills
  { name: 'Cooking', category: 'Life Skills' },
  { name: 'Driving', category: 'Life Skills' },
  { name: 'First Aid', category: 'Life Skills' },
  { name: 'Time Management', category: 'Life Skills' },
  { name: 'Journaling', category: 'Life Skills' },
  // Academic
  { name: 'Math Tutoring', category: 'Academic' },
  { name: 'Physics', category: 'Academic' },
  { name: 'Chemistry', category: 'Academic' },
  { name: 'History', category: 'Academic' },
  { name: 'Essay Writing', category: 'Academic' }
];

const DEMO_USERS = [
  {
    fullName: 'Alex Johnson',
    email: 'alex@demo.com',
    password: 'Demo@123',
    dob: new Date('1998-05-15'),
    gender: 'Male',
    mobile: '9876543210',
    preferredLanguage: 'en',
    location: 'Chennai',
    reputationScore: 4.5,
    teachSkills: [
      { name: 'JavaScript', level: 'Expert' },
      { name: 'React', level: 'Expert' }
    ],
    learnSkills: ['Python', 'Guitar']
  },
  {
    fullName: 'Priya Sharma',
    email: 'priya@demo.com',
    password: 'Demo@123',
    dob: new Date('1999-08-22'),
    gender: 'Female',
    mobile: '9876543211',
    preferredLanguage: 'hi',
    location: 'Mumbai',
    reputationScore: 4.2,
    teachSkills: [
      { name: 'Python', level: 'Expert' },
      { name: 'SQL', level: 'Intermediate' }
    ],
    learnSkills: ['JavaScript', 'Yoga']
  },
  {
    fullName: 'Karthik Rajan',
    email: 'karthik@demo.com',
    password: 'Demo@123',
    dob: new Date('1997-03-10'),
    gender: 'Male',
    mobile: '9876543212',
    preferredLanguage: 'ta',
    location: 'Coimbatore',
    reputationScore: 4.8,
    teachSkills: [
      { name: 'Guitar', level: 'Expert' },
      { name: 'Music Production', level: 'Intermediate' }
    ],
    learnSkills: ['React', 'French']
  },
  {
    fullName: 'Deepa Lakshmi',
    email: 'deepa@demo.com',
    password: 'Demo@123',
    dob: new Date('2000-11-05'),
    gender: 'Female',
    mobile: '9876543213',
    preferredLanguage: 'en',
    location: 'Bangalore',
    reputationScore: 3.8,
    teachSkills: [
      { name: 'Yoga', level: 'Expert' },
      { name: 'Meditation', level: 'Expert' }
    ],
    learnSkills: ['Python', 'Photography']
  },
  {
    fullName: 'Rahul Verma',
    email: 'rahul@demo.com',
    password: 'Demo@123',
    dob: new Date('1996-07-18'),
    gender: 'Male',
    mobile: '9876543214',
    preferredLanguage: 'en',
    location: 'Delhi',
    reputationScore: 4.0,
    teachSkills: [
      { name: 'Photography', level: 'Expert' },
      { name: 'Video Editing', level: 'Intermediate' }
    ],
    learnSkills: ['Guitar', 'JavaScript']
  }
];

const seedDatabase = async () => {
  try {
    // Check if already seeded
    const skillCount = await Skill.countDocuments();
    if (skillCount > 0) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    console.log('Seeding database...');

    // Insert skills
    const skills = await Skill.insertMany(SKILLS_DATA);
    console.log(`Inserted ${skills.length} skills`);

    // Create skill name to ID map
    const skillMap = {};
    skills.forEach(s => { skillMap[s.name] = s._id; });

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      fullName: 'Admin User',
      email: 'admin@skillswap.com',
      passwordHash: adminPasswordHash,
      dob: new Date('1990-01-01'),
      gender: 'Male',
      mobile: '9999999999',
      preferredLanguage: 'en',
      location: 'Platform',
      role: 'admin',
      reputationScore: 5.0,
      skillSetupComplete: true
    });
    console.log('Admin user created: admin@skillswap.com / Admin@123');

    // Create demo users
    for (const demoUser of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(demoUser.password, 12);
      
      const user = await User.create({
        fullName: demoUser.fullName,
        email: demoUser.email,
        passwordHash,
        dob: demoUser.dob,
        gender: demoUser.gender,
        mobile: demoUser.mobile,
        preferredLanguage: demoUser.preferredLanguage,
        location: demoUser.location,
        reputationScore: demoUser.reputationScore,
        skillSetupComplete: true
      });

      // Add teach skills
      for (const skill of demoUser.teachSkills) {
        await UserSkill.create({
          userId: user._id,
          skillId: skillMap[skill.name],
          skillName: skill.name,
          type: 'teach',
          experienceLevel: skill.level,
          isVerified: true,
          validationScore: 85
        });
      }

      // Add learn skills
      for (const skillName of demoUser.learnSkills) {
        await UserSkill.create({
          userId: user._id,
          skillId: skillMap[skillName],
          skillName: skillName,
          type: 'learn',
          experienceLevel: 'Beginner'
        });
      }

      console.log(`Demo user created: ${demoUser.email} / ${demoUser.password}`);
    }

    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = seedDatabase;
