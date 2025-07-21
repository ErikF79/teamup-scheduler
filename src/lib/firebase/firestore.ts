
import { db } from './config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDoc } from 'firebase/firestore';
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

export const updateSession = async (id: string, sessionData: Partial<Session>) => {
    // We need to find the document by its `id` field, which is not the same as the doc ID.
    const q = query(sessionsCollection, where("id", "==", id));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        // If session doesn't exist, create it. This can happen with new sessions.
        const sessionDoc = doc(sessionsCollection); // Auto-generate new doc ID
        await addDoc(sessionsCollection, {...sessionData, id: id });
    } else {
        const sessionDoc = querySnapshot.docs[0].ref;
        await updateDoc(sessionDoc, sessionData);
    }
};

export const updateAllSessions = async (sessions: Session[]) => {
    const batch = writeBatch(db);
    
    const sessionsFromDb = await getSessions();
    const sessionsFromDbMap = new Map(sessionsFromDb.map(s => [s.id, s]));
    const sessionsToUpdateMap = new Map(sessions.map(s => [s.id, s]));

    for(const session of sessions) {
        const docRef = doc(db, "sessions", session.id);
        batch.set(docRef, session);
    }
    
    // Delete sessions from DB that are not in the new list
    for (const dbSession of sessionsFromDb) {
        if (!sessionsToUpdateMap.has(dbSession.id)) {
            const docRef = doc(db, "sessions", dbSession.id);
            batch.delete(docRef);
        }
    }
   
    return await batch.commit();
};
