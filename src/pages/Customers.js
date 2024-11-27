import React, { useEffect, useState } from "react";
import { Table, Button } from "antd";
import firebase from "firebase/compat/app";
import { FaWhatsapp } from "react-icons/fa"; // Import WhatsApp icon

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
    render: (text, record, index) => index + 1,
  },
  {
    title: "Name",
    dataIndex: "Name",
  },
  {
    title: "Email",
    dataIndex: "Email",
  },
  {
    title: "Mobile",
    dataIndex: "mobile",
  },
  {
    title: "Actions",
    dataIndex: "actions",
    render: (_, record) => (
      <Button
        type="primary"
        style={{
          backgroundColor: "#25D366",
          borderColor: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => window.open(`https://wa.me/${record.mobile}`, "_blank")}
        icon={<FaWhatsapp style={{ fontSize: "16px", color: "white" }} />}
      />
    ),
  },
];

const Customers = () => {
  const [data1, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection("Contacted User").get();
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({
            key: doc.id,
            Name: doc.data().Name,
            Email: doc.data().Email,
            mobile: doc.data().mobile,
          });
        });
        setData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h3 className="mb-4 title">Customers</h3>
      <div>
        <Table columns={columns} dataSource={data1} />
      </div>
    </div>
  );
};

export default Customers;
