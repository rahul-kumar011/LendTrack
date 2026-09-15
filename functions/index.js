const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const crypto = require("crypto");

// ---------------------------------------------------------
// Firebase Admin
// ---------------------------------------------------------

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ---------------------------------------------------------
// Global settings
// ---------------------------------------------------------

setGlobalOptions({
  region: "asia-south1",
  maxInstances: 10,
});

// ---------------------------------------------------------
// WebAuthn settings
// ---------------------------------------------------------

const rpName = "LendTrack";

// Local development
const rpID = process.env.WEBAUTHN_RPID || "localhost";

const origins = (
  process.env.WEBAUTHN_ORIGINS ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

// ---------------------------------------------------------
// Helper functions
// ---------------------------------------------------------

function createId() {
  return crypto.randomUUID();
}

function createWebAuthnUserId() {
  return crypto.randomBytes(32).toString("base64url");
}

function getExpiryTimestamp(minutes = 5) {
  return admin.firestore.Timestamp.fromMillis(
    Date.now() + minutes * 60 * 1000
  );
}

function isExpired(timestamp) {
  if (!timestamp) {
    return true;
  }

  return timestamp.toMillis() < Date.now();
}

// ---------------------------------------------------------
// BIOMETRIC STATUS
// ---------------------------------------------------------

exports.biometricStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const uid = request.auth.uid;

  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("passkeys")
    .limit(1)
    .get();

  return {
    enabled: !snapshot.empty,
  };
});

// ---------------------------------------------------------
// REGISTRATION - STEP 1
// User must already be logged in with email/password.
// ---------------------------------------------------------

exports.biometricRegistrationOptions = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Please login with email and password first."
    );
  }

  const uid = request.auth.uid;

  try {
    const userRecord = await auth.getUser(uid);

    const userRef = db.collection("users").doc(uid);

    const userSnapshot = await userRef.get();

    let webAuthnUserId = userSnapshot.exists
      ? userSnapshot.data()?.webAuthnUserId
      : null;

    // Create a permanent WebAuthn user ID if this is
    // the first biometric registration.
    if (!webAuthnUserId) {
      webAuthnUserId = createWebAuthnUserId();

      await userRef.set(
        {
          webAuthnUserId,
        },
        {
          merge: true,
        }
      );
    }

    const passkeysSnapshot = await userRef
      .collection("passkeys")
      .get();

    const existingPasskeys = passkeysSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        transports: data.transports || [],
      };
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,

      userID: Buffer.from(webAuthnUserId, "base64url"),

      userName: userRecord.email || uid,

      attestationType: "none",

      excludeCredentials: existingPasskeys,

      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },

      supportedAlgorithmIDs: [-7, -257],
    });

    // Save registration challenge.
    await userRef
      .collection("webauthnState")
      .doc("registration")
      .set({
        challenge: options.challenge,
        expiresAt: getExpiryTimestamp(5),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return options;
  } catch (error) {
    logger.error("Registration options error", error);

    throw new HttpsError(
      "internal",
      "Could not create biometric registration options."
    );
  }
});

// ---------------------------------------------------------
// REGISTRATION - STEP 2
// Verify Face/Fingerprint response and save credential.
// ---------------------------------------------------------

exports.biometricRegistrationVerify = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Please login first."
    );
  }

  const uid = request.auth.uid;
  const response = request.data?.response;

  if (!response) {
    throw new HttpsError(
      "invalid-argument",
      "Biometric response is missing."
    );
  }

  const userRef = db.collection("users").doc(uid);

  const stateRef = userRef
    .collection("webauthnState")
    .doc("registration");

  const stateSnapshot = await stateRef.get();

  if (!stateSnapshot.exists) {
    throw new HttpsError(
      "failed-precondition",
      "Registration session expired. Please try again."
    );
  }

  const state = stateSnapshot.data();

  if (isExpired(state.expiresAt)) {
    await stateRef.delete();

    throw new HttpsError(
      "deadline-exceeded",
      "Registration session expired. Please try again."
    );
  }

  try {
    const verification = await verifyRegistrationResponse({
      response,

      expectedChallenge: state.challenge,

      expectedOrigin: origins,

      expectedRPID: rpID,

      requireUserVerification: true,

      supportedAlgorithmIDs: [-7, -257],
    });

    // One-time challenge.
    await stateRef.delete();

    if (!verification.verified) {
      throw new HttpsError(
        "permission-denied",
        "Biometric registration could not be verified."
      );
    }

    const registrationInfo = verification.registrationInfo;

    if (!registrationInfo) {
      throw new HttpsError(
        "internal",
        "Registration information is missing."
      );
    }

    const {
      credential,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;

    const passkeyRef = userRef
      .collection("passkeys")
      .doc(credential.id);

    await passkeyRef.set({
      id: credential.id,

      publicKey: Array.from(credential.publicKey),

      counter: credential.counter,

      transports: credential.transports || [],

      deviceType: credentialDeviceType,

      backedUp: credentialBackedUp,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      verified: true,
      enabled: true,
    };
  } catch (error) {
    logger.error("Registration verification error", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "permission-denied",
      "Biometric registration failed."
    );
  }
});

// ---------------------------------------------------------
// AUTHENTICATION - STEP 1
// User enters email, then presses
// Login with Face / Fingerprint.
// ---------------------------------------------------------

exports.biometricAuthenticationOptions = onCall(
  async (request) => {
    const email = String(
      request.data?.email || ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    try {
      const userRecord = await auth.getUserByEmail(email);

      const uid = userRecord.uid;

      const userRef = db.collection("users").doc(uid);

      const passkeysSnapshot = await userRef
        .collection("passkeys")
        .get();

      if (passkeysSnapshot.empty) {
        throw new HttpsError(
          "failed-precondition",
          "No biometric login is registered for this account."
        );
      }

      const passkeys = passkeysSnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          transports: data.transports || [],
        };
      });

      const options = await generateAuthenticationOptions({
        rpID,

        allowCredentials: passkeys,

        userVerification: "required",
      });

      // Create a one-time challenge ID.
      const challengeId = createId();

      await db
        .collection("webauthnAuthChallenges")
        .doc(challengeId)
        .set({
          uid,

          email,

          challenge: options.challenge,

          expiresAt: getExpiryTimestamp(5),

          createdAt:
            admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        challengeId,
        options,
      };
    } catch (error) {
      logger.error(
        "Authentication options error",
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Could not create biometric login options."
      );
    }
  }
);

// ---------------------------------------------------------
// AUTHENTICATION - STEP 2
// Verify Face/Fingerprint and issue Firebase token.
// ---------------------------------------------------------

exports.biometricAuthenticationVerify = onCall(
  async (request) => {
    const challengeId =
      request.data?.challengeId;

    const response =
      request.data?.response;

    if (!challengeId || !response) {
      throw new HttpsError(
        "invalid-argument",
        "Authentication information is missing."
      );
    }

    const challengeRef = db
      .collection("webauthnAuthChallenges")
      .doc(challengeId);

    const challengeSnapshot =
      await challengeRef.get();

    if (!challengeSnapshot.exists) {
      throw new HttpsError(
        "failed-precondition",
        "Authentication session is invalid or expired."
      );
    }

    const challenge =
      challengeSnapshot.data();

    // Delete immediately.
    // This makes the challenge one-time use.
    await challengeRef.delete();

    if (isExpired(challenge.expiresAt)) {
      throw new HttpsError(
        "deadline-exceeded",
        "Authentication session expired. Please try again."
      );
    }

    const uid = challenge.uid;

    const passkeyRef = db
      .collection("users")
      .doc(uid)
      .collection("passkeys")
      .doc(response.id);

    const passkeySnapshot =
      await passkeyRef.get();

    if (!passkeySnapshot.exists) {
      throw new HttpsError(
        "permission-denied",
        "Biometric credential was not found."
      );
    }

    const passkey =
      passkeySnapshot.data();

    try {
      const verification =
        await verifyAuthenticationResponse({
          response,

          expectedChallenge:
            challenge.challenge,

          expectedOrigin: origins,

          expectedRPID: rpID,

          requireUserVerification: true,

          credential: {
            id: passkey.id,

            publicKey: new Uint8Array(
              passkey.publicKey
            ),

            counter: passkey.counter || 0,

            transports:
              passkey.transports || [],
          },
        });

      if (!verification.verified) {
        throw new HttpsError(
          "permission-denied",
          "Biometric authentication failed."
        );
      }

      const newCounter =
        verification.authenticationInfo
          ?.newCounter;

      if (
        typeof newCounter === "number"
      ) {
        await passkeyRef.update({
          counter: newCounter,

          lastUsedAt:
            admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Create Firebase Authentication token.
      const customToken =
        await auth.createCustomToken(uid);

      return {
        verified: true,

        customToken,
      };
    } catch (error) {
      logger.error(
        "Authentication verification error",
        error
      );

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "permission-denied",
        "Face/Fingerprint authentication failed."
      );
    }
  }
);