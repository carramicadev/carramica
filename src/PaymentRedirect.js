import { Form } from "react-bootstrap";
import { currency } from "./formatter";

export default function PaymentRedirect() {
    return (
        <div style={{
            position: 'sticky', top: 200,
            right: 0,
        }} className="summary-section">
            <div className="summary-item">
                <Form.Label>Subtotal</Form.Label>
                <span>{currency(200000)}</span>
            </div>
            <div className="summary-item">
                <Form.Label>Total Discount</Form.Label>
                <span>{currency(50000)}</span>
            </div>
            <div className="summary-item">
                <Form.Label>Additional Discount</Form.Label>
                <Form.Control onWheel={(e) => e.target.blur()} className="input" type="number" name="additionalDiscount" placeholder="0" value={0}
                // onChange={handleFormChange} 
                />
            </div>
            <div className="summary-item">
                <Form.Label>Delivery Fee</Form.Label>
                <span>{currency(20000)}</span>
            </div>
            <div className="summary-item">
                <Form.Label>Total</Form.Label>
                <span>{currency(270000)}</span>
            </div>
            <div className="submit">
                <button className="button button-primary"
                // onClick={handleShowSaveInvoice}
                >Save Invoice</button>

            </div>
        </div>
    )
}