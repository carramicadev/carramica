import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePDF } from "react-to-pdf";
import "./dialogDownload.css";
import { firestore, functions } from "../../FirebaseFrovider";
import { useState } from "react";

export default function DialogSendWA(props) {
  const item = props?.show?.data;
  // qontak
  // console.log(item)
  const [loading, setLoading] = useState(false);
  const sendWAToSender = async () => {
    setLoading(true);
    try {
      // console.log(item?.senderName,
      //     item?.senderPhone,
      //     item?.harga.toString(),
      //     item?.link.toString());

      if (props?.show?.type === "pembayaran") {
        const params = {
          name: item?.senderName,
          no: item?.senderPhone,
          price: item?.harga.toString(),
          link: item?.link,
          type: props?.show?.type,
        };
        const getToken = httpsCallable(functions, "qontakSendWAToSender");
        const result = await getToken(params);
        await setDoc(
          doc(firestore, "orders", item.id),
          {
            isInvWASent: true,
          },
          { merge: true }
        );
      } else if (props?.show?.type === "resi_to_receiver") {
        const params = {
          no: item?.receiverPhone,
          name: item?.original?.receiverName,
          sender: item?.original?.senderName,
          id: item?.id,
          resi: item?.resi,
          kurir: item?.kurir,
          type: props?.show?.type,
        };
        console.log(params);
        const getToken = httpsCallable(functions, "qontakSendWAToSender");
        const result = await getToken(params);
        const indexOrder = parseInt(item?.unixId?.split("_")?.[1]);
        const getDocOrd = doc(firestore, "orders", item?.id);
        const getDataOrd = await getDoc(getDocOrd);
        const arrayField = getDataOrd.data().orders;

        // if (itemIndex !== -1) {
        // Update the specific item
        arrayField[indexOrder] = {
          ...arrayField[indexOrder],
          isResiWASent: true,
        };

        // Update the document with the modified array
        await updateDoc(getDocOrd, { orders: arrayField });
      } else if (props?.show?.type === "resi_to_sender") {
        const params = {
          no: item?.senderPhone,
          name: item?.original?.senderName,
          receiver: item?.original?.receiverName,
          resi: item?.resi,
          kurir: item?.kurir,
          type: props?.show?.type,
        };

        const getToken = httpsCallable(functions, "qontakSendWAToSender");
        const result = await getToken(params);
        const indexOrder = parseInt(item?.unixId?.split("_")?.[1]);
        const getDocOrd = doc(firestore, "orders", item?.id);
        const getDataOrd = await getDoc(getDocOrd);
        const arrayField = getDataOrd.data().orders;

        // if (itemIndex !== -1) {
        // Update the specific item
        arrayField[indexOrder] = {
          ...arrayField[indexOrder],
          isResiSentToWASender: true,
        };

        // Update the document with the modified array
        await updateDoc(getDocOrd, { orders: arrayField });
      }

      // console.log(result)
      props?.onHide();
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
    }
  };
  console.log(props?.show?.type);

  return (
    <div
      className="modal show"
      style={{ display: "block", position: "initial" }}
    >
      {" "}
      <Modal
        size="lg"
        style={{
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          width: "auto",
          height: "auto",
          overFlowY: "auto",
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
        <Modal.Body
          style={{
            overFlowY: "auto",
            maxHeight: "calc(100vh - 210px)",
          }}
        >
          {props?.show?.message}
          {/* <MyDoc item={item} /> */}
        </Modal.Body>
        <Modal.Footer style={{ display: "flex" }}>
          <button onClick={props?.onHide} className="btn btn-outline-secondary">
            Close
          </button>
          <button
            disabled={loading}
            onClick={sendWAToSender}
            className="button button-primary"
          >
            Yes
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
