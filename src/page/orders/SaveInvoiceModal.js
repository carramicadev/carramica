import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export default function SaveInvoiceModal(props) {
    // console.log(props)
    return (
        <div
            className="modal show"
            style={{ display: 'block', position: 'initial' }}
        > <Modal
            style={{
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                width: 'auto',
                height: 'auto',
                border: 'none'
            }}
            {...props}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Form Order</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Save Invoice, apakah sudah yakin?
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    {/* <Button variant="secondary" >
                        Close
                    </Button> */}
                    <button
                        disabled={props.loading}
                        onClick={props.handlePayment} className="button button-primary" >{props.loading ? 'loading...' : 'Ya'}</button>

                    {/* <button className="button button-primary" >Understood</button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
}