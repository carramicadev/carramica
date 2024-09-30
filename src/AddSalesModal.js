import React, { useState } from 'react';
import Modal from 'react-modal';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

Modal.setAppElement('#root');

const AddSalesModal = ({ isOpen, onRequestClose }) => {
  const [salesData, setSalesData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSalesData({ ...salesData, [name]: value });
  };

  const generateNewId = async () => {
    const salesSnapshot = await getDocs(collection(db, "sales"));
    const salesList = salesSnapshot.docs.map(doc => doc.id);
    
    const maxId = salesList.reduce((max, id) => {
      const num = parseInt(id.replace('SAL', ''));
      return num > max ? num : max;
    }, 0);
    
    const newId = `SAL${String(maxId + 1).padStart(3, '0')}`;
    return newId;
  };

  const handleSaveSales = async () => {
    try {
      const newId = await generateNewId();
      await setDoc(doc(db, "sales", newId), salesData);
      onRequestClose();
    } catch (e) {
      console.error("Error adding sales: ", e);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Tambah Sales" className="modal" overlayClassName="overlay">
      <h2>Tambah Sales</h2>
      <form>
        <div className="form-group">
          <label className="label">Nama</label>
          <input className="input" type="text" name="name" placeholder="Bonnie Green" value={salesData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" type="email" name="email" placeholder="email@email.com" value={salesData.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label">No Hp</label>
          <input className="input" type="text" name="phone" placeholder="081xxx" value={salesData.phone} onChange={handleChange} />
        </div>
        <button type="button" className="button button-primary" onClick={handleSaveSales}>Save</button>
        <button type="button" className="button button-red" onClick={onRequestClose}>Close</button>
      </form>
    </Modal>
  );
};

export default AddSalesModal;