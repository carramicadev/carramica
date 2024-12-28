import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { usePDF } from 'react-to-pdf';
import './dialogDownload.css';
import logoFull from '../../logoFull.png';
import sap from '../../sap.png'
import paxel from '../../paxel.png'
import lalamove from '../../lalamove.png'
import { arrayUnion, doc, getDoc, onSnapshot, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
// import { firestore } from './FirebaseFrovider';
import { Document, Image, Page, PDFDownloadLink, StyleSheet, Text, View } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { firestore } from '../../FirebaseFrovider';
import formatDate, { TimestampToDate } from '../../formatter';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        padding: 5,
        fontSize: 8,
        maxHeight: '206px',
        height: '206px'
    },
    leftSection: {
        width: '65%',
        // paddingRight: 5,
        borderRight: '5px dashed black',
        borderLeft: '2 solid black',
        borderTop: '2px solid black',
        borderBottom: '2px solid black',
        padding: '10px 5px 10px 10px'
        // marginLeft: '10px'

    },
    rightSection: {
        width: '35%',
        // paddingLeft: 5,
        borderRight: '2 solid black',
        borderTop: '2px solid black',
        borderBottom: '2px solid black',
        padding: '10px 10px 10px 5px'
        // marginRight: '10px'

    },
    header: {
        fontSize: 10,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subHeader: {
        fontSize: 10,

    },
    text: {
        marginBottom: 5,
    },
    image: {
        width: 70,
        // marginBottom: 10,
    },
    imageSAP: {
        width: 35,
        // marginBottom: 10,
    },
    imageLogo: {
        width: 60,
        marginTop: -40,
    },
    imageKurirLeft: {
        width: 60,
        marginTop: -15,
    },
    imageKurirSAP: {
        width: 35,
        marginTop: -20,
        marginLeft: 10

    },
    logo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // marginTop: '40px'
    },
    subItem: {
        flexDirection: 'row'
    },
    subItem1: {
        width: '18%',
        marginBottom: 5,
    },
    subItem2: {
        width: '60%',
        marginBottom: 5,
        marginTop: '1px'
    },
    subItem3: {
        width: '25%',
        marginBottom: 5,
        marginRight: 20
    },
    subItem4: {
        width: '85%',
        marginBottom: 5,
        marginTop: '1px'
    },
    disabledButton: { textDecoration: 'none', pointerEvents: 'none', backgroundColor: 'lightgray' },
    allowedButton: { textDecoration: 'none', }
});
function MyDoc({ item, setLoading }) {
    const chunkArray = (arr, size) => {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    };
    const chunks = chunkArray(item, 4);

    return <Document
        onRender={() => setLoading(false)}
    >
        {chunks.map((chunk, chunkIndex) => (
            <Page size="A4" key={chunkIndex} >
                {
                    chunk?.map?.((data, index) => {
                        const urlImage = data.kurir === 'SAP' ? sap : data.kurir === 'Lalamove' ? lalamove : data.kurir === 'Paxel' ? paxel : ''
                        // console.log(data?.nama)
                        return <View key={data?.unixId} style={styles.page}>
                            {/* Left Section */}
                            <View style={styles.leftSection}>

                                <Text style={styles.header}>Gift Card:</Text>
                                <Text style={styles.text}>
                                    {data?.giftCard}
                                </Text>
                                <View style={styles.subItem}>

                                    <View style={styles.subItem1}>
                                        <Text style={styles.subHeader}>To:</Text>
                                    </View>
                                    <View style={styles.subItem4}>
                                        <Text style={styles.text}>{data?.original?.receiverName}</Text>
                                        <Text style={styles.text}>{data?.receiverPhone}</Text>
                                        <Text style={styles.text}>
                                            {data?.original?.address}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.subItem}>

                                    <View style={styles.subItem1}>
                                        <Text style={styles.subHeader}>From:</Text>
                                    </View>
                                    <View style={styles.subItem4}>
                                        <Text style={styles.text}>{data?.original?.senderName}</Text>
                                    </View>
                                </View>
                                <View style={styles.logo}>
                                    {/* <Image
                                    style={styles.image}
                                    src={logoFull}
                                /> */}
                                    <Text style={styles.text}>Shipping Date :{typeof data?.shippingDate === 'number' ? <TimestampToDate timestamp={data?.shippingDate} /> : formatDate(data?.shippingDate?.toDate?.())}</Text>
                                    {
                                        data?.kurir !== 'Dedicated' &&
                                        <Image
                                            style={data?.kurir === 'SAP' ? styles.imageSAP : styles.image}
                                            src={urlImage}
                                        />
                                    }
                                </View>

                            </View>

                            {/* Right Section */}
                            <View style={styles.rightSection}>
                                <View style={styles.subItem}>

                                    <View style={styles.subItem1}>
                                        <Text style={styles.header}>To:</Text>
                                    </View>
                                    <View style={styles.subItem4}>
                                        <Text style={styles.text}>{data?.original?.receiverName}</Text>
                                        <Text style={styles.text}>{data?.receiverPhone}</Text>
                                        <Text style={styles.text}>
                                            {data?.original?.address}                                    </Text>
                                    </View>
                                </View>
                                <View style={styles.subItem}>
                                    <View style={styles.subItem1}>
                                        <Text style={styles.header}>From:</Text>
                                    </View>
                                    <View style={styles.subItem4}>
                                        <Text style={styles.text}>{data?.original?.senderName}</Text>
                                        <Text style={styles.text}>{data?.senderPhone}</Text>
                                    </View>
                                </View>
                                <View style={styles.subItem}>
                                    <View style={styles.subItem1}>
                                        <Text style={styles.header}>Order:</Text>

                                    </View>
                                    <View style={styles.subItem2}>
                                        <Text style={styles.text}>{data?.unixId}/{data?.ordId}</Text>
                                        <Text style={styles.text}>{data.nama.map((nama, i) => {
                                            return <Text key={i}>{nama} <br /></Text>
                                        })}</Text>
                                    </View>
                                    <View style={styles.subItem3}>
                                        <Image
                                            style={styles.imageLogo}
                                            src={logoFull}
                                        />
                                        {
                                            data?.kurir !== 'Dedicated' &&
                                            <Image
                                                style={data?.kurir === 'SAP' ? styles.imageKurirSAP : styles.imageKurirLeft}
                                                src={urlImage}
                                            />
                                        }
                                    </View>
                                </View>


                            </View>
                        </View>
                    })
                }
            </Page>

        ))}

    </Document>
}

export default function DownloadPdfDialog(props) {
    const { toPDF, targetRef } = usePDF({ filename: 'page.pdf' });
    const item = props?.show?.data;
    // console.log(props?.show?.userId)
    // console.log(item)
    const downloadPdf = async () => {
        try {
            await Promise.all(
                item?.map?.(async (data) => {
                    const indexOrder = parseInt(data?.unixId?.split('_')?.[1], 10);
                    const getDocOrd = doc(firestore, 'orders', data?.id);

                    // Use Firestore transaction to ensure consistent updates
                    await runTransaction(firestore, async (transaction) => {
                        const getDataOrd = await transaction.get(getDocOrd);

                        if (!getDataOrd.exists()) {
                            throw new Error(`Document with ID ${data?.id} does not exist`);
                        }

                        const arrayField = getDataOrd.data().orders;

                        // Update only if the array element is not already marked as downloaded
                        if (!arrayField[indexOrder]?.isDownloaded) {
                            arrayField[indexOrder] = { ...arrayField[indexOrder], isDownloaded: true, downloadedBy: props?.show?.userId ?? '' };

                            // console.log('Updated orders array:', arrayField);

                            // Perform the update within the transaction
                            transaction.update(getDocOrd, { orders: arrayField });
                        }
                    });

                    // Trigger UI updates
                    props?.setUpdate((prevValue) => !prevValue);
                    props?.onHide();
                    // setLoading(true)

                })
            );
        } catch (e) {
            console.log(`Error updating document: ${e.message}`);
        }
    };

    // const arrayId = item?.map((ord) => ord?.unixId);
    const nameOfPdf = item?.length > 1 ? new Date().toLocaleString().replace(/ /g, '_').replace(',', '').replace('/', '-').replace('/', '-').replace(/:/g, '-') : item?.[0]?.unixId
    // console.log(new Date().toLocaleString().replace(/ /g, '_').replace(',', '').replace('/', '-').replace('/', '-'))

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
                overFlowY: 'auto'
            }}
            scrollable={true}
            // {...props}
            show={props?.show?.open}
            onHide={() => {
                props?.onHide();
                // setLoading(true);

            }}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Download Invoice ({item?.length})</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}>

                    {
                        props?.loading ?
                            <p>Loading PDF...</p> :
                            <div ref={targetRef}>
                                <div className="">
                                    {
                                        item?.map?.((data, index) => {
                                            // console.log(data?.nama)
                                            return <>
                                                <table key={index} className="gift-card-table" >
                                                    <tbody>
                                                        <tr>
                                                            <td className="left-section" style={{ width: '70%', whiteSpace: 'normal' }}>
                                                                <p ><strong>Gift Card:</strong><br />{data?.giftCard}</p>
                                                                <p><strong>To:</strong>{data?.original?.receiverName}<br />{data?.receiverPhone}<br />{data?.original?.address}</p>
                                                                <p><strong>From:</strong><br />{data?.original?.senderName}<br /></p>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
                                                                    <p>Shipping Date: {typeof data?.shippingDate === 'number' ? <TimestampToDate timestamp={data?.shippingDate} /> : formatDate(data?.shippingDate?.toDate?.())}</p>
                                                                    <div className="logoKurir">

                                                                        <img src={data.kurir === 'SAP' ? sap : data.kurir === 'Lalamove' ? lalamove : data.kurir === 'Paxel' ? paxel : ''} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="right-section" style={{ width: '30%', whiteSpace: 'normal' }}>
                                                                <p><strong>To:</strong><br />{data?.original?.receiverName}<br />{data?.receiverPhone}<br />{data?.original?.address}</p>
                                                                <p><strong>From:</strong><br />{data?.original?.senderName}<br />{data?.senderPhone}</p>

                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <p><strong>Order:</strong><br />{data?.id}<br />
                                                                        {data.nama.map((nama, i) => {
                                                                            return <>{nama} <br /></>
                                                                        })}
                                                                    </p>
                                                                    <div className="logos">
                                                                        <img src={logoFull}

                                                                            alt="Carramica Logo" />
                                                                        <div
                                                                            style={data.kurir === 'SAP' ? { marginTop: '-25px', marginLeft: '20px' } : { marginTop: '-25px', marginLeft: '-40px' }}
                                                                            className="logoKurir">

                                                                            <img src={data.kurir === 'SAP' ? sap : data.kurir === 'Lalamove' ? lalamove : data.kurir === 'Paxel' ? paxel : ''} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </>

                                        })
                                    }
                                </div>
                            </div>
                    }
                    {/* <MyDoc item={item} /> */}
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    <Button variant="secondary" onClick={() => {
                        // setLoading(true);
                        props?.onHide()
                    }} >
                        Close
                    </Button>
                    {/* <button onClick={downloadPdf} className="button button-primary" >DownloadPdf</button> */}
                    <PDFDownloadLink className='button button-primary' style={item?.length < 1 ? styles.disabledButton : props?.loading ? styles.disabledButton : styles.allowedButton} onClick={downloadPdf} document={<MyDoc item={item} setLoading={props?.setLoading} />} fileName={`CRM-${nameOfPdf}.pdf`}>
                        {props?.loading ? 'Loading document...' : 'Download PDF'}
                    </PDFDownloadLink>
                </Modal.Footer>
            </Modal>
        </div>
    );
}