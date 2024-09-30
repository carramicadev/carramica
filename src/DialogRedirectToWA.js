import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from './FirebaseFrovider';
import { useNavigate } from 'react-router-dom';

export default function RedirectToWa(props) {
    const navigate = useNavigate();

    const sendMessage = async () => {
        const message = `Halo ${props?.data?.senderName},\n\n
Thank you for purchasing our product!.\n
Total pembayaran Anda adalah Rp. ${props?.data?.harga}\n\n

Silahkan melakukan pembayaran melalui link berikut : ${props?.data?.link}\n\n

Kabarin ya jika ada kendala. Harap konfirmasi jika telah berhasil.\n\n
Terima kasih`
        const url = `https://wa.me/${props?.data?.senderPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

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