import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const onUserCreated = onDocumentCreated({
  document: "users/{userId}",
  region: "us-central1"
}, async (event) => {
  const userData = event.data?.data();
  const userId = event.params.userId;

  if (!userData?.organizationId) {
    logger.info("No organizationId found in user data");
    return;
  }

  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, {
      organizationId: userData.organizationId,
    });
    logger.info("Set custom claims for user", { userId, organizationId: userData.organizationId });

    // Get the General team for this organization
    const teamsRef = admin.firestore().collection('teams');
    const generalTeamQuery = await teamsRef
      .where('organizationId', '==', userData.organizationId)
      .where('isDefault', '==', true)
      .get();

    if (generalTeamQuery.empty) {
      logger.info("No General team found for organization", { organizationId: userData.organizationId });
      return;
    }

    const generalTeam = generalTeamQuery.docs[0];
    const teamData = generalTeam.data();

    // Add user to General team if not already a member
    if (!teamData.members.some((m: any) => m.userId === userId)) {
      await generalTeam.ref.update({
        members: [...teamData.members, {
          userId,
          role: 'member',
          joinedAt: new Date().toISOString()
        }]
      });
      logger.info("Added user to General team", { userId, teamId: generalTeam.id });

      // Update user document with team info
      await event.data?.ref.update({
        teams: [generalTeam.id],
        defaultTeam: generalTeam.id
      });
      logger.info("Updated user document with team info", { userId, teamId: generalTeam.id });
    }
  } catch (error) {
    logger.error("Error in onUserCreated:", error);
    throw error; // Re-throw to ensure the function fails properly
  }
});

export const onUserUpdated = onDocumentUpdated({
  document: "users/{userId}",
  region: "us-central1"
}, async (event) => {
  const newData = event.data?.after.data();
  const previousData = event.data?.before.data();
  const userId = event.params.userId;

  // Only update claims if organizationId has changed
  if (newData?.organizationId !== previousData?.organizationId) {
    try {
      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, {
        organizationId: newData?.organizationId,
      });
      logger.info("Updated custom claims for user", { userId, organizationId: newData?.organizationId });

      if (newData?.organizationId) {
        // Get the General team for this organization
        const teamsRef = admin.firestore().collection('teams');
        const generalTeamQuery = await teamsRef
          .where('organizationId', '==', newData.organizationId)
          .where('isDefault', '==', true)
          .get();

        if (!generalTeamQuery.empty) {
          const generalTeam = generalTeamQuery.docs[0];
          const teamData = generalTeam.data();

          // Add user to General team if not already a member
          if (!teamData.members.some((m: any) => m.userId === userId)) {
            await generalTeam.ref.update({
              members: [...teamData.members, {
                userId,
                role: 'member',
                joinedAt: new Date().toISOString()
              }]
            });
            logger.info("Added user to General team", { userId, teamId: generalTeam.id });

            // Update user document with team info
            await event.data?.after.ref.update({
              teams: [generalTeam.id],
              defaultTeam: generalTeam.id
            });
            logger.info("Updated user document with team info", { userId, teamId: generalTeam.id });
          }
        } else {
          logger.info("No General team found for organization", { organizationId: newData.organizationId });
        }
      }
    } catch (error) {
      logger.error("Error in onUserUpdated:", error);
      throw error; // Re-throw to ensure the function fails properly
    }
  }
});
