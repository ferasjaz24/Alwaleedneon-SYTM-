import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebase";

/**
 * Creates a new employee user in Firebase Auth and a corresponding Firestore document.
 * Uses a secondary Firebase app instance to prevent the Super Admin from being logged out.
 * 
 * @param email Employee's email
 * @param password Employee's password
 * @param jobTitle Employee's job title
 * @param superAdminEmail The email of the Super Admin creating this account (for tracking)
 * @returns The newly created user object
 */
export const createEmployeeUser = async (
  payload: any,
  superAdminEmail: string,
  primaryDb: any
) => {
  try {
    const secondaryAppName = "SecondaryAppForCreation";
    const secondaryApp = getApps().find((app) => app.name === secondaryAppName) 
      || initializeApp(firebaseConfig, secondaryAppName);
      
    const secondaryAuth = getAuth(secondaryApp);
    
    let newUserUid = "";
    
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, payload.email, payload.password);
      newUserUid = userCredential.user.uid;
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        console.warn("User already exists in Firebase Auth, updating Firestore document only.");
        newUserUid = payload.uid || "existing-user-" + Date.now(); // Fallback if we can't get UID
      } else {
        throw authError;
      }
    }

    const employeeDocRef = doc(primaryDb, "users", payload.email.toLowerCase());
    
    await setDoc(employeeDocRef, {
      ...payload,
      ...(newUserUid && { uid: newUserUid }),
      createdBy: superAdminEmail
    });
    
    await signOut(secondaryAuth);
    return { success: true, user: { email: payload.email, uid: newUserUid } };
  } catch (error) {
    console.error("Error creating employee user:", error);
    throw error;
  }
};
