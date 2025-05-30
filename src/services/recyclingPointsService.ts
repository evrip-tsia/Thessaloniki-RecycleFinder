
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { RecyclingPoint, RecyclingCategoryEnum } from '@/types';


const POINTS_COLLECTION = 'recyclingPoints';

/**
 * Helper function to map a Firestore document snapshot to a RecyclingPoint object.
 * @param {QueryDocumentSnapshot<DocumentData>} docSnap - The Firestore document snapshot.
 * @returns {RecyclingPoint} The mapped RecyclingPoint object.
 */
const mapDocToRecyclingPoint = (docSnap: QueryDocumentSnapshot<DocumentData>): RecyclingPoint => {
  const data = docSnap.data();
  
  return {
    id: docSnap.id,
    name: data.name || 'Unnamed Point', // Default name if missing
    category: data.category || 'unknown' as RecyclingCategoryEnum, // Default category if missing
    x: typeof data.x === 'number' ? data.x : 0, // Default x-coordinate if missing or invalid
    y: typeof data.y === 'number' ? data.y : 0, // Default y-coordinate if missing or invalid
    description: data.description || '', // Default empty description if missing
  } as RecyclingPoint; // Type assertion for safety
};

/**
 * Fetches all recycling points from the Firestore database.
 * @returns {Promise<RecyclingPoint[]>} A promise that resolves to an array of RecyclingPoint objects.
 * @throws {Error} If Firestore is not initialized or if the fetch operation fails.
 */
export const getRecyclingPointsFromDB = async (): Promise<RecyclingPoint[]> => {
  console.log("SERVICE: Attempting to fetch recycling points from DB...");
  // Check if Firestore database instance is available
  if (!db) {
    const errMsg = "SERVICE_ERROR (getRecyclingPointsFromDB): Firestore database (db) is not initialized. Check Firebase configuration and SERVER logs.";
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log("SERVICE (getRecyclingPointsFromDB): Firestore 'db' object appears to be initialized. Proceeding.");
  try {
    // Get a reference to the 'recyclingPoints' collection
    const pointsCollectionRef = collection(db, POINTS_COLLECTION);
    // Fetch all documents from the collection
    const querySnapshot = await getDocs(pointsCollectionRef);
    console.log(`SERVICE (getRecyclingPointsFromDB): Fetched ${querySnapshot.docs.length} points from DB.`);
    // Map each document to a RecyclingPoint object
    return querySnapshot.docs.map(mapDocToRecyclingPoint);
  } catch (error: any) {
    const originalErrorMessage = error.message || String(error);
    const errMsg = `SERVICE_ERROR (getRecyclingPointsFromDB): Firestore operation failed. Original error: ${originalErrorMessage}`;
    console.error(errMsg, error); // Log the full error object
    throw new Error(errMsg); // Re-throw a new error with a clear message
  }
};

/**
 * Adds a new recycling point to the Firestore database.
 * @param {Omit<RecyclingPoint, 'id'>} pointData - The data for the new recycling point (without an ID).
 * @returns {Promise<RecyclingPoint>} A promise that resolves to the added RecyclingPoint object, including its new Firestore-generated ID.
 * @throws {Error} If Firestore is not initialized or if the add operation fails.
 */
export const addRecyclingPointToDB = async (pointData: Omit<RecyclingPoint, 'id'>): Promise<RecyclingPoint> => {
  console.log("SERVICE: Attempting to add recycling point to DB:", pointData);
  // Check if Firestore database instance is available
  if (!db) {
    const errMsg = "SERVICE_ERROR (addRecyclingPointToDB): Firestore database (db) is not initialized. Check Firebase configuration and SERVER logs.";
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log("SERVICE (addRecyclingPointToDB): Firestore 'db' object appears to be initialized. Proceeding.");
  try {
    // Get a reference to the 'recyclingPoints' collection
    const pointsCollectionRef = collection(db, POINTS_COLLECTION);
    // Add the new document to the collection
    const docRef = await addDoc(pointsCollectionRef, pointData);
    console.log("SERVICE (addRecyclingPointToDB): Successfully added point to DB with ID:", docRef.id);
    // Return the new point data along with its generated ID
    return { id: docRef.id, ...pointData };
  } catch (error: any) {
    const originalErrorMessage = error.message || String(error);
    const errMsg = `SERVICE_ERROR (addRecyclingPointToDB): Firestore operation failed. Original error: ${originalErrorMessage}`;
    console.error(errMsg, error); // Log the full error object
    throw new Error(errMsg); // Re-throw a new error with a clear message
  }
};

/**
 * Updates an existing recycling point in the Firestore database.
 * @param {string} pointId - The ID of the recycling point to update.
 * @param {Partial<Omit<RecyclingPoint, 'id'>>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws {Error} If Firestore is not initialized or if the update operation fails.
 */
export const updateRecyclingPointInDB = async (pointId: string, updates: Partial<Omit<RecyclingPoint, 'id'>>): Promise<void> => {
  console.log(`SERVICE: Attempting to update point ${pointId} in DB with:`, updates);
  // Check if Firestore database instance is available
  if (!db) {
    const errMsg = `SERVICE_ERROR (updateRecyclingPointInDB for point ${pointId}): Firestore database (db) is not initialized. Check Firebase configuration and SERVER logs.`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log(`SERVICE (updateRecyclingPointInDB for point ${pointId}): Firestore 'db' object appears to be initialized. Proceeding.`);
  try {
    // Get a reference to the specific document to update
    const pointDocRef = doc(db, POINTS_COLLECTION, pointId);
    // Update the document
    await updateDoc(pointDocRef, updates);
    console.log(`SERVICE (updateRecyclingPointInDB): Successfully updated point ${pointId} in DB.`);
  } catch (error: any) {
    const originalErrorMessage = error.message || String(error);
    const errMsg = `SERVICE_ERROR (updateRecyclingPointInDB for point ${pointId}): Firestore operation failed. Original error: ${originalErrorMessage}`;
    console.error(errMsg, error); // Log the full error object
    throw new Error(errMsg); // Re-throw a new error with a clear message
  }
};

/**
 * Deletes a recycling point from the Firestore database.
 * @param {string} pointId - The ID of the recycling point to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 * @throws {Error} If Firestore is not initialized or if the delete operation fails.
 */
export const deleteRecyclingPointFromDB = async (pointId: string): Promise<void> => {
  console.log(`SERVICE: Attempting to delete point ${pointId} from DB.`);
  // Check if Firestore database instance is available
  if (!db) {
    const errMsg = `SERVICE_ERROR (deleteRecyclingPointFromDB for point ${pointId}): Firestore database (db) is not initialized. Check Firebase configuration and SERVER logs.`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log(`SERVICE (deleteRecyclingPointFromDB for point ${pointId}): Firestore 'db' object appears to be initialized. Proceeding.`);
  try {
    // Get a reference to the specific document to delete
    const pointDocRef = doc(db, POINTS_COLLECTION, pointId);
    // Delete the document
    await deleteDoc(pointDocRef);
    console.log(`SERVICE (deleteRecyclingPointFromDB): Successfully deleted point ${pointId} from DB.`);
  } catch (error: any) {
    const originalErrorMessage = error.message || String(error);
    const errMsg = `SERVICE_ERROR (deleteRecyclingPointFromDB for point ${pointId}): Firestore operation failed. Original error: ${originalErrorMessage}`;
    console.error(errMsg, error); // Log the full error object
    throw new Error(errMsg); // Re-throw a new error with a clear message
  }
};
