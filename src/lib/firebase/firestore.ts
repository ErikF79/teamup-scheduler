
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
    const batch = writeBatch(db);
    const gymDoc = doc(db, 'gyms', id);
    batch.delete(gymDoc);
    
    // Un-assign sessions from this gym
    const q = query(collection(db, 'sessions'), where('gymId', '==', id));
    const sessionsSnap = await getDocs(q);
    sessionsSnap.forEach(sessionDoc => {
        batch.update(sessionDoc.ref, { gymId: null, startTime: null });
    });

    return await batch.commit();
};


// --- Team Functions ---
const teamsCollection = collection(db, 'teams');
const sessionsCollection = collection(db, 'sessions');


export const getTeams = async (): Promise<Team[]> => {
    const snapshot = await getDocs(teamsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
};

// This function syncs the number of session documents with team.sessionsPerWeek
const syncTeamSessions = async (teamId: string, teamData: Partial<Omit<Team, 'id'>>, batch: ReturnType<typeof writeBatch>) => {
    const sessionsQuery = query(sessionsCollection, where('teamId', '==', teamId));
    const snapshot = await getDocs(sessionsQuery);
    const existingSessions = snapshot.docs;
    
    const requiredCount = teamData.sessionsPerWeek ?? 0;
    const currentCount = existingSessions.length;

    // Update duration for existing sessions if it has changed
    if(teamData.sessionDuration !== undefined) {
        for (const sessionDoc of existingSessions) {
            batch.update(sessionDoc.ref, { duration: teamData.sessionDuration });
        }
    }

    if (requiredCount > currentCount) {
        // Add new sessions
        for (let i = 0; i < requiredCount - currentCount; i++) {
            const newSession: Omit<Session, 'id'> = {
                teamId: teamId,
                duration: teamData.sessionDuration ?? 60,
                gymId: null,
                startTime: null,
            };
            const sessionRef = doc(sessionsCollection); // Create new doc ref
            batch.set(sessionRef, newSession);
        }
    } else if (requiredCount < currentCount) {
        // Delete excess sessions
        for (let i = requiredCount; i < currentCount; i++) {
            batch.delete(existingSessions[i].ref);
        }
    }
};

export const addTeam = async (teamData: Omit<Team, 'id'>) => {
    const batch = writeBatch(db);
    
    // 1. Create the team document to get an ID
    const teamRef = doc(teamsCollection);
    batch.set(teamRef, teamData);
    
    // 2. Use the new team ID to create the associated sessions
    await syncTeamSessions(teamRef.id, teamData, batch);
    
    return await batch.commit();
};

export const updateTeam = async (id: string, teamData: Partial<Omit<Team, 'id'>>) => {
    const batch = writeBatch(db);
    const teamDoc = doc(db, 'teams', id);
    batch.update(teamDoc, teamData);
    await syncTeamSessions(id, teamData, batch);
    return await batch.commit();
};

export const deleteTeam = async (id: string) => {
    const batch = writeBatch(db);
    
    // 1. Delete the team document
    const teamDoc = doc(db, 'teams', id);
    batch.delete(teamDoc);

    // 2. Delete all sessions for this team
    const sessionsQuery = query(sessionsCollection, where('teamId', '==', id));
    const snapshot = await getDocs(sessionsQuery);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    return await batch.commit();
};


// --- Session Functions ---
export const getSessions = async (): Promise<Session[]> => {
    const snapshot = await getDocs(sessionsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
};

export const updateSession = async (id: string, sessionData: Partial<Omit<Session, 'id'>>) => {
    const sessionDocRef = doc(db, 'sessions', id);
    await updateDoc(sessionDocRef, sessionData);
};
