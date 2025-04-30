import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams } from "react-router-dom";
import { firestore, functions } from "../FirebaseFrovider";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { addDays, format } from "date-fns";
import RedirectDialog from "./redirectDialog";

const PaymentPage = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  useEffect(() => {
    const docRef = doc(firestore, "orders", id);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setForm({
            ...form,
            ...doc.data(),
          });
        } else {
          // setError("Document does not exist");
        }
        setLoading(false);
      },
      (error) => {
        // setError(error.message);
        setLoading(false);
        console.log(error);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [id]);

  console.log(form);
  // Payment methods data with mixed fee types
  const paymentMethods = [
    // QRIS - no fee
    {
      method: "qris",
      channel: "qris",
      name: "QRIS",
      description: "Pay with any e-wallet via QRIS",
      icon: "https://upload.wikimedia.org/wikipedia/commons/e/e0/QRIS_Logo.svg",
      fee: 0.7,
      feeType: "percent", // fixed or percent
    },
    // Virtual Accounts - fixed fees
    {
      method: "virtual_account",
      channel: "bni",
      name: "BNI VA",
      description: "BNI Virtual Account",
      icon: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg",
      fee: 2500,
      feeType: "fixed",
    },
    {
      method: "virtual_account",
      channel: "mandiri",
      name: "Mandiri VA",
      description: "Mandiri Virtual Account",
      icon: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
      fee: 2500,
      feeType: "fixed",
    },
    {
      method: "virtual_account",
      channel: "bri",
      name: "BRI VA",
      description: "BRI Virtual Account",
      icon: "https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_BRI.png",
      fee: 2500,
    },
    {
      method: "virtual_account",
      channel: "permata",
      name: "Permata VA",
      description: "Permata Virtual Account",
      icon: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg",
      fee: 2500,
    },
    // E-Wallets - percentage fees
    {
      method: "e-wallet",
      channel: "ovo",
      name: "OVO",
      description: "OVO E-Wallet",
      icon: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
      fee: 1.5, // 1.5%
      feeType: "percent",
    },
    // Credit Cards - percentage fees
    // {
    //   method: "credit_card",
    //   channel: "visa",
    //   name: "VISA",
    //   description: "VISA Credit Card",
    //   icon: "https://via.placeholder.com/40",
    //   fee: 2.5, // 2.5%
    //   feeType: "percent",
    // },
    // {
    //   method: "credit_card",
    //   channel: "mastercard",
    //   name: "Mastercard",
    //   description: "Mastercard Credit Card",
    //   icon: "https://via.placeholder.com/40",
    //   fee: 2.5, // 2.5%
    //   feeType: "percent",
    // },
    // mitra pembayaran digital
    {
      method: "mitra_pembayaran_digital",
      channel: "tokopedia",
      name: "Tokkopedia",
      description: "Tokkopedia Non CC & Cicilan",
      icon: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Logo-Tokopedia.png",
      fee: 1.9, // 2.5%
      feeType: "percent",
    },
    {
      method: "mitra_pembayaran_digital",
      channel: "tokopedia_cc",
      name: "Tokkopedia CC",
      description: "Tokkopedia CC & Debit Online",
      icon: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Logo-Tokopedia.png",
      fee: 1.9, // 2.5%
      feeType: "percent",
    },
    {
      method: "mitra_pembayaran_digital",
      channel: "blibli",
      name: "Blibli",
      description: "Blibli CC & Non CC ",
      icon: "https://upload.wikimedia.org/wikipedia/commons/9/99/Logo-blibli-blue.svg",
      fee: 1.9, // 2.5%
      feeType: "percent",
    },
    {
      method: "mitra_pembayaran_digital",
      channel: "shopee",
      name: "Shopee",
      description: "Pembayaran via Shopee ",
      icon: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg",
      fee: 1.9, // 2.5%
      feeType: "percent",
    },
  ];

  // Order details
  const orderDetails = {
    subtotal: 250000,
    shipping: 15000,
    discount: 10000,
  };

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Filter methods based on active tab
  const filteredMethods =
    activeTab === "all"
      ? paymentMethods
      : paymentMethods.filter((method) => method.method === activeTab);

  // Calculate payment fee based on type
  const calculatePaymentFee = (method) => {
    if (!method) return 0;

    if (method.feeType === "percent") {
      return (form?.totalAfterDiskonDanOngkir * method.fee) / 100;
    }
    return method.fee;
  };

  // Calculate total including payment fee
  const calculateTotal = () => {
    const paymentFee = selectedMethod ? calculatePaymentFee(selectedMethod) : 0;
    return form?.totalAfterDiskonDanOngkir + paymentFee;
  };

  // Format fee display
  const formatFee = (method) => {
    if (method.feeType === "percent") {
      return `${method.fee}% (≈Rp${Math.round(
        calculatePaymentFee(method)
      ).toLocaleString()})`;
    }
    return `Rp${method.fee.toLocaleString()}`;
  };

  const handlePaymentSubmit = async () => {
    if (selectedMethod) {
      try {
        setLoading(true);
        const partner_number = form?.invoice_id?.split("-")?.[2];
        const createPartner = httpsCallable(functions, "createPartner");
        const response = await createPartner({
          name: form?.senderName,
          phone: form?.senderPhone,
          type: "client",
          number: partner_number,
        });
        console.log(response.data?.items?.data);

        // create transaction
        const ref_id = form?.invoice_id?.split("-")?.join("");
        const date = new Date(); // or your specific date
        const invoice_date = format(date, "yyyy-MM-dd");
        // Add 7 days
        const futureDate = addDays(date, 7);

        // Format to "yyyy-MM-dd"
        const invoice_due_date = format(futureDate, "yyyy-MM-dd");

        // invoice items update
        const invoice_items = form?.orders.flatMap((order) =>
          order.products.map((product) => ({
            name: product.nama || "",
            description: product.prod?.[0]?.description || "",
            quantity: product.quantity || 0,
            price: product.price || 0,
            discount: 0,
          }))
        );

        // disc
        const disc = form?.orders.flatMap((order) =>
          order.products.map((product) => ({
            discount: product?.discount,
          }))
        );
        const totalDiscount = disc.reduce(
          (sum, item) => sum + (item.discount || 0),
          0
        );

        const data = {
          transaction_details: {
            ref_id: ref_id,
          },
          total_amount: {
            payment_amount: form?.totalAfterDiskonDanOngkir,
            supplier_fee: 0,
            buyer_fee: 0,
          },
          partner: {
            partner_number: response.data?.items?.data?.number,
            company_name: response.data?.items?.data?.name,
            company_phone: response.data?.items?.data?.phone,
            // company_email: "whitewing.flute@gmail.com",
          },
          instant_payment: false,
          invoices: [
            {
              invoice_number: form?.invoice_id,
              invoice_date: invoice_date,
              invoice_due_date: invoice_due_date,
              amount:
                form?.totalHargaProduk +
                form?.additionalDiscount +
                totalDiscount +
                form?.totalOngkir,
              discount: form?.additionalDiscount + totalDiscount,
              delivery_fee: form?.totalOngkir,
              invoice_items: invoice_items,
            },
          ],
          payment_method: {
            method: selectedMethod?.method,
            channel: selectedMethod?.channel,
          },
          send: {
            email: false,
            whatsapp: false,
            sms: false,
          },
          additional_info: {},
        };

        const createTransaction = httpsCallable(functions, "createTransaction");
        const resTransaction = await createTransaction({
          data,
        });
        console.log(resTransaction.data);

        // save to firestore
        const docRef = doc(firestore, "orders", form?.invoice_id);
        await setDoc(
          docRef,
          {
            paper: resTransaction?.data?.items?.data ?? {},
            //   isInvWASent: true
          },
          { merge: true }
        );
        const targetUrl = `https://${resTransaction?.data?.items?.data?.payper_url}`;
        window.location.replace(targetUrl);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.log(e.message);
      }
      //   alert(`Processing payment with ${selectedMethod.name}`);
      // Here you would integrate with payment gateway
    }
  };

  const [redirectDialog, setRedirectDialog] = useState(false);
  useEffect(() => {
    if (form?.paper?.payper_url) {
      setRedirectDialog(true);
      //   const targetUrl = `https://${form?.paper?.payper_url}`;
      //   window.location.replace(targetUrl);
    }
  }, [form?.paper?.payper_url]);
  console.log(form);
  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Left Section - Payment Methods */}
        <div className="col-lg-8 mb-4 mb-lg-0">
          <div className="card border-success">
            <div className="card-body">
              <h2 className="card-title mb-4 text-success">Payment Method</h2>

              {/* Tabs Navigation */}
              <ul
                className="nav nav-pills mb-4 overflow-auto flex-nowrap"
                style={{ whiteSpace: "nowrap" }}
              >
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "all"
                        ? "bg-success text-white"
                        : "text-success"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Methods
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "virtual_account"
                        ? "bg-success text-white"
                        : "text-success"
                    }`}
                    onClick={() => setActiveTab("virtual_account")}
                  >
                    Virtual Account
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "e-wallet"
                        ? "bg-success text-white"
                        : "text-success"
                    }`}
                    onClick={() => setActiveTab("e-wallet")}
                  >
                    E-Wallet
                  </button>
                </li>
                {/* <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "credit_card"
                        ? "bg-success text-white"
                        : "text-success"
                    }`}
                    onClick={() => setActiveTab("credit_card")}
                  >
                    Credit Card
                  </button>
                </li> */}
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "qris"
                        ? "bg-success text-white"
                        : "text-success"
                    }`}
                    onClick={() => setActiveTab("qris")}
                  >
                    QRIS
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "mitra_pembayaran_digital"
                        ? "bg-success text-white"
                        : "text-success"
                    }`}
                    onClick={() => setActiveTab("mitra_pembayaran_digital")}
                  >
                    Mitra Pembayaran Digital
                  </button>
                </li>
              </ul>

              {/* Payment Methods List */}
              <div className="list-group">
                {filteredMethods.map((method) => (
                  <button
                    key={`${method.method}-${method.channel}`}
                    className={`list-group-item list-group-item-action 
                      ${
                        selectedMethod?.channel === method.channel
                          ? "bg-success text-white"
                          : "list-group-item-success"
                      }`}
                    onClick={() => setSelectedMethod(method)}
                  >
                    <div className="d-flex align-items-center">
                      <img
                        src={method.icon}
                        alt={method.name}
                        className={`rounded me-3 p-1 ${
                          selectedMethod?.channel === method.channel
                            ? "border border-white"
                            : "border border-success"
                        }`}
                        width="80"
                        height="40"
                      />
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{method.name}</h6>
                        <small
                          className={`${
                            selectedMethod?.channel === method.channel
                              ? "text-white"
                              : "text-muted"
                          }`}
                        >
                          {method.description}
                        </small>
                        {method.fee > 0 && (
                          <small
                            className={`d-block ${
                              selectedMethod?.channel === method.channel
                                ? "text-white"
                                : "text-muted"
                            }`}
                          >
                            Fee: {formatFee(method)}
                          </small>
                        )}
                      </div>
                      <input
                        type="radio"
                        checked={selectedMethod?.channel === method.channel}
                        onChange={() => setSelectedMethod(method)}
                        className={`form-check-input ms-2 ${
                          selectedMethod?.channel === method.channel
                            ? "border-white"
                            : "border-success"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Order Summary */}
        <div className="col-lg-4">
          <div
            className="card border-success sticky-top"
            style={{ top: "20px" }}
          >
            <div className="card-body">
              <h2 className="card-title mb-4 text-success">Order Summary</h2>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>
                    Rp
                    {(
                      form?.totalAfterDiskonDanOngkir - form?.totalOngkir
                    )?.toLocaleString()}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span>Rp{form?.totalOngkir?.toLocaleString()}</span>
                </div>
                {/* <div className="d-flex justify-content-between mb-2">
                  <span>Discount</span>
                  <span>-Rp{orderDetails.discount.toLocaleString()}</span>
                </div> */}
                {selectedMethod?.fee > 0 && (
                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      Payment Fee (
                      {selectedMethod.feeType === "percent"
                        ? `${selectedMethod.fee}%`
                        : "Fixed"}
                      )
                    </span>
                    <span>
                      Rp
                      {Math.round(
                        calculatePaymentFee(selectedMethod)
                      ).toLocaleString()}
                    </span>
                  </div>
                )}

                <hr className="my-3" />

                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span>Rp{Math.round(calculateTotal()).toLocaleString()}</span>
                </div>
              </div>

              <button
                className="btn btn-success w-100 py-3 mb-3"
                disabled={!selectedMethod || loading}
                onClick={handlePaymentSubmit}
              >
                {loading ? "Loading..." : "Pay Now"}
              </button>

              {selectedMethod && (
                <p className="text-muted small text-center mb-0">
                  You'll be redirected to {selectedMethod.name} payment page
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <RedirectDialog
        show={redirectDialog}
        handleClose={() => setRedirectDialog(false)}
        link={form?.paper?.payper_url}
      />
    </div>
  );
};

export default PaymentPage;
