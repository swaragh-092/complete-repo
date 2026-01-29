// const express = require('express');
// const router = express.Router();
// const  asyncHandler  = require('../middleware/asyncHandler');
// const { authMiddleware } = require('../middleware/authMiddleware');
// const crypto = require('crypto');


// const { Invitation, OrganizationMembership, Role, PendingInvitation, UserMetadata, Organization , Permission,Sequelize} = require('../config/database');
// const { log } = require('console');
// const { loggers } = require('winston');

// router.post('/send', authMiddleware, asyncHandler(async (req, res)=> {
//     const { email, org_id, role_id } = req.body;
//     const userId = req.user.id;

//     loggers.get('default').info(`User ${userId} is sending an invitation to ${email} for organization ${org_id} with role ${role_id}`);

//     // check user is authorized to send invitation
//     const inviterUser = await UserMetadata.findOne({ where: { keycloak_id: userId } });
//     if (!inviterUser) {
//         return res.status(403).json({ message: 'Inviter user not found' });
//     }

//     const inviterMembership = await OrganizationMembership.findOne({ where: { user_id: inviterUser.id, org_id, status: 'active' }, include: [{model: Role, attributes: ['name'], 
//         include: [{model: Permission, as: 'permissions', where: {name: 'members:invite'}}]
//     }]});

//     if (!inviterMembership) {
//         return res.status(403).json({ message: 'You do not have permission to invite members to this organization' });
//     }

//     const existingMember = await OrganizationMembership.findOne({where: { org_id}, 
//         include: [{model: UserMetadata, where: { email }}])

//         if(existingMember){
//             return res.status(400).json({ message: 'User is already a member of the organization' });
//         }

//     // check if invitation already exists
//       const existingInvitation = await Invitation.findOne({
//     where: { 
//       org_id,
//       invited_email: email,
//       status: 'pending'
//     }
//   });

//      if (existingInvitation) {
//     return res.status(409).json({ 
//       error: 'Already invited',
//       message: 'An invitation has already been sent to this email',
//       invitation_id: existingInvitation.id
//     });
//   }

//     // create invitation
//     const invitationCode = Invitation.generateCode();
//     const codeHash = Invitation.hashCode(invitationCode);

//     const invitation = await Invitation.create({
//         org_id,
//         invited_email: email,
//         role_id,
//         invited_by: inviterUser.id,
//         code_hash: codeHash,
//         status: 'pending',
//         // created_at: new Date(),
//         expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // expires in 7 days
//     })

//     const organization = await Organization.findByPk(org_id);
//     const role = await Role.findByPk(role_id);

//     setImmediate(())




    
// }))


