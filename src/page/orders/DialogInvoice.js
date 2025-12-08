import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePDF } from "react-to-pdf";
import "./dialogDownload.css";
import logoFull from "../../logoFull.png";
import { doc, onSnapshot } from "firebase/firestore";

import formatDate, { currency, TimestampToDate } from "../../formatter";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { firestore } from "../../FirebaseFrovider";
import htmlDocx from "html-docx-js/dist/html-docx";
import { saveAs } from "file-saver";

export default function DownloadInvoiceDialog(props) {
  const item = props?.show?.data;
  const [findOrder, setFindOrder] = useState({});
  const [convertImg, setConvertImg] = useState();
  //   console.log(item);

  useEffect(() => {
    if (item?.[0]?.id) {
      const docRef = doc(firestore, "orders", item?.[0]?.id);

      const unsubscribe = onSnapshot(
        docRef,
        (doc) => {
          if (doc.exists()) {
            setFindOrder(doc.data());
          } else {
            // setError("Document does not exist");
          }
          //  setLoading(false);
        },
        (error) => {
          // setError(error.message);
          //  setLoading(false);
        }
      );

      // Cleanup subscription on component unmount
      return () => unsubscribe();
    }
  }, [item?.[0]?.id]);
  const { toPDF, targetRef } = usePDF({ filename: `${findOrder?.id}.pdf` });

  const printRef = useRef();

  const handleDownloadPDF = () => {
    const element = printRef.current;
    const opt = {
      margin: [10, 10, 10, 10], // top, right, bottom, left
      filename: `${findOrder?.id}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }, // Enable pagination by CSS
    };

    // Generate the PDF using html2pdf
    html2pdf().set(opt).from(element).save();
  };
  // const arrayId = item?.map((ord) => ord?.unixId);
  const nameOfPdf =
    item?.length > 1
      ? new Date()
          .toLocaleString()
          .replace(/ /g, "_")
          .replace(",", "")
          .replace("/", "-")
          .replace("/", "-")
          .replace(/:/g, "-")
      : item?.[0]?.unixId;

  let allProduct = [];
  findOrder?.orders?.map((ord) =>
    ord?.products?.map((prod) => {
      allProduct.push(prod);
    })
  );

  // const total = findOrder?.totalHargaProduk + allOngkir - findOrder?.additionalDiscount

  const ReformatDate = ({ date }) => {
    // console.log(date)
    const inputDate = date;

    // Convert the input string to a JavaScript Date object
    const parsedDate = new Date(inputDate);

    // Format the date using date-fns
    return date ? format(parsedDate, "dd/MM/yyyy HH:mm") : "";
  };

  const FormatFirestoreTimestamp = ({ timestamp }) => {
    // console.log(timestamp)
    // Convert Firestore timestamp to JS Date object
    const date =
      typeof timestamp === "number"
        ? new Date(timestamp * 1000)
        : timestamp.toDate();

    // Format date using date-fns to "12 Sep, 2024"
    return date ? format(date, "dd MMM, yyyy") : "";
  };

  // Get the current date and time
  const now =
    typeof item?.[0]?.createdAt === "number"
      ? new Date(item?.[0]?.createdAt * 1000)
      : item?.[0]?.createdAt?.toDate?.();
  // console.log(findOrder?.createdAt.toDate())
  // Add 7 days to the current date
  const millisecondsIn7Days = 7 * 24 * 60 * 60 * 1000;
  const futureDate = new Date(now?.getTime() + millisecondsIn7Days);

  // Format the date to "YYYY-MM-DD HH:mm:ss"
  const year = futureDate.getFullYear();
  const month = String(futureDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(futureDate.getDate()).padStart(2, "0");
  const hours = String(futureDate.getHours()).padStart(2, "0");
  const minutes = String(futureDate.getMinutes()).padStart(2, "0");
  const seconds = String(futureDate.getSeconds()).padStart(2, "0");

  // Combine into the desired format
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  const gross = allProduct?.map((prod) => parseInt(prod?.amount));
  const allGross = gross?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  const allDisc = allProduct?.map((prod) => {
    return prod?.discount > 0
      ? prod?.discount_type === "%"
        ? (parseInt(prod?.discount) / 100) * prod?.price
        : parseInt(prod?.discount)
      : 0;
  });
  const discreduce = allDisc?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  //   console.log(findOrder);
  // all ongkir
  const ongkir = findOrder?.orders?.map((ord) => parseInt(ord?.ongkir));
  const allOngkir = ongkir?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  const hideModal = () => {
    allProduct = [];
    props?.onHide();
    allProduct = [];
  };

  // kuitansi
  const previousPayments = findOrder?.kuitansi?.filter?.(
    (p) => p.id <= props?.show?.id
  );
  const cumulative = previousPayments?.reduce?.((sum, p) => sum + p.jumlah, 0);
  const sisa =
    parseInt(allGross) +
    parseInt(allOngkir) -
    (findOrder?.additionalDiscount ? findOrder?.additionalDiscount : 0) -
    cumulative;
  // console.log("all product=>", props?.show?.data);
  // console.log(new Date(item?.[0]?.createdAt * 1000));
  // console.log(new Date(item?.[0]?.createdAt * 1000));

  // docx
  useEffect(() => {
    async function convert() {
      const base64Logo = await fetch(logoFull)
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            })
        );
      setConvertImg(base64Logo);
    }
    convert();
  }, [logoFull]);

  const downloadDocx = () => {
    if (!printRef.current) return;

    const content = printRef.current.innerHTML;

    // Wrap with full HTML
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `;

    const docx = htmlDocx.asBlob(html);

    saveAs(docx, "invoice.docx");
  };
  // console.log(convertImg);
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
          zIndex: 99999,
          // paddingLeft: '20px'
        }}
        scrollable={true}
        // {...props}
        show={props?.show?.open}
        onHide={hideModal}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Download Invoice ({item?.length})</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            overFlowY: "auto",
            maxHeight: "calc(100vh - 210px)",
          }}
        >
          <div style={{ padding: "20px" }} ref={printRef}>
            {item?.map((itm) => (
              <div key={itm?.unixId} style={styles.container}>
                <div style={styles.header}>
                  <img
                    style={styles.logo}
                    src={convertImg}
                    alt="Base64"
                    width="200"
                    height="283"
                  />

                  <div style={styles.invoiceDetails}>
                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <h2 style={{ color: "#336699" }}>Invoice</h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row" }}>
                      <div>
                        <p style={{ marginBottom: "0px" }}>Reference </p>
                        <p style={{ marginBottom: "0px" }}>Date </p>
                        <p style={{ marginBottom: "0px" }}>Due Date</p>
                        <p style={{ marginBottom: "0px" }}>Status Invoice</p>
                      </div>
                      <div style={{ marginLeft: "50px" }}>
                        <p style={{ marginBottom: "0px" }}>{itm?.invoice_id}</p>
                        <p style={{ marginBottom: "0px" }}>
                          {typeof itm?.createdAt === "number" ? (
                            <TimestampToDate timestamp={itm?.createdAt} />
                          ) : (
                            formatDate(itm?.createdAt?.toDate())
                          )}
                        </p>
                        <p style={{ marginBottom: "0px" }}>
                          {" "}
                          <ReformatDate date={itm?.dueDate ?? formattedDate} />
                        </p>
                        <p style={{ marginBottom: "0px" }}>
                          {itm?.paymentStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.section}>
                  <div style={styles.addressBlock}>
                    <p style={styles.title}>Our Information</p>
                    <p style={{ color: "#327eac", fontWeight: "bold" }}>
                      PT Carramica Kreasi Indonesia
                    </p>
                    <p style={styles.info}>
                      Ruko Foodcity No. 26, Jl. Green Lake City Boulevard,
                      Jakarta Barat, DKI Jakarta, 11750
                    </p>
                    <p style={styles.info}>Phone: 087772041275</p>
                    <p style={styles.info}>
                      Email: finance.carramica@gmail.com
                    </p>
                  </div>
                  <div style={styles.addressBlock}>
                    <p style={styles.title}>Billing For</p>
                    <p style={{ color: "#327eac", fontWeight: "bold" }}>
                      {itm?.senderName}
                    </p>
                    <p style={styles.info}>Phone: {itm?.senderPhone}</p>
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Qty</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Disc</th>
                      <th style={styles.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProduct?.map((prod, i) => (
                      <tr key={prod?.id + i}>
                        <td style={styles.td}>{prod?.nama}</td>
                        <td style={styles.td}>{prod?.quantity}</td>
                        <td style={styles.td}>{currency(prod?.price)}</td>
                        <td style={styles.td}>
                          {prod?.discount_type === "%"
                            ? prod?.discount + "%"
                            : currency(prod?.discount || 0)}
                        </td>
                        <td style={styles.td}>{currency(prod?.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={styles.summaryBlock}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ marginRight: "100px", lineHeight: "5px" }}>
                      <p>
                        <span style={styles.bold}>Sub Total</span>
                      </p>
                      <p>
                        <span style={styles.bold}>Delivery Fee</span>
                      </p>
                      <p>
                        <span style={styles.bold}>Additional Discount</span>
                      </p>
                      <p>
                        <span style={styles.bold}>Total Discount</span>
                      </p>
                      <p>
                        <span style={styles.bold}>Total</span>
                      </p>

                      {props?.show?.type === "dp" && (
                        <>
                          <p>
                            <span style={styles.bold}>Paid Invoice</span>
                          </p>
                          <p>
                            <span style={styles.bold}>Outstanding Balance</span>
                          </p>
                        </>
                      )}
                    </div>
                    <div style={{ lineHeight: "5px" }}>
                      <p>
                        <span style={styles.bold}></span> {currency(allGross)}
                      </p>
                      <p>
                        <span style={styles.bold}></span> {currency(allOngkir)}
                      </p>
                      <p>
                        <span style={styles.bold}></span>{" "}
                        {currency(findOrder?.additionalDiscount)}
                      </p>
                      <p style={{ color: "red" }}>
                        <span style={styles.bold}></span> -
                        {currency(discreduce + findOrder?.additionalDiscount)}
                      </p>
                      <p>
                        <span style={styles.bold}></span>{" "}
                        {currency(
                          parseInt(allGross) +
                            parseInt(allOngkir) -
                            (findOrder?.additionalDiscount
                              ? findOrder?.additionalDiscount
                              : 0)
                        )}
                      </p>
                      {props?.show?.type === "dp" && (
                        <>
                          <p>
                            <span style={styles.bold}></span>{" "}
                            {currency(cumulative)}
                          </p>
                          <p>
                            <span style={styles.bold}></span> {currency(sisa)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <hr
                  className=" bg-dark"
                  style={{ height: "2px", marginTop: "5px" }}
                />
                <div style={styles.summaryBlock}>
                  {props?.show?.type !== "dp" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ marginRight: "100px" }}>
                        <p>
                          <span style={styles.bold}>Amount Due</span>
                        </p>
                      </div>
                      <div>
                        <p>
                          <span style={styles.bold}></span>{" "}
                          {currency(
                            parseInt(allGross) +
                              parseInt(allOngkir) -
                              (findOrder?.additionalDiscount
                                ? findOrder?.additionalDiscount
                                : 0)
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={styles.footerNotes}>
                    <p style={styles.notes}>Notes</p>
                    <p
                      style={{
                        marginTop: "0px",
                        fontWeight: "lighter",
                        textAlign: "justify",
                      }}
                    >
                      {props?.show?.type === "dp"
                        ? findOrder?.kuitansi?.[props?.show?.id]?.catatan
                        : itm?.notes ?? "__"}
                    </p>
                  </div>
                  <div style={styles.footer}>
                    <p>
                      <FormatFirestoreTimestamp timestamp={itm?.createdAt} />
                    </p>
                    <p style={{ marginTop: "80px", fontWeight: "bold" }}>
                      PT CARRAMICA KREASI INDONESIA
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* <MyDoc item={item} /> */}
        </Modal.Body>
        <Modal.Footer style={{ display: "flex" }}>
          <Button onClick={hideModal} variant="secondary">
            Close
          </Button>
          <button className="button button-blue" onClick={downloadDocx}>
            Download .docx
          </button>

          <button onClick={handleDownloadPDF} className="button button-primary">
            DownloadPdf
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    marginLeft: "10px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "-30px",
  },
  logo: {
    width: "200px",
    marginTop: "-50px",
  },
  invoiceDetails: {
    textAlign: "right",
  },
  section: {
    display: "flex",
    justifyContent: "space-between",
    // margin: '20px 0',
  },
  addressBlock: {
    width: "48%",
  },
  title: {
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#000",
    borderBottom: "2px solid gray",
    paddingBottom: "10px",
  },
  info: {
    margin: "5px 0",
    lineHeight: "1.5",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    color: "#000",
  },
  th: {
    padding: "10px",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "14px",
    backgroundColor: "#2e3e4e",
    // color: '#000'
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ccc",
    textAlign: "left",
    fontSize: "14px",
  },
  summaryBlock: {
    textAlign: "right",
    // marginTop: '20px',
    fontSize: "14px",
    display: "flex",
    justifyContent: "flex-end",
  },
  bold: {
    fontWeight: "bold",
    marginBottom: "0px",
  },
  notes: {
    borderBottom: "2px solid #ccc",
    fontWeight: "bold",
    paddingBottom: "5px",
    marginBottom: "3px",
  },
  footer: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "14px",
    width: "30%",
    // marginLeft: '10px'
    // marginRight: '100px'
  },
  footerNotes: {
    width: "70%",
    textAlign: "left",
    marginTop: "40px",
    fontSize: "14px",
    // borderBottom: '2px solid #ccc'
  },
};
