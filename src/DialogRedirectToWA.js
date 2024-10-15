import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { firestore, functions } from './FirebaseFrovider';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';

export default function RedirectToWa(props) {
    const navigate = useNavigate();

    const sendMessage = async () => {

        const getToken = httpsCallable(functions, 'qontakSendWAToSender');
        await getToken({
            name: props?.data?.senderName,
            no: props?.data?.senderPhone,
            price: props?.data?.harga.toString(),
            link: props?.data?.link,
            type: 'pembayaran'
        });
        await setDoc(doc(firestore, 'orders', props?.show.id), {
            isInvWASent: true
        }, { merge: true });
        props?.onHide()
        navigate('/orders')
    };

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
                height: 'auto'
            }}
            // {...props}
            show={props?.show?.open}
            onHide={() => {
                props?.onHide()
                navigate('/orders')

            }}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Berhasil Dibuat</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ fontWeight: 'bold' }}>Invoice berhasil dibuat dan order disave di table order </p>
                    <p>Apakah Anda ingin mengirim payment link ke customer?</p>
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                    {/* <Button variant="secondary" >
                        Close
                    </Button> */}
                    <button disabled={props.loading} onClick={sendMessage} className="button button-primary" >Ya, Kirim WA</button>
                    <button style={{ backgroundColor: '#F05252' }} disabled={props.loading} onClick={() => {
                        props?.onHide()
                        navigate('/orders')

                    }} className="button button-primary" >Close</button>

                    {/* <button className="button button-primary" >Understood</button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
}