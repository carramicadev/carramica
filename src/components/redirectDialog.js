import Modal from "react-bootstrap/Modal";

export default function RedirectDialog({ show, handleClose, link }) {
  // console.log(formData)
  const targetUrl = `https://${link}`;
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
        show={show}
        // onHide={handleClose}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title>Pembayaran sudah dipilih</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            overFlowY: "auto",
            maxHeight: "calc(100vh - 210px)",
          }}
        >
          <p>Silahkan klik link berikut untuk melanjutkan pembayaran anda</p>
          <a href={targetUrl}>link pembayaran</a>
        </Modal.Body>
      </Modal>
    </div>
  );
}
