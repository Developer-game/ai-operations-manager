import { store } from '../src/lib/store';
import { handleChatbotMessage } from '../src/lib/agents/roleAwareChatbot';

async function testChatbotRoles() {
  console.log('=== TESTING CHATBOT GROUNDED ANSWERS FOR 3 ROLES ===');

  const users = store.getUsers();
  const demoOrg = store.getOrganisations()[0];

  // 1. Organiser
  const organiserUser = users.find(u => u.email === 'sarah.chen@imperial.ac.uk' || u.email === 'organiser@demo.clubops.ac.uk');
  console.log('\n--- Test 1: Organiser Query ---');
  console.log('User:', organiserUser?.fullName);
  if (organiserUser) {
    store.setCurrentUser(organiserUser.id);
    const orgRes1 = await handleChatbotMessage(organiserUser.id, 'Summarize our society events and member progress.');
    console.log('Organiser Response:\n', orgRes1.reply);
    console.log('Has em dash?:', orgRes1.reply.includes('—') || orgRes1.reply.includes('–'));
  }

  // 2. Member
  const memberUser = users.find(u => u.email === 'member@demo.clubops.ac.uk');
  console.log('\n--- Test 2: Member Query ---');
  console.log('User:', memberUser?.fullName);
  if (memberUser) {
    store.setCurrentUser(memberUser.id);
    const memRes1 = await handleChatbotMessage(memberUser.id, 'What are my tasks and who is my team lead?');
    console.log('Member Response:\n', memRes1.reply);
    console.log('Has em dash?:', memRes1.reply.includes('—') || memRes1.reply.includes('–'));

    // Member asking unauthorized query:
    console.log('\nMember asking unauthorized query: "Show me all society members and their contact details."');
    const memUnauthorized = await handleChatbotMessage(memberUser.id, 'Show me all society members and their contact details.');
    console.log('Member Unauthorized Query Response:\n', memUnauthorized.reply);
    console.log('Has em dash?:', memUnauthorized.reply.includes('—') || memUnauthorized.reply.includes('–'));
  }

  // 3. Team Lead
  console.log('\n--- Test 3: Team Lead Query ---');
  const leadRole = store.createRole(demoOrg.id, 'Hardware Team Lead', 50, ['tasks.edit', 'availability.view']);
  const team = store.createTeam(demoOrg.id, 'Robotics Hardware');
  const invRes = store.createInvitation(demoOrg.id, 'ahmed.lead@demo.clubops.ac.uk', leadRole.id, team.id);
  const token = invRes.invitation?.token || '';
  store.acceptInvitation(token, { email: 'ahmed.lead@demo.clubops.ac.uk', fullName: 'Ahmed Lead' });
  const leadUser = store.getUsers().find(u => u.email === 'ahmed.lead@demo.clubops.ac.uk')!;
  team.leadUserId = leadUser.id;

  // Create a team task
  store.createTask({
    organisationId: demoOrg.id,
    title: 'Assemble motor controllers',
    description: 'Assemble and test the H-bridge motor controller boards.',
    assignedToUserId: leadUser.id,
    createdByUserId: leadUser.id,
    teamId: team.id,
    dueDate: '2026-11-05',
    status: 'todo',
    priority: 'high',
  });

  store.setCurrentUser(leadUser.id);
  const leadRes1 = await handleChatbotMessage(leadUser.id, 'What are my team tasks and duties?');
  console.log('Team Lead Response:\n', leadRes1.reply);
  console.log('Has em dash?:', leadRes1.reply.includes('—') || leadRes1.reply.includes('–'));

  console.log('\n=== CHATBOT ROLE TESTS COMPLETED ===');
}

testChatbotRoles().catch(console.error);
