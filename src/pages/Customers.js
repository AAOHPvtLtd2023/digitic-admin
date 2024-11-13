import React, { useEffect , useState} from "react";
import { Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../features/cutomers/customerSlice";
import firebase from 'firebase/compat/app';

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
    render: (text, record, index) => index + 1,

  },
  {
    title: "Name",
    dataIndex: "Name",
    // sorter: (a, b) => a.name.length - b.name.length,
  },
  {
    title: "Email",
    dataIndex: "Email",
  },
  {
    title: "Mobile",
    dataIndex: "mobile",
  },
];

const Customers = () => {
  const dispatch = useDispatch();
  const [data1, setdata] = useState([]);

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
        setdata(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };




    fetchData();
    dispatch(getUsers());
  }, []);
  // const customerstate = useSelector((state) => state.customer.customers);
  // const data2 = [];
  // for (let i = 0; i < customerstate.length; i++) {
  //   if (customerstate[i].role !== "admin") {
  //     data1.push({
  //       key: i + 1,
  //       name: customerstate[i].firstname + " " + customerstate[i].lastname,
  //       email: customerstate[i].email,
  //       mobile: customerstate[i].mobile,
  //     });
  //   }
  // }

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
