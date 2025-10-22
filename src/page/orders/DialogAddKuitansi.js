import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePDF } from "react-to-pdf";
import "../orders/dialogDownload.css";
// import logoFull from './logoFull.png';
// import sap from './sap.png'
// import lalamove from './lalamove.png'
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore, functions } from "../../FirebaseFrovider";
import { useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { format } from "date-fns";

export default function DialogAddKuitansi(props) {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (props?.show?.data) {
      const item = props?.show?.data;
      setFormData({
        ...formData,
        no_invoice: item?.invoice_id,
        jumlah: item?.grossRevenue,
      });
    }
  }, [props?.show?.data]);
  const [formData, setFormData] = useState({
    no_invoice: "",
    tanggal: "",
    metode_pembayaran: "",
    jumlah: 0,
  });
  const [formError, setFormError] = useState({
    no_invoice: "",
    tanggal: "",
    metode_pembayaran: "",
    jumlah: "",
  });
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (e.target.type === "number") {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    setFormError({
      ...formError,
      [name]: "",
    });
  };

  // validate
  const validate = () => {
    const newError = { ...formError };
    // console.log('er')

    if (!formData.no_invoice) {
      // console.log('er')
      newError.no_invoice = "no invoice is required";
    }

    if (!formData.tanggal) {
      newError.tanggal = "tanggal is required";
    }
    if (!formData.jumlah) {
      newError.jumlah = "jumlah is required";
    }
    if (!formData.metode_pembayaran) {
      newError.metode_pembayaran = "metode_pembayaran is required";
    }

    return newError;
  };
  const handleAdd = async (e) => {
    e.preventDefault();
    const findErros = validate();
    if (Object.values(findErros).some((err) => err !== "")) {
      // console.log('Errors found:', findErros);
      setFormError(findErros);
    } else {
      setLoading(true);
      try {
        if (props?.show?.mode === "edit") {
          await setDoc(
            doc(firestore, "orders", props?.show?.data?.id),
            { kuitansi: { ...formData }, updatedAt: serverTimestamp() },
            { merge: true }
          );
          // console.log("Document written with ID: ",);
          enqueueSnackbar(`sukses mengedit product ${formData?.nama}`, {
            variant: "success",
          });

          props.onHide();
        } else {
          const sendWA = httpsCallable(functions, "qontakSendWAToSender");
          await sendWA({
            name: props?.show?.data?.original?.senderName,
            no: props?.show?.data?.senderPhone,
            price: formData?.jumlah,
            type: "dp",
          });
          const orderRef = doc(firestore, "orders", props.show.data.id);
          const snap = await getDoc(orderRef);

          const existing =
            snap.exists() && Array.isArray(snap.data().kuitansi)
              ? snap.data().kuitansi
              : [];

          const newItem = {
            ...formData,
            id: existing.length,
            tanggal: format(new Date(), "dd/MM/yyyy HH:mm"),
          };
          const allKuitansi = [...existing, newItem];

          const cumulative = allKuitansi?.reduce?.(
            (sum, p) => sum + p.jumlah,
            0
          );
          //   console.log(cumulative);
          await setDoc(
            orderRef,
            {
              kuitansi: [...existing, newItem],
              paymentStatus:
                cumulative >= props?.show?.data?.grossRevenue
                  ? "settlement"
                  : "partially paid",
            },
            { merge: true }
          );

          //   await setDoc(
          //     doc(firestore, "product", tambahProduk?.id),
          //     { ...formData,  id: tambahProduk?.id },
          //     { merge: true }
          //   );
          // console.log("Document written with ID: ",);
          enqueueSnackbar(`sukses membuat kuitansi ${formData?.nama}`, {
            variant: "success",
          });
          // navigate(`/products/detailProduct/${tambahProduk?.id}`)

          props.onHide();
        }
        // props?.setUpdate((prevValue) => !prevValue);
      } catch (e) {
        console.log(e.message);
        enqueueSnackbar(`gagal menambahkan kuitansi ${e.message}`, {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };
  //   console.log(new Date());
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
          width: "500px",
          height: "auto",
          overFlowY: "auto",
        }}
        scrollable={true}
        // {...props}
        show={props?.show?.open}
        onHide={() => {
          props?.onHide();
          setFormData({});
        }}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {props?.show?.mode === "edit" ? "Edit Product" : "Buat Kuitansi"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            overFlowY: "auto",
            maxHeight: "calc(100vh - 210px)",
          }}
        >
          <div>
            <div className="form-group">
              <label className="label">Nomor Invoice</label>
              <Form.Control
                isInvalid={formError.no_invoice ? true : false}
                className="input"
                type="text"
                name="no_invoice"
                placeholder="Nomor Invoice"
                value={formData.no_invoice}
                onChange={handleFormChange}
              />
              {formError.no_invoice && (
                <Form.Control.Feedback type="invalid">
                  {formError.no_invoice}
                </Form.Control.Feedback>
              )}
            </div>
            <div className="form-group">
              <label className="label">Tanggal</label>
              <Form.Control
                isInvalid={formError.tanggal ? true : false}
                className="input"
                type="date"
                name="tanggal"
                placeholder="Tanggal"
                value={formData.tanggal}
                onChange={handleFormChange}
              />
              {formError.tanggal && (
                <Form.Control.Feedback type="invalid">
                  {formError.tanggal}
                </Form.Control.Feedback>
              )}
            </div>

            <div className="form-group">
              <label className="label">Jumlah</label>
              <Form.Control
                isInvalid={formError.jumlah ? true : false}
                className="input"
                type="number"
                name="jumlah"
                placeholder="10000"
                value={formData.jumlah}
                onChange={handleFormChange}
              />
              {formError.jumlah && (
                <Form.Control.Feedback type="invalid">
                  {formError.jumlah}
                </Form.Control.Feedback>
              )}
            </div>
            <div className="form-group">
              <label className="label">Metode Pembayaran</label>
              <Form.Select
                isInvalid={formError.metode_pembayaran ? true : false}
                defaultValue={formData.metode_pembayaran}
                defaultChecked={false}
                className="select"
                name="metode_pembayaran"
                value={formData.metode_pembayaran}
                onChange={handleFormChange}
              >
                <option selected hidden>
                  Metode Pembayaran
                </option>

                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                {/* <option value="cherry">🍒 Cherry</option> */}
              </Form.Select>
              {formError.metode_pembayaran && (
                <Form.Control.Feedback type="invalid">
                  {formError.metode_pembayaran}
                </Form.Control.Feedback>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ display: "flex" }}>
          {/* <Button variant="secondary" >
                        Close
                    </Button> */}
          <button
            disabled={loading}
            onClick={handleAdd}
            className="button button-primary"
          >
            {props?.show?.mode === "edit" ? "Update" : "Buat Kuitansi"}
          </button>

          {/* <button className="button button-primary" >Understood</button> */}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
