import React, { useEffect, useState } from "react";

import { Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAEnquiry,
  getEnquiries,
  resetState,
  updateAEnquiry,
} from "../features/enquiry/enquirySlice";
import { AiFillDelete, AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import CustomModal from "../components/CustomModal";
import firebase from 'firebase/compat/app';


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
        const querySnapshot = await db.collection("Enquary User").get();
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({
            key: doc.id,
            name: doc.data().Name,
            email: doc.data().Email,
            mobile: doc.data().mobile,
            Address: doc.data().Address
          });
        });
        setEnqData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };



    dispatch(resetState());
    fetchData();

  }, []);
 

  const setEnquiryStatus = (e, i) => {
    console.log(e, i);
    const data = { id: i, enqData: e };
    dispatch(updateAEnquiry(data));
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
