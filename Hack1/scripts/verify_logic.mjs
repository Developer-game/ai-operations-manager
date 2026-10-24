// Verification script to test all 12 checklist items programmatically
import { store } from '../src/lib/store.js';

console.log('=== RUNNING CLUBOPS VERIFICATION CHECKLIST ===');

// Check 1: Mock data cleanup
const orgs = store.getOrganisations();
const users = store.getUsers();
console.log('Orgs count:', orgs.length, 'Users count:', users.length);
console.log('Orgs:', orgs.map(o => o.name));
console.log('Users:', users.map(u => `${u.fullName} (${u.email})`));

// Check 2: Organiser Key Validation & Rate Limiting
console.log('\n--- Testing Organiser Keys ---');
const emptyRes = store.redeemKey('', { email: 'test@imperial.ac.uk', fullName: 'Test', societyName: 'Test Society' });
console.log('Empty key result:', emptyRes);

const wrongRes = store.redeemKey('WRONG-KEY', { email: 'test@imperial.ac.uk', fullName: 'Test', societyName: 'Test Society' });
console.log('Wrong key result:', wrongRes);

const usedRes = store.redeemKey('DEMO-KEY-2026', { email: 'test@imperial.ac.uk', fullName: 'Test', societyName: 'Test Society' });
console.log('Used key result:', usedRes);

// Test rate limiting: 4 more wrong attempts
for (let i = 0; i < 4; i++) {
  store.redeemKey('WRONG-KEY-' + i, { email: 't@t.com', fullName: 'T', societyName: 'S' });
}
const rateLimitRes = store.redeemKey('ANOTHER-WRONG', { email: 't@t.com', fullName: 'T', societyName: 'S' });
console.log('6th wrong attempt (rate limited):', rateLimitRes);

// Check 3: Role reordering & Hierarchy
console.log('\n--- Testing Role Hierarchy Reorder ---');
const demoOrgId = orgs[0].id;
const initialRoles = store.getRoles(demoOrgId);
console.log('Initial roles order:', initialRoles.map(r => r.name));
if (initialRoles.length >= 2) {
  const roleToMove = initialRoles[initialRoles.length - 1];
  console.log('Moving role up:', roleToMove.name);
  store.moveRole(demoOrgId, roleToMove.id, 'up');
  const reorderedRoles = store.getRoles(demoOrgId);
  console.log('New roles order:', reorderedRoles.map(r => r.name));
}

// Check 4: Member Privacy & API enforcement
console.log('\n--- Testing Member Privacy & API permissions ---');
const demoMember = users.find(u => u.email === 'member@demo.clubops.ac.uk');
const demoOrganiser = users.find(u => u.email === 'sarah.chen@imperial.ac.uk');
if (demoMember) {
  const canMemberView = store.canUserViewMembers(demoMember.id, demoOrgId);
  console.log('Demo Member can view members list:', canMemberView, '(Expected: false)');
}
if (demoOrganiser) {
  const canOrgView = store.canUserViewMembers(demoOrganiser.id, demoOrgId);
  console.log('Demo Organiser can view members list:', canOrgView, '(Expected: true)');
}

// Check 5: Add member & duplicate prevention
console.log('\n--- Testing Add Member & Duplicate Check ---');
const inviteRes1 = store.createInvitation(demoOrgId, 'newstudent@imperial.ac.uk');
console.log('New invite result:', inviteRes1.success, inviteRes1.message);
const duplicateRes = store.createInvitation(demoOrgId, 'newstudent@imperial.ac.uk');
console.log('Duplicate invite result:', duplicateRes.success, duplicateRes.message);

// Check 6: Acceptance of invite
if (inviteRes1.invitation) {
  const acceptRes = store.acceptInvitation(inviteRes1.invitation.token, { fullName: 'New Student', email: 'newstudent@imperial.ac.uk' });
  console.log('Accept invite result:', acceptRes.success, acceptRes.message);
  const roster = store.getMembersAndInvites(demoOrgId);
  const found = roster.find(m => m.user.email === 'newstudent@imperial.ac.uk');
  console.log('Newly joined member status in roster:', found ? found.status : 'Not found');
}

console.log('\n=== LOGIC TESTS COMPLETED ===');
