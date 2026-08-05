import React, { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import Layout from "../../components/Layout";
import ProductReport from "./productReport";
// You can add other tab components later

const ReportPage = () => {
  const [activeTab, setActiveTab] = useState("product");

  return (
    <Layout>
    <div className="container">
      <h1 className="page-title">Report Dashboard</h1>
      <Tabs
        id="report-tabs"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mt-3"
      >
        <Tab eventKey="product" title="Product Report">
          <ProductReport />
        </Tab>

        <Tab eventKey="payment" title="Payment Report">
          <p>Coming soon...</p>
        </Tab>

        <Tab eventKey="delivery" title="Delivery Report">
          <p>Coming soon...</p>
        </Tab>
      </Tabs>
    </div>
    </Layout>
  );
};

export default ReportPage;
