
import { db } from './config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, setDoc, getDoc } from 'firebase/firestore';
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
    await updateDoc(sessionDocRef, sessionData);
};


export const updateAllSessions = async (sessionsToUpdate: Session[], sessionIdsToDelete: string[]) => {
    const batch = writeBatch(db);

    // Process sessions to be updated or created
    for (const session of sessionsToUpdate) {
        if (session.id) {
            // Update existing session
            const sessionRef = doc(db, 'sessions', session.id);
            batch.update(sessionRef, session);
        } else {
            // Create new session
            const newSessionRef = doc(sessionsCollection); // Firestore generates ID
            batch.set(newSessionRef, session);
        }
    }

    // Process sessions to be deleted
    for (const sessionId of sessionIdsToDelete) {
        const sessionRef = doc(db, 'sessions', sessionId);
        batch.delete(sessionRef);
    }
   
    return await batch.commit();
};
