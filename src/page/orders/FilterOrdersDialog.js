import { set } from "date-fns";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Autocomplete from "react-autocomplete";
import { Modal, Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { firestore } from "../../FirebaseFrovider";
// import { firestore } from './FirebaseFrovider';

export const FilterDialog = ({
  show,
  handleClose,
  setList,
  dateTimestamp,
  setAllOrders,
  setAllFilters,
  currentUser,
}) => {
  const [user, setUser] = useState([]);
  const [checkedItems, setCheckedItems] = useState("");
  const [value, setValue] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shippingDate, setShippingDate] = useState(null);
  const [endShippingDate, setEndShippingDate] = useState(null);
  const handleSelect = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    // if (start && end) {
    //     filterByDate(start, end)

    // }
  };
  // console.log(currentUser)
  const handleSelectShippingDate = (dates) => {
    const [start, end] = dates;
    setShippingDate(start);
    setEndShippingDate(end);
    // if (start && end) {
    //     filterByDate(start, end)

    // }
  };
  const handleChange = (e) => {
    const { name, checked } = e.target;
    setCheckedItems(name);
  };
  const handleChangeValue = (e) => {
    const { value } = e.target;
    setValue(value);
  };
  const [loading, setLoading] = useState(false);
  const handleFilter = async () => {
    setLoading(true);
    try {
      const findDataUser = user?.find(
        (usr) => usr?.userId === currentUser?.uid
      );

      const filters = [];
      if (findDataUser?.rules === "agen") {
        filters.push(where("warehouse", "==", findDataUser?.warehouse));
      }
      if (checkedItems) {
        filters.push(where("paymentStatus", "==", checkedItems));
      }
      if (selectedUser) {
        filters.push(where("userId", "==", selectedUser.userId));
      }
      if (dateTimestamp?.start && dateTimestamp?.end) {
        filters.push(
          where("createdAt", ">=", dateTimestamp?.start),
          where("createdAt", "<=", dateTimestamp?.end)
        );
      }
      if (startDate && endDate) {
        const yearStart = startDate.getFullYear();
        const monthStart = String(startDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const dayStart = String(startDate.getDate()).padStart(2, "0");
        const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
        // end
        const yearEnd = endDate.getFullYear();
        const monthEnd = String(endDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const dayEnd = String(endDate.getDate()).padStart(2, "0");
        const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
        //
        const startTimestamp = Timestamp.fromDate(new Date(formattedDateStart));
        const endTimestamp = Timestamp.fromDate(
          set(new Date(formattedDateEnd), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          })
        );
        filters.push(
          where("paidDate", ">=", startTimestamp),
          where("paidDate", "<=", endTimestamp)
        );
      }
      if (shippingDate && endShippingDate) {
        const yearStart = shippingDate?.getFullYear();
        const monthStart = String(shippingDate?.getMonth() + 1).padStart(
          2,
          "0"
        ); // Months are 0-based
        const dayStart = String(shippingDate?.getDate()).padStart(2, "0");
        const formattedDate = `${yearStart}-${monthStart}-${dayStart}`;
        const shippingTimestamp = Timestamp.fromDate(new Date(formattedDate));

        // end
        // end
        const yearEnd = endShippingDate.getFullYear();
        const monthEnd = String(endShippingDate.getMonth() + 1).padStart(
          2,
          "0"
        ); // Months are 0-based
        const dayEnd = String(endShippingDate.getDate()).padStart(2, "0");
        const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
        const endShippingTimestamp = Timestamp.fromDate(
          set(new Date(formattedDateEnd), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          })
        );
        filters.push(
          where("shippingDate", ">=", shippingTimestamp),
          where("shippingDate", "<=", endShippingTimestamp)
        );
      }
      setAllFilters(filters);
      const ref = query(
        collection(firestore, "orders"),
        ...filters,
        orderBy("createdAt", "desc")
        // where("createdAt", ">=", startTimestamp),
        // where("createdAt", "<=", endTimestamp)
      );
      // console.log(filters)
      // const querySnapshot = await getDocs(ref);
      const unsubscribe = onSnapshot(ref, (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setList(updatedData); // Update the state with the new data
        setAllOrders(updatedData);
        handleClose();
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.log(e.message);
    }
    setLoading(false);
  };

  const handleClearFilter = async () => {
    try {
      const ref = query(
        collection(firestore, "orders")
        // where("createdAt", ">=", startTimestamp),
        // where("createdAt", "<=", endTimestamp)
      );
      // console.log(filters)
      const querySnapshot = await getDocs(ref);
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // console.log()
      setList(documents);
      handleClose();
    } catch (e) {
      console.log(e.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const getDoc = query(collection(firestore, "users"));
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      // console.log('first item ', items[0])
      setUser(items);
    };
    fetchData();
  }, []);

  // console.log(selectedUser)
  return (
    <Modal
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
      show={show}
      onHide={handleClose}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Filter Orders</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Label>By Payment Status</Form.Label>
          <Form.Check
            type="checkbox"
            label="Paid / Settlement"
            name="settlement"
            checked={checkedItems === "settlement"}
            onChange={handleChange}
          />
          <Form.Check
            type="checkbox"
            label="Pending"
            name="pending"
            checked={checkedItems === "pending"}
            onChange={handleChange}
          />
          <Form.Check
            type="checkbox"
            label="Expired"
            name="expire"
            checked={checkedItems === "expire"}
            onChange={handleChange}
          />
          <Form.Label style={{ marginTop: "20px" }}>By User/Sales</Form.Label>
          <Autocomplete
            wrapperProps={{ style: { display: "block" } }}
            getItemValue={(item) => item?.firstName}
            items={user}
            renderItem={(item, isHighlighted) => (
              <div
                style={{ background: isHighlighted ? "lightgray" : "white" }}
              >
                {item.firstName}
              </div>
            )}
            fullWidth
            value={value}
            onChange={(e) => {
              // console.log(e.target.value)
              setValue(e.target.value);
            }}
            renderInput={(props) => (
              <Form.Control
                className="input"
                // style={{ width: '100%', display: 'inline' }}

                {...props}
                placeholder="Cari Nama User/Sales"
              />
            )}
            renderMenu={(items, value) => (
              <div>
                {items.length === 0 ? `No matches for ${value}` : items}
              </div>
            )}
            onSelect={(val, items) => {
              // console.log(items)
              setValue(val);
              setSelectedUser(
                user.find((item) => item.userId === items.userId)
              );

              // setSelected(item)
            }}
          />
        </Form>
        <p style={{ marginTop: "20px" }}>Filter by Paid date</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <DatePicker
            dateFormat="dd/MM/yyyy"
            style={{ borderRadius: "10px" }}
            selected={startDate}
            onChange={handleSelect}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            showIcon
            // icon
            // inline
          />
        </div>
        <p style={{ marginTop: "20px" }}>Filter by Shipping Date</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <DatePicker
            dateFormat="dd/MM/yyyy"
            style={{ borderRadius: "10px" }}
            selected={shippingDate}
            onChange={handleSelectShippingDate}
            startDate={shippingDate}
            endDate={endShippingDate}
            selectsRange
            showIcon
            // icon
            // inline
          />
        </div>
      </Modal.Body>
      <Modal.Footer style={{ display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            style={{ marginRight: "10px" }}
            disabled={
              !value && !checkedItems && !startDate && !endDate && !shippingDate
            }
            variant="secondary"
            onClick={() => {
              setValue("");
              setCheckedItems("");
              setSelectedUser(null);
              setEndDate(null);
              setStartDate(null);
              setShippingDate(null);
              setEndShippingDate(null);
              // handleClearFilter()
            }}
          >
            Clear
          </Button>
          <Button disabled={loading} onClick={handleFilter}>
            {`${loading ? "loading" : "Filter"}`}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
