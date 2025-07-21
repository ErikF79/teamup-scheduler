
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

export const updateTeam = async (id: string, teamData: Partial<Team>) => {
    const teamDoc = doc(db, 'teams', id);
    return await updateDoc(teamDoc, teamData);
};

export const deleteTeam = async (id: string) => {
    const teamDoc = doc(db, 'teams', id);
    return await deleteDoc(teamDoc);
};


// --- Session Functions ---
const sessionsCollection = collection(db, 'sessions');

export const getSessions = async (): Promise<Session[]> => {
    const snapshot = await getDocs(sessionsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
};

export const updateSession = async (id: string, sessionData: Partial<Session>) => {
    const sessionDoc = doc(db, 'sessions', id);
    return await updateDoc(sessionDoc, sessionData);
};

export const updateAllSessions = async (sessions: Session[]) => {
    const batch = writeBatch(db);
    
    // Get all existing session docs from Firestore
    const existingDocsSnapshot = await getDocs(sessionsCollection);
    const existingDocsMap = new Map(existingDocsSnapshot.docs.map(d => [d.id, d.ref]));
    const sessionsMap = new Map(sessions.map(s => [s.id, s]));

    // Update or create sessions
    for (const session of sessions) {
        const docRef = existingDocsMap.get(session.id) || doc(sessionsCollection, session.id);
        const { id, ...sessionData } = session; // Don't save the id as a field in the document
        batch.set(docRef, sessionData);
    }
    
    // Delete sessions that are no longer in the provided list
    for (const [id, docRef] of existingDocsMap.entries()) {
        if (!sessionsMap.has(id)) {
            batch.delete(docRef);
        }
    }

    return await batch.commit();
};

