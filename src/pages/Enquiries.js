import React, { useEffect, useState } from "react";
import { Table, Button } from "antd";
import { useDispatch } from "react-redux";
import {
  deleteAEnquiry,
  getEnquiries,
  resetState,
  updateAEnquiry,
} from "../features/enquiry/enquirySlice";
import CustomModal from "../components/CustomModal";
import firebase from "firebase/compat/app";

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
    render: (text, record, index) => index + 1,
  },
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Mobile",
    dataIndex: "mobile",
  },
  {
    title: "Address",
    dataIndex: "Address",
  },
];

const Enquiries = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [enqId, setenqId] = useState("");
  const [enqData, setEnqData] = useState([]);

  const showModal = (e) => {
    setOpen(true);
    setenqId(e);
  };

  const hideModal = () => {
    setOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection("enquiry").get();
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({
            key: doc.id,
            name: doc.data().Name,
            email: doc.data().Email,
            mobile: doc.data().mobile,
            Address: doc.data().Address,
          });
        });
        setEnqData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    dispatch(resetState());
    fetchData();
  }, [dispatch]);

  const exportToCSV = () => {
    const headers = ["SNo,Name,Mobile,Address"];
    const rows = enqData.map((item, index) =>
      `${index + 1},${item.name},${item.mobile},${item.Address}`
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Enquiries.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteEnq = (e) => {
    dispatch(deleteAEnquiry(e));
    setOpen(false);
    setTimeout(() => {
      dispatch(getEnquiries());
    }, 100);
  };

  return (
    <div>
      <h3 className="mb-4 title">Enquiries</h3>
      <div className="d-flex justify-content-between mb-3">
        <Button type="primary" onClick={exportToCSV}>
          Export to CSV
        </Button>
      </div>
      <div>
        <Table columns={columns} dataSource={enqData} />
      </div>
      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => {
          deleteEnq(enqId);
        }}
        title="Are you sure you want to delete this enquiry?"
      />
    </div>
  );
};

export default Enquiries;
