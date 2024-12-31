import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

export const onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
  const userData = event.data?.data();
  const userId = event.params.userId;

  if (userData?.organizationId) {
    try {
      await admin.auth().setCustomUserClaims(userId, {
        organizationId: userData.organizationId,
      });
    } catch (error) {
      console.error("Error setting custom claims:", error);
    }
  }
});

export const onUserUpdated = onDocumentUpdated("users/{userId}", async (event) => {
  const newData = event.data?.after.data();
  const previousData = event.data?.before.data();
  const userId = event.params.userId;

  // Only update claims if organizationId has changed
  if (newData?.organizationId !== previousData?.organizationId) {
    try {
      await admin.auth().setCustomUserClaims(userId, {
        organizationId: newData?.organizationId,
      });
    } catch (error) {
      console.error("Error updating custom claims:", error);
    }
  }
});
