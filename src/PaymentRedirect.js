import { Form } from "react-bootstrap";
import { currency } from "./formatter";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-phone-input-2/lib/style.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "./FirebaseFrovider";
import { useParams } from "react-router-dom";

export default function PaymentRedirect() {
    const { id } = useParams();
    const [form, setForm] = useState({})
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(firestore, 'orders', id);

        const unsubscribe = onSnapshot(
            docRef,
            (doc) => {
                if (doc.exists()) {
                    setForm({
                        ...form,
                        ...doc.data()
                    });
                } else {
                    // setError("Document does not exist");
                }
                setLoading(false);
            },
            (error) => {
                // setError(error.message);
                setLoading(false);
            }
        );

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [id]);
    const totalDiscount = (form?.additionalDiscount + form?.totalOngkir + form?.totalHargaProduk) - form?.totalAfterDiskonDanOngkir
    console.log(form, id)
    return (
        <div style={{
            position: 'sticky', top: 200,
            right: 0, padding: 20, margin: 20
        }} className="summary-section">
            <div className="summary-item">
                <Form.Label>Subtotal</Form.Label>
                <span>{currency(form?.totalHargaProduk)}</span>
            </div>
            <div className="summary-item">
                <Form.Label>Total Discount</Form.Label>
                <span>{currency(totalDiscount)}</span>
            </div>
            <div className="summary-item">
                <Form.Label>Additional Discount</Form.Label>
                <Form.Control disabled onWheel={(e) => e.target.blur()} className="input" type="number" name="additionalDiscount" placeholder="0" value={currency(form?.additionalDiscount)}
                // onChange={handleFormChange} 
                />
            </div>
            <div className="summary-item">
                <Form.Label>Delivery Fee</Form.Label>
                <span>{currency(form?.totalOngkir)}</span>
            </div>
            <div className="summary-item">
                <Form.Label>Total</Form.Label>
                <span>{currency(form?.totalAfterDiskonDanOngkir)}</span>
            </div>
            <div className="submit">
                <button className="button button-primary"
                // onClick={handleShowSaveInvoice}
                >Save Invoice</button>

            </div>
        </div>
    )
}