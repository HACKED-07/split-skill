import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SKILL_NAMES = [
  'React', 'Node.js', 'Python', 'Django', 'Figma', 'UI/UX', 'Java', 'C++', 'SQL', 'Excel',
  'Public Speaking', 'Writing', 'Photography', 'Cooking', 'Guitar', 'Piano', 'French', 'Spanish', 'Marketing', 'SEO',
  'AWS', 'Docker', 'Kubernetes', 'Go', 'Swift', 'Kotlin', 'Ruby', 'PHP', 'HTML', 'CSS',
  'JavaScript', 'TypeScript', 'Linux', 'Networking', 'Machine Learning', 'Data Science', 'Blockchain', 'Cybersecurity', 'Sales', 'Negotiation',
  'Leadership', 'Teamwork', 'Time Management', 'Project Management', 'Agile', 'Scrum', 'Testing', 'DevOps', 'Cloud', 'AI'
];

async function main() {
  // 1. Create 50 users
  const users = [];
  for (let i = 1; i <= 50; i++) {
    const user = await prisma.user.create({
      data: {
        name: `User${i}`,
        email: `user${i}@example.com`,
        password: await bcrypt.hash('password', 10),
        location: `City${(i % 10) + 1}`,
        image: '',
        availability: ['Weekdays', 'Weekends', 'Evenings', 'Mornings'][i % 4],
        isPublic: true,
        role: 'USER',
      },
    });
    users.push(user);
  }

  // 2. Create 100 skills (2 per user)
  const skills = [];
  for (let i = 0; i < 100; i++) {
    const user = users[i % users.length];
    const skill = await prisma.skill.create({
      data: {
        name: SKILL_NAMES[i % SKILL_NAMES.length],
        type: i % 2 === 0 ? 'OFFERED' : 'WANTED',
        userId: user.id,
        approved: true,
      },
    });
    skills.push(skill);
  }

  // 3. Create 50 swaps (random pairs)
  const swaps = [];
  for (let i = 0; i < 50; i++) {
    const fromUser = users[i % users.length];
    let toUser = users[(i + 1) % users.length];
    if (fromUser.id === toUser.id) toUser = users[(i + 2) % users.length];
    const offeredSkill = skills[i * 2];
    const wantedSkill = skills[i * 2 + 1];
    const swap = await prisma.swapRequest.create({
      data: {
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        offeredSkillId: offeredSkill.id,
        wantedSkillId: wantedSkill.id,
        message: `Let's swap ${offeredSkill.name} for ${wantedSkill.name}!`,
        status: 'ACCEPTED',
      },
    });
    swaps.push(swap);
  }

  // 4. Create 100 vouches (randomly distributed)
  for (let i = 0; i < 100; i++) {
    const voucher = users[Math.floor(Math.random() * users.length)];
    let vouched = users[Math.floor(Math.random() * users.length)];
    while (voucher.id === vouched.id) {
      vouched = users[Math.floor(Math.random() * users.length)];
    }
    const swap = swaps[Math.floor(Math.random() * swaps.length)];
    // Prevent duplicate vouches for the same swap/user pair
    const exists = await prisma.vouch.findFirst({
      where: { voucherId: voucher.id, vouchedId: vouched.id, swapId: swap.id },
    });
    if (!exists) {
      await prisma.vouch.create({
        data: {
          voucherId: voucher.id,
          vouchedId: vouched.id,
          swapId: swap.id,
        },
      });
    }
  }

  console.log('Seeded 50 users, 100 skills, 50 swaps, 100 vouches.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); }); 