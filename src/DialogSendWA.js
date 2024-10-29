import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { usePDF } from 'react-to-pdf';
import './dialogDownload.css';
import { firestore, functions } from './FirebaseFrovider';


export default function DialogSendWA(props) {
    const item = props?.show?.data;
    // qontak
    const sendWAToSender = async () => {
        try {
            // console.log(item?.senderName,
            //     item?.senderPhone,
            //     item?.harga.toString(),
            //     item?.link.toString());

            if (props?.show?.type === 'pembayaran') {
                const params = {
                    name: item?.senderName,
                    no: item?.senderPhone,
                    price: item?.harga.toString(),
                    link: item?.link,
                    type: props?.show?.type
                }
                const getToken = httpsCallable(functions, 'qontakSendWAToSender');
                const result = await getToken(params);
                await setDoc(doc(firestore, 'orders', item.id), {
                    isInvWASent: true
                }, { merge: true });
            } else if (props?.show?.type === 'resi_to_receiver') {
                const params = {
                    no: item?.receiverPhone,
                    name: item?.receiverName,
                    sender: item?.senderName,
                    id: item?.id,
                    resi: item?.resi,
                    kurir: item?.kurir,
                    type: props?.show?.type
                }
                const getToken = httpsCallable(functions, 'qontakSendWAToSender');
                const result = await getToken(params);
                const indexOrder = parseInt(item?.unixId?.split('_')?.[1])
                const getDocOrd = doc(firestore, 'orders', item?.id);
                const getDataOrd = await getDoc(getDocOrd)
                const arrayField = getDataOrd.data().orders


                // if (itemIndex !== -1) {
                // Update the specific item
                arrayField[indexOrder] = { ...arrayField[indexOrder], isResiWASent: true };

                // Update the document with the modified array
                await updateDoc(getDocOrd, { orders: arrayField });
            } else if (props?.show?.type === 'resi_to_sender') {
                const params = {
                    no: item?.senderPhone,
                    name: item?.senderName,
                    receiver: item?.receiverName,
                    resi: item?.resi,
                    kurir: item?.kurir,
                    type: props?.show?.type
                }

                const getToken = httpsCallable(functions, 'qontakSendWAToSender');
                const result = await getToken(params);
                const indexOrder = parseInt(item?.unixId?.split('_')?.[1])
                const getDocOrd = doc(firestore, 'orders', item?.id);
                const getDataOrd = await getDoc(getDocOrd)
                const arrayField = getDataOrd.data().orders


                // if (itemIndex !== -1) {
                // Update the specific item
                arrayField[indexOrder] = { ...arrayField[indexOrder], isResiSentToWASender: true };

                // Update the document with the modified array
                await updateDoc(getDocOrd, { orders: arrayField });
            }

            // console.log(result)
            props?.onHide()
        } catch (e) {
            console.log(e.message)
        }
    }
    // console.log(item);

    return (
        <div
            className="modal show"
            style={{ display: 'block', position: 'initial' }}
        > <Modal
            size='lg'
            style={{
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                width: 'auto',
                height: 'auto',
                overFlowY: 'auto',
                // paddingLeft: '20px'
            }}
            scrollable={true}
            // {...props}
            show={props?.show?.open}
            onHide={props?.onHide}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Kirim ke WhatsApp?</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}>

                    {props?.show?.message}
                    {/* <MyDoc item={item} /> */}
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    <button onClick={props?.onHide} className="btn btn-outline-secondary" >
                        Close
                    </button>
                    <button onClick={sendWAToSender} className="button button-primary" >Yes</button>

                </Modal.Footer>
            </Modal>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        marginLeft: '10px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '-30px',
    },
    logo: {
        width: '200px',
        marginTop: '-50px'
    },
    invoiceDetails: {
        textAlign: 'right',
    },
    section: {
        display: 'flex',
        justifyContent: 'space-between',
        // margin: '20px 0',
    },
    addressBlock: {
        width: '48%',
    },
    title: {
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#000',
        borderBottom: '2px solid gray',
        paddingBottom: '10px'
    },
    info: {
        margin: '5px 0',
        lineHeight: '1.5',
        fontSize: '14px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
        color: '#000'
    },
    th: {
        padding: '10px',
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: '14px',
        backgroundColor: '#2e3e4e',
        // color: '#000'
    },
    td: {
        padding: '10px',
        borderBottom: '1px solid #ccc',
        textAlign: 'left',
        fontSize: '14px',
    },
    summaryBlock: {
        textAlign: 'right',
        marginTop: '20px',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'flex-end'

    },
    bold: {
        fontWeight: 'bold',
    },
    footer: {
        textAlign: 'center',
        marginTop: '40px',
        fontSize: '14px',
        // marginRight: '100px'
    },
};