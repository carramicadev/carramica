import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePDF } from "react-to-pdf";
import "./dialogDownload.css";
import logoFull from "../../logoFull.png";
import sap from "../../sap.png";
import paxel from "../../paxel.png";
import lalamove from "../../lalamove.png";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
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
            const urlImage =
              data.kurir === "SAP" ||
              data.kurir === "Dedicated-SAP Regular" ||
              data.kurir === "Dedicated-SAP Cargo"
                ? sap
                : data.kurir === "Lalamove" ||
                  data.kurir === "Dedicated-Lalamove"
                ? lalamove
                : data.kurir === "Paxel" ||
                  data.kurir === "Dedicated-Paxel Regular" ||
                  data.kurir === "Dedicated-Paxel Big"
                ? paxel
                : "";
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
                    {data?.kurirService && (
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
                      <Text style={styles.text}>
                        {data.nama.map((nama, i) => {
                          return (
                            <Text key={i}>
                              {nama} <br />
                            </Text>
                          );
                        })}
                      </Text>
                    </View>
                    <View style={styles.subItem3}>
                      <Image style={styles.imageLogo} src={logoFull} />
                      {data?.kurirService && (
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
    async function MakePdf() {
      try {
        const blobMake = await pdf(
          <MyDoc item={item} setLoading={props?.setLoading} />
        ).toBlob();
        setBlob(blobMake);
      } catch (e) {}
    }
    MakePdf();
  }, [item, props?.setLoading]);
  const downloadPdf = async () => {
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
                isDownloaded: false,
                downloadedBy: props?.show?.userId ?? "",
              };

              transaction.update(getDocOrd, { orders });
            }
          });
        })
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
          {props?.loading ? (
            <p>Loading PDF...</p>
          ) : (
            <div ref={targetRef}>
              <div className="">
                {item?.map?.((data, index) => {
                  // console.log(data?.nama)
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
                                  <img
                                    src={
                                      data.kurir === "SAP" ||
                                      data.kurir === "Dedicated-SAP Regular" ||
                                      data.kurir === "Dedicated-SAP Cargo"
                                        ? sap
                                        : data.kurir === "Lalamove" ||
                                          data.kurir === "Dedicated-Lalamove"
                                        ? lalamove
                                        : data.kurir === "Paxel" ||
                                          data.kurir ===
                                            "Dedicated-Paxel Regular" ||
                                          data.kurir === "Dedicated-Paxel Big"
                                        ? paxel
                                        : ""
                                    }
                                  />
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
                                    <img
                                      style={{
                                        width:
                                          data.kurir === "SAP"
                                            ? "auto"
                                            : data.kurirService && 100,
                                      }}
                                      src={
                                        data.kurir === "SAP" ||
                                        data.kurir ===
                                          "Dedicated-SAP Regular" ||
                                        data.kurir === "Dedicated-SAP Cargo"
                                          ? sap
                                          : data.kurir === "Lalamove" ||
                                            data.kurir === "Dedicated-Lalamove"
                                          ? lalamove
                                          : data.kurir === "Paxel" ||
                                            data.kurir ===
                                              "Dedicated-Paxel Regular" ||
                                            data.kurir === "Dedicated-Paxel Big"
                                          ? paxel
                                          : ""
                                      }
                                    />
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
              item?.length < 1
                ? styles.disabledButton
                : props?.loading
                ? styles.disabledButton
                : styles.allowedButton
            }
            onClick={downloadPdf}
            // document={<MyDoc item={item} setLoading={props?.setLoading} />}
            // fileName={`CRM-${nameOfPdf}.pdf`}
          >
            {props?.loading ? "Loading document..." : "Download PDF"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
