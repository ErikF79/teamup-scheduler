
import { db } from './config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, DocumentReference, setDoc, getDoc } from 'firebase/firestore';
import type { Gym, Team, Session } from '../teamup';

// --- Gym Functions ---
const gymsCollection = collection(db, 'gyms');

export const getGyms = async (): Promise<Gym[]> => {
    const snapshot = await getDocs(gymsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gym));
};

export const addGym = async (gymData: Omit<Gym, 'id'>) => {
    return await addDoc(gymsCollection, gymData);
};

export const updateGym = async (id: string, gymData: Partial<Gym>) => {
    const gymDoc = doc(db, 'gyms', id);
    return await updateDoc(gymDoc, gymData);
};

export const deleteGym = async (id: string) => {
    const gymDoc = doc(db, 'gyms', id);
    return await deleteDoc(gymDoc);
};


// --- Team Functions ---
const teamsCollection = collection(db, 'teams');

export const getTeams = async (): Promise<Team[]> => {
    const snapshot = await getDocs(teamsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
};

export const addTeam = async (teamData: Omit<Team, 'id'>) => {
    return await addDoc(teamsCollection, teamData);
};

export const updateTeam = async (id: string, teamData: Partial<Omit<Team, 'id'>>) => {
    const teamDoc = doc(db, 'teams', id);
    return await updateDoc(teamDoc, teamData);
};

export const deleteTeam = async (id: string) => {
    const teamDoc = doc(db, 'teams', id);
    // TODO: also delete sessions for this team
    return await deleteDoc(teamDoc);
};


// --- Session Functions ---
const sessionsCollection = collection(db, 'sessions');

export const getSessions = async (): Promise<Session[]> => {
    const snapshot = await getDocs(sessionsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
};

export const updateSession = async (id: string, sessionData: Partial<Omit<Session, 'id'>>) => {
    const sessionDocRef = doc(db, 'sessions', id);
    const sessionDoc = await getDoc(sessionDocRef);

    if (sessionDoc.exists()) {
        await updateDoc(sessionDocRef, sessionData);
    } else {
        // This case handles newly created sessions that don't exist in DB yet
        // A full Session object should be passed in sessionData
        await setDoc(sessionDocRef, sessionData);
    }
};

export const updateAllSessions = async (sessions: Session[]) => {
    const batch = writeBatch(db);
    
    // Get all existing sessions from DB
    const existingSessionsSnapshot = await getDocs(sessionsCollection);
    const existingSessionsMap = new Map<string, DocumentReference>();
    existingSessionsSnapshot.forEach(doc => {
        existingSessionsMap.set(doc.id, doc.ref);
    });

    const sessionsToKeep = new Set<string>();

    // Process sessions to be updated or created
    for (const session of sessions) {
        sessionsToKeep.add(session.id);
        const sessionRef = doc(db, 'sessions', session.id);
        // Use set with merge option to create or update
        batch.set(sessionRef, session, { merge: true });
    }

    // Process sessions to be deleted
    existingSessionsMap.forEach((sessionRef, sessionId) => {
        if (!sessionsToKeep.has(sessionId)) {
            batch.delete(sessionRef);
        }
    });
   
    return await batch.commit();
};
