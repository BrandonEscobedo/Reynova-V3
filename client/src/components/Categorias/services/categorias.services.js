import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

const categoriasCollection = collection(db, 'categorias');

export const getCategorias = async () => {
  const snapshot = await getDocs(categoriasCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createCategoria = async (nombre) => {
  const newCategoria = { nombre };
  const docRef = await addDoc(categoriasCollection, newCategoria);
  return { id: docRef.id, ...newCategoria };
};

export const updateCategoria = async (id, nombre) => {
  await updateDoc(doc(db, 'categorias', id), { nombre });
};

export const deleteCategoria = async (id) => {
  await deleteDoc(doc(db, 'categorias', id));
};
