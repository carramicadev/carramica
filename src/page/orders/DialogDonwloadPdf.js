import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePDF } from "react-to-pdf";
import "./dialogDownload.css";
import logoFull from "../../logoFull.png";
import sap from "../../sap.png";
import paxel from "../../paxel.png";
import lalamove from "../../lalamove.png";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
// import { firestore } from './FirebaseFrovider';
import {
  Document,
  Font,
  Image,
  Page,
  pdf,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import { firestore } from "../../FirebaseFrovider";
import formatDate, { TimestampToDate } from "../../formatter";
import { useSnackbar } from "notistack";
import { saveAs } from "file-saver";

Font.register({
  family: "chinese",
  src: "https://fonts.gstatic.com/s/zcoolkuaile/v7/tssqApdaRQokwFjFJjvM6h2WpozzoXhC2g.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    padding: 5,
    fontSize: 8,
    maxHeight: "206px",
    height: "206px",
  },
  leftSection: {
    width: "65%",
    // paddingRight: 5,
    borderRight: "5px dashed black",
    borderLeft: "2 solid black",
    borderTop: "2px solid black",
    borderBottom: "2px solid black",
    padding: "10px 5px 10px 10px",
    // marginLeft: '10px'
  },
  rightSection: {
    width: "35%",
    // paddingLeft: 5,
    borderRight: "2 solid black",
    borderTop: "2px solid black",
    borderBottom: "2px solid black",
    padding: "10px 10px 10px 5px",
    // marginRight: '10px'
  },
  header: {
    fontSize: 10,
    marginBottom: 10,
    fontWeight: "bold",
  },
  subHeader: {
    fontSize: 10,
  },
  text: {
    marginBottom: 5,
  },
  textProduct: {
    fontSize: 6,
    marginBottom: 5,
  },
  textGC: {
    marginBottom: 5,
    // fontFamily: 'chinese'
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
    marginLeft: 10,
  },
  logo: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // marginTop: '40px'
  },
  subItem: {
    flexDirection: "row",
  },
  subItem1: {
    width: "18%",
    marginBottom: 5,
  },
  subItem2: {
    width: "60%",
    marginBottom: 5,
    marginTop: "1px",
  },
  subItem3: {
    width: "25%",
    marginBottom: 5,
    marginRight: 20,
  },
  subItem4: {
    width: "85%",
    marginBottom: 5,
    marginTop: "1px",
  },
  disabledButton: {
    textDecoration: "none",
    pointerEvents: "none",
    backgroundColor: "lightgray",
  },
  allowedButton: { textDecoration: "none" },
});
// Courier logo for the shipping label, or null when this courier has no logo.
// Case-insensitive and partial, so "SAP", "Dedicated-SAP Cargo" or
// "Paxel Big" all match. Returning null (instead of "") matters: react-pdf's
// <Image> throws "Image should receive either a src or source prop" on an
// empty src, which used to leave the dialog stuck on "Loading document...".
const getCourierLogo = (kurir) => {
  const name = String(kurir ?? "").toLowerCase();
  if (name.includes("sap")) return sap;
  if (name.includes("lalamove")) return lalamove;
  if (name.includes("paxel")) return paxel;
  return null;
};

function MyDoc({ item, setLoading }) {
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };
  const chunks = chunkArray(item, 4);

  return (
    <Document onRender={() => setLoading(false)}>
      {chunks.map((chunk, chunkIndex) => (
        <Page size="A4" key={chunkIndex}>
          {chunk?.map?.((data, index) => {
            const urlImage = getCourierLogo(data?.kurir);
            // console.log(urlImage)
            return (
              <View key={data?.unixId} style={styles.page}>
                {/* Left Section */}
                <View style={styles.leftSection}>
                  <Text style={styles.header}>Gift Card:</Text>
                  <Text style={styles.textGC}>{data?.giftCard}</Text>
                  <View style={styles.subItem}>
                    <View style={styles.subItem1}>
                      <Text style={styles.subHeader}>To:</Text>
                    </View>
                    <View style={styles.subItem4}>
                      <Text style={styles.text}>
                        {data?.original?.receiverName}
                      </Text>
                      <Text style={styles.text}>{data?.receiverPhone}</Text>
                      <Text style={styles.text}>{data?.original?.address}</Text>
                    </View>
                  </View>
                  <View style={styles.subItem}>
                    <View style={styles.subItem1}>
                      <Text style={styles.subHeader}>From:</Text>
                    </View>
                    <View style={styles.subItem4}>
                      <Text style={styles.text}>
                        {data?.original?.senderName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.logo}>
                    {/* <Image
                                    style={styles.image}
                                    src={logoFull}
                                /> */}
                    <Text style={styles.text}>
                      Shipping Date :
                      {typeof data?.shippingDate === "number" ? (
                        <TimestampToDate timestamp={data?.shippingDate} />
                      ) : (
                        formatDate(data?.shippingDate?.toDate?.())
                      )}
                    </Text>
                    {data?.kurirService && urlImage && (
                      <Image
                        style={
                          data?.kurir === "SAP" ? styles.imageSAP : styles.image
                        }
                        src={urlImage}
                      />
                    )}
                  </View>
                </View>

                {/* Right Section */}
                <View style={styles.rightSection}>
                  <View style={styles.subItem}>
                    <View style={styles.subItem1}>
                      <Text style={styles.header}>To:</Text>
                    </View>
                    <View style={styles.subItem4}>
                      <Text style={styles.text}>
                        {data?.original?.receiverName}
                      </Text>
                      <Text style={styles.text}>{data?.receiverPhone}</Text>
                      <Text style={styles.text}>
                        {data?.original?.address}{" "}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.subItem}>
                    <View style={styles.subItem1}>
                      <Text style={styles.header}>From:</Text>
                    </View>
                    <View style={styles.subItem4}>
                      <Text style={styles.text}>
                        {data?.original?.senderName}
                      </Text>
                      <Text style={styles.text}>{data?.senderPhone}</Text>
                    </View>
                  </View>
                  <View style={styles.subItem}>
                    <View style={styles.subItem1}>
                      <Text style={styles.header}>Order:</Text>
                    </View>
                    <View style={styles.subItem2}>
                      <Text style={styles.text}>
                        {data?.unixId}/{data?.ordId}
                      </Text>
                      <Text style={styles.textProduct}>
                        {data.nama.map((nama, i) => {
                          return (
                            <Text key={i} style={styles.textProduct}>
                              {nama} <br />
                            </Text>
                          );
                        })}
                      </Text>
                    </View>
                    <View style={styles.subItem3}>
                      <Image style={styles.imageLogo} src={logoFull} />
                      {data?.kurirService && urlImage && (
                        <Image
                          style={
                            data?.kurir === "SAP"
                              ? styles.imageKurirSAP
                              : styles.imageKurirLeft
                          }
                          src={urlImage}
                        />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </Page>
      ))}
    </Document>
  );
}

export default function DownloadPdfDialog(props) {
  const { toPDF, targetRef } = usePDF({ filename: "page.pdf" });
  const item = props?.show?.data;
  const { enqueueSnackbar } = useSnackbar();
  const [blob, setBlob] = useState();
  const [pdfError, setPdfError] = useState("");
  // console.log(props?.show?.userId)
  // console.log(item)
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

  useEffect(() => {
    let cancelled = false;
    async function MakePdf() {
      setBlob(undefined);
      setPdfError("");
      try {
        const blobMake = await pdf(
          <MyDoc item={item} setLoading={props?.setLoading} />
        ).toBlob();
        if (!cancelled) setBlob(blobMake);
      } catch (e) {
        // Never fail silently: without this the button stays on
        // "Loading document..." forever.
        if (cancelled) return;
        console.error("Gagal membuat PDF:", e);
        setPdfError(e?.message || String(e));
        props?.setLoading?.(false);
        enqueueSnackbar(`Gagal membuat PDF: ${e?.message || e}`, {
          variant: "error",
        });
      }
    }
    if (item?.length) MakePdf();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, props?.setLoading]);
  const pdfReady = !!blob && !pdfError;
  const downloadPdf = async () => {
    // don't mark orders as downloaded when there is no file to save
    if (!pdfReady) return;
    try {
      await Promise.all(
        item.map(async (data) => {
          const getDocOrd = doc(firestore, "orders", data.id);

          await runTransaction(firestore, async (transaction) => {
            const snap = await transaction.get(getDocOrd);
            if (!snap.exists()) {
              throw new Error(`Document ${data.id} not found`);
            }

            const orders = [...(snap.data().orders || [])];

            // 🔥 FIND BY UNIQUE KEY (NOT INDEX)
            const orderIndex = orders.findIndex(
              (o) => o.orderId === data.ordId
            );

            if (orderIndex === -1) return;

            if (!orders[orderIndex].isDownloaded) {
              orders[orderIndex] = {
                ...orders[orderIndex],
                isDownloaded: true,
                downloadedBy: props?.show?.userId ?? "",
              };

              transaction.update(getDocOrd, { orders });
            }
          });
        })
      );

      // 2️⃣ Generate PDF ONLY if update succeeds

      // 3️⃣ Download
      saveAs(blob, `CRM-${nameOfPdf}.pdf`);
      // ✅ UI updates only ONCE after all transactions finish
      props?.setUpdate((prev) => !prev);
      props?.onHide();
    } catch (e) {
      await Promise.all(
        item.map(async (data) => {
          const getDocOrd = doc(firestore, "orders", data.id);

          await runTransaction(firestore, async (transaction) => {
            const snap = await transaction.get(getDocOrd);
            if (!snap.exists()) {
              throw new Error(`Document ${data.id} not found`);
            }

            const orders = [...(snap.data().orders || [])];

            // 🔥 FIND BY UNIQUE KEY (NOT INDEX)
            const orderIndex = orders.findIndex(
              (o) => o.orderId === data.ordId
            );

            if (orderIndex === -1) return;

            if (orders[orderIndex].isDownloaded) {
              orders[orderIndex] = {
                ...orders[orderIndex],
                isDownloaded: true,
                downloadedBy: props?.show?.userId ?? "",
              };

              transaction.update(getDocOrd, { orders });
            }
          });
        })
      );
      await addDoc(
        collection(firestore, "error-data", "FE", "download-shipping"),
        {
          message: e.message,
          createdAt: serverTimestamp(),
        }
      );
      enqueueSnackbar(`gagal mendownload invoice ${e.message}`, {
        variant: "error",
      });
      console.error("Error updating document:", e);
    }
  };

  // const arrayId = item?.map((ord) => ord?.unixId);

  // console.log(new Date().toLocaleString().replace(/ /g, '_').replace(',', '').replace('/', '-').replace('/', '-'))

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
        <Modal.Body
          style={{
            overFlowY: "auto",
            maxHeight: "calc(100vh - 210px)",
          }}
        >
          {pdfError && (
            <div className="alert alert-danger" role="alert">
              PDF gagal dibuat: {pdfError}
            </div>
          )}
          {props?.loading ? (
            <p>Loading PDF...</p>
          ) : (
            <div ref={targetRef}>
              <div className="">
                {item?.map?.((data, index) => {
                  // console.log(data);
                  return (
                    <>
                      <table key={index} className="gift-card-table">
                        <tbody>
                          <tr>
                            <td
                              className="left-section"
                              style={{ width: "70%", whiteSpace: "normal" }}
                            >
                              <p>
                                <strong>Gift Card:</strong>
                                <br />
                                {data?.giftCard}
                              </p>
                              <p>
                                <strong>To:</strong>
                                {data?.original?.receiverName}
                                <br />
                                {data?.receiverPhone}
                                <br />
                                {data?.original?.address}
                              </p>
                              <p>
                                <strong>From:</strong>
                                <br />
                                {data?.original?.senderName}
                                <br />
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginTop: "50px",
                                }}
                              >
                                <p>
                                  Shipping Date:{" "}
                                  {typeof data?.shippingDate === "number" ? (
                                    <TimestampToDate
                                      timestamp={data?.shippingDate}
                                    />
                                  ) : (
                                    formatDate(data?.shippingDate?.toDate?.())
                                  )}
                                </p>
                                <div className="logoKurir">
                                  {getCourierLogo(data?.kurir) && (
                                    <img
                                      src={getCourierLogo(data?.kurir)}
                                      alt="Logo kurir"
                                    />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td
                              className="right-section"
                              style={{ width: "30%", whiteSpace: "normal" }}
                            >
                              <p>
                                <strong>To:</strong>
                                <br />
                                {data?.original?.receiverName}
                                <br />
                                {data?.receiverPhone}
                                <br />
                                {data?.original?.address}
                              </p>
                              <p>
                                <strong>From:</strong>
                                <br />
                                {data?.original?.senderName}
                                <br />
                                {data?.senderPhone}
                              </p>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 6,
                                }}
                              >
                                <p>
                                  <strong>Order:</strong>
                                  <br />
                                  {data?.id}
                                  <br />
                                  {data.nama.map((nama, i) => {
                                    return (
                                      <>
                                        {nama} <br />
                                      </>
                                    );
                                  })}
                                </p>
                                <div className="logos">
                                  <img src={logoFull} alt="Carramica Logo" />
                                  <div
                                    style={
                                      data.kurir === "SAP"
                                        ? {
                                            marginTop: "-25px",
                                            marginLeft: "20px",
                                          }
                                        : {
                                            marginTop: "-25px",
                                            marginLeft: "0px",
                                            width: "60px",
                                          }
                                    }
                                    className="logoKurir"
                                  >
                                    {getCourierLogo(data?.kurir) && (
                                      <img
                                        style={{
                                          width:
                                            data.kurir === "SAP"
                                              ? "auto"
                                              : data.kurirService && 100,
                                        }}
                                        src={getCourierLogo(data?.kurir)}
                                        alt="Logo kurir"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  );
                })}
              </div>
            </div>
          )}
          {/* <MyDoc item={item} /> */}
        </Modal.Body>
        <Modal.Footer style={{ display: "flex" }}>
          <Button
            variant="secondary"
            onClick={() => {
              // setLoading(true);
              props?.onHide();
            }}
          >
            Close
          </Button>
          {/* <button onClick={downloadPdf} className="button button-primary" >DownloadPdf</button> */}
          <Button
            className="button button-primary"
            style={
              item?.length < 1 || !pdfReady
                ? styles.disabledButton
                : styles.allowedButton
            }
            onClick={downloadPdf}
            // document={<MyDoc item={item} setLoading={props?.setLoading} />}
            // fileName={`CRM-${nameOfPdf}.pdf`}
          >
            {pdfError
              ? "Gagal membuat PDF"
              : !pdfReady
                ? "Loading document..."
                : "Download PDF"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
