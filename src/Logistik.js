import React, { useEffect, useState } from 'react';
import Header from './Header';
import { Button, ButtonGroup, Card, Col, Form, Row, Table } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { collection, endBefore, getDocs, limit, limitToLast, orderBy, query, startAfter, Timestamp, where } from 'firebase/firestore';
import { firestore } from './FirebaseFrovider';
import { format, set } from 'date-fns';
import { formatOrders } from './LogisticFormatted';
import { currency, formatToDate } from './formatter';
import { BoxFill, GraphUp, PeopleFill, Truck } from 'react-bootstrap-icons';



const getRasioColor = (rasio) => {
  if (rasio === "100%") return "table-success ";
  if (rasio !== "100%") return "table-danger ";
  return "";
};
const Logistik = () => {
  const [allOrders, setAllOrders] = useState([])
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [year, setYear] = useState('2024')
  const [page, setPage] = useState(1);
  const [length, setLength] = useState(20);
  const listLength = [5, 10, 20, 50];
  const handleChangeLength = (e) => {
    setLength(e.target.value)
    if (startDate && endDate) {
      // console.log('run')
      filterByDate(startDate, endDate, e.target.value)
    }
    setCurrentPage(1)
  }
  useEffect(() => {
    if (!endDate) {
      const fetchData = async () => {
        const startOfYear = Timestamp.fromDate(new Date(`${year}-01-01T00:00:00.000Z`)); // Millisecond precision
        const endOfYear = Timestamp.fromDate(new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`));
        console.log(endOfYear.toDate())
        const getDoc = query(collection(firestore, "orders"),
          where("createdAt", ">=", startOfYear),
          where("createdAt", "<", endOfYear),
          orderBy("createdAt", "asc"));
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        // console.log('first item ', items[0])
        setAllOrders(items);
      };
      fetchData();
    }
  }, [length, year]);

  const showNext = ({ item }) => {
    if (allOrders.length === 0) {
      alert("Thats all we have for now !")
    } else {
      const fetchNextData = async () => {
        const getDoc = query(collection(firestore, "orders"), orderBy("createdAt", "desc"), startAfter(item.createdAt), limit(length));
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        setAllOrders(items);
        setPage(page + 1)
      };
      fetchNextData();
    }
  };

  const showPrevious = ({ item }) => {
    const fetchPreviousData = async () => {
      const getDoc = query(collection(firestore, "orders"), orderBy("createdAt", "asc"), endBefore(item.createdAt), limitToLast(length));
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      setAllOrders(items);
      setPage(page - 1)
    };
    fetchPreviousData();
  };
  const filterByDate = async (start, end, panjang) => {
    try {
      const yearStart = start.getFullYear();
      const monthStart = String(start.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayStart = String(start.getDate()).padStart(2, '0');
      const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
      // end
      const yearEnd = end.getFullYear();
      const monthEnd = String(end.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayEnd = String(end.getDate()).padStart(2, '0');
      const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
      // 
      const startTimestamp = Timestamp.fromDate(new Date(formattedDateStart));
      const endTimestamp = Timestamp.fromDate(set(new Date(formattedDateEnd), {
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999

      }));
      // orders
      const refOrd = query(collection(firestore, "orders"), where("createdAt", ">=", startTimestamp), where("createdAt", "<=", endTimestamp), orderBy('createdAt', 'desc'));
      const querySnapshotOrd = await getDocs(refOrd);
      const documentsOrd = querySnapshotOrd.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllOrders(documentsOrd)
    } catch (e) {
      console.log(e.message)
    }
  }

  const handleSelect = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      filterByDate(start, end, length)

    }
  };


  // format order
  let mapData = []
  const reBuildData = allOrders?.map?.((item) => {
    // console.log(JSON.stringify(item?.invoices))

    return item?.orders?.map((ord, i) => {
      // const discount = ord?.products?.map(prod => prod?.discount);
      // const allDiscount = discount?.reduce((val, nilaiSekarang) => {
      //   return val + nilaiSekarang
      // }, 0);
      const gross = ord?.products?.map(prod => prod?.amount);
      const allGross = gross?.reduce((val, nilaiSekarang) => {
        return val + nilaiSekarang
      }, 0);
      // const calculate = allGross + ord?.ongkir;

      // find user
      // const userData = user.find(itm => itm.userId === item.userId)
      mapData.push({
        // quantity: ord?.products?.map(prod => `${prod?.quantity}, `),
        createdAt: item?.createdAt,
        kurir: ord?.kurir === "Biteship" ? ord?.kurirService?.courier_name : ord?.kurir === "Manual" ? 'Dedicated' : ord?.kurir,
        ongkir: ord?.ongkir || 0,
        harga: allGross,
        ordId: ord?.ordId,
        resi: ord?.resi
        // sales: `${userData?.firstName || ''} ${userData?.lastName || ''}`

      })

    })
  })
  const formattedOrders = mapData.map((all) => {

    return { ...all, tgl: formatToDate(all.shippingDate ? all.shippingDate?.toDate() : all?.createdAt.toDate()), month: all?.createdAt.toDate().toLocaleString('default', { month: 'long', year: 'numeric' }) }
  })

  const groupedDataAll = formattedOrders.reduce((acc, item) => {
    const key = item.month;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const formattedOrd = Object.entries(groupedDataAll).map((arr) => {
    const month = arr?.[0];
    const ordObj = arr?.[1]?.reduce((acc, item) => {
      const key = item.tgl;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
    return {
      month: month,
      item: [...Object.entries(ordObj)]
    }
  })
  const fixedFormatOrd = formattedOrd?.map((ord) => {
    const item = ord?.item?.map?.((itm) => {
      return {
        date: itm?.[0],
        item: itm?.[1]
      }
    })
    return {
      month: ord.month,
      item: item
    }
  });

  const totalSent = mapData.filter(item => item?.resi)
  const arrayOngkir = mapData.map(item => parseInt(item?.ongkir))
  const totalOngkir = arrayOngkir?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0);
  // console.log(allOrders);
  // console.log(fixedFormatOrd)

  // newPagniation
  const [currentPage, setCurrentPage] = useState(1);
  // const length = 10; // Number of items you want to display per page

  // Calculate the start and end index for the items on the current page
  const startIndex = (currentPage - 1) * length;
  const endIndex = currentPage * length;

  // Slice the items array to get only the items for the current page

  // Calculate total pages

  let allData = []
  fixedFormatOrd.map((data, idx) => (
    data.item.map((row, rowIdx) => {
      allData.push({ ...row, month: data.month })
    })))
  // console.log(totalOngkir)
  const currentItems = allData.slice(startIndex, endIndex);

  const totalPages = Math.ceil(allData.length / length);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  let renderedMonths = {};
  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Logistik</h1>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        {/* <div className="form-group" style={{ width: '100%' }}> */}
        {/* <Form.Label className="label">Year:</Form.Label> */}
        <select style={{ width: '200px' }} name='year' className="input" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {[...Array(121)].map((_, i) => (
            <option key={i} value={2024 + i}>{2024 + i}</option>
          ))}
        </select>
        {/* </div> */}
      </div>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Total Order
                </div>
                <div style={{ backgroundColor: 'rgb(229 228 255)', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <PeopleFill color="#8280FF" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{mapData?.length}</h3>
                {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Sent Order
                </div>
                <div style={{ backgroundColor: 'rgb(255 243 217)', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <BoxFill color="#FEC53D" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{totalSent?.length}</h3>
                {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Sent Ratio
                </div>
                <div style={{ backgroundColor: '#d9f7e8', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <GraphUp color="#4AD991" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{parseFloat(((totalSent.length / mapData.length) * 100).toFixed(2))}%</h3>
                {/* <small className="text-danger">↓ 4.3% Down from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Shipping Cost
                </div>
                <div style={{ backgroundColor: '#ffded1', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Truck color="#FF9066" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{currency(totalOngkir)}</h3>
                {/* <small className="text-danger">↓ 4.3% Unpaid</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Table bordered hover style={{ fontSize: '10px' }}>
        <thead>
          <tr style={{ textAlign: 'center' }}>
            <th colSpan="5">Paxel</th>
            <th colSpan="4">SAP</th>
            <th colSpan="4">Lalamove</th>
            <th colSpan="4">Dedicated</th>

          </tr>
          <tr>
            <th>Date</th>
            <th>Total Order</th>
            <th>Sent Order</th>
            <th>Ratio</th>
            <th>Shipping Cost</th>
            <th>Total Order</th>
            <th>Sent Order</th>
            <th>Ratio</th>
            <th>Shipping Cost</th>
            <th>Total Order</th>
            <th>Sent Order</th>
            <th>Ratio</th>
            <th>Shipping Cost</th>
            <th>Total Order</th>
            <th>Sent Order</th>
            <th>Ratio</th>
            <th>Shipping Cost</th>

          </tr>
        </thead>

        {allData?.map((row, rowIdx) => {
          const findByCourierDed = row.item.filter(item => item?.kurir === "Dedicated")
          const dedSent = findByCourierDed?.filter(item => item?.resi && item?.resi)
          const ongkirDed = findByCourierDed?.map((pax) => parseInt(pax?.ongkir))
          const totOngDed = ongkirDed?.reduce((val, nilaiSekarang) => {
            return val + nilaiSekarang
          }, 0);
          const rasioDed = parseFloat(((dedSent?.length / findByCourierDed?.length) * 100).toFixed(2))
          // sap
          const findByCourierSAP = row.item.filter(item => item?.kurir === "SAP")
          const sapSent = findByCourierSAP?.filter(item => item?.resi && item?.resi)
          const ongkirSap = findByCourierSAP?.map((pax) => pax?.ongkir)
          const totOngSap = ongkirSap?.reduce((val, nilaiSekarang) => {
            return val + nilaiSekarang
          }, 0);
          const rasioSap = parseFloat(((sapSent?.length / findByCourierSAP?.length) * 100).toFixed(2))
          // paxel
          const findByCourierPaxel = row.item.filter(item => item?.kurir === "Paxel")
          const paxelSent = findByCourierPaxel?.filter(item => item?.resi && item?.resi)
          const ongkirPaxel = findByCourierPaxel?.map((pax) => pax?.ongkir)
          const totOngPax = ongkirPaxel?.reduce((val, nilaiSekarang) => {
            return val + nilaiSekarang
          }, 0);
          const rasioPax = parseFloat(((paxelSent?.length / findByCourierPaxel?.length) * 100).toFixed(2))
          // lalamove
          const findByCourierLalamove = row.item.filter(item => item?.kurir === "Lalamove")
          const lalamoveSent = findByCourierLalamove?.filter(item => item?.resi && item?.resi)
          const ongkirLa = findByCourierLalamove?.map((pax) => pax?.ongkir)
          const totOngLa = ongkirLa?.reduce((val, nilaiSekarang) => {
            return val + nilaiSekarang
          }, 0);
          const rasioLa = parseFloat(((lalamoveSent?.length / findByCourierLalamove?.length) * 100).toFixed(2))
          // console.log(findByCourier)
          // render month one time
          const shouldRenderMonth = !renderedMonths[row.month];
          renderedMonths[row.month] = true;
          return <tbody key={rowIdx}>
            {shouldRenderMonth &&
              <tr className="bg-success text-white">
                <td className="bg-success text-white" colSpan="17">{row.month}</td>
              </tr>
            }
            <tr>
              <td>{row?.date}</td>
              <td>{findByCourierPaxel?.length}</td>
              <td>{paxelSent?.length || 0}</td>
              <td className={getRasioColor(rasioPax ? `${rasioPax}%` : '0%')}>{rasioPax ? `${rasioPax}%` : '0%'}</td>
              <td style={{ borderRight: '2px solid #1a8754' }}>{currency(totOngPax)}</td>
              <td>{findByCourierSAP?.length}</td>
              <td>{sapSent?.length}</td>
              <td className={getRasioColor(rasioSap ? `${rasioSap}%` : '0%')}>{rasioSap ? `${rasioSap}%` : '0%'}</td>
              <td style={{ borderRight: '2px solid #1a8754' }}>{currency(totOngSap)}</td>
              <td>{findByCourierLalamove?.length}</td>
              <td>{lalamoveSent?.length}</td>
              <td className={getRasioColor(rasioLa ? `${rasioLa}%` : '0%')}>{rasioLa ? `${rasioLa}%` : '0%'}</td>
              <td style={{ borderRight: '2px solid #1a8754' }}>{currency(totOngLa)}</td>
              <td>{findByCourierDed?.length}</td>
              <td>{dedSent?.length}</td>
              <td className={getRasioColor(rasioDed ? `${rasioDed}%` : '0%')}>{rasioDed ? `${rasioDed}%` : '0%'}</td>
              <td>{currency(totOngDed)}</td>


            </tr></tbody>

        })}

      </Table>
      {/* <ButtonGroup style={{ textAlign: 'center', float: 'right' }}>
        <div>
          <Form.Select style={{
            width: 'auto',
            marginTop: '10px',
            marginRight: '10px',
          }} defaultChecked={false} className="select" name="length" onChange={handleChangeLength} value={length}>
           

            {
              listLength?.map((kur) => {
                return <option value={kur}>{kur} Rows </option>
              })
            }
          </Form.Select>
        </div>
        <Button style={{ marginRight: '10px', whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={handlePreviousPage} disabled={currentPage === 1}>{'<-Prev'}</Button>
        <input value={currentPage} className="input" disabled style={{
          padding: '0px',
          width: '40px',
          marginRight: '10px',
          textAlign: 'center',
          border: 'none',
          marginBottom: '8px',
          marginTop: '8px'
        }} />
        <Button style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={handleNextPage} disabled={currentPage === totalPages}>{'Next->'}</Button>
      </ButtonGroup> */}
    </div>
  );
};

export default Logistik;