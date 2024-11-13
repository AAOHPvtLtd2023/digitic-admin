import React, { useEffect, useState } from "react";
import { Table, Modal, Input, Button } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import firebase from 'firebase/compat/app';
import CustomModal from "../components/CustomModal";

const Categorylist = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pCatId, setpCatId] = useState("");
  const [data1, setData] = useState([]);
  const [editName, setEditName] = useState("");

  const showModal = (id) => {
    setOpen(true);
    setpCatId(id);
  };

  const hideModal = () => {
    setOpen(false);
  };

  const showEditModal = (id, name) => {
    setEditOpen(true);
    setpCatId(id);
    setEditName(name);
  };

  const hideEditModal = () => {
    setEditOpen(false);
    setEditName("");
  };

  const handleEditSubmit = async () => {
    try {
      const db = firebase.firestore();
      await db.collection("categories").doc(pCatId).update({ name: editName });
      setData((prevData) =>
        prevData.map((item) =>
          item.key === pCatId ? { ...item, name: editName } : item
        )
      );
      hideEditModal();
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const deleteCategory = async () => {
    try {
      const db = firebase.firestore();
      await db.collection("categories").doc(pCatId).delete(); // Delete the document
      setData(data1.filter(item => item.key !== pCatId)); // Remove item from local state
      setOpen(false);
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const fetchData = async () => {
    try {
      const db = firebase.firestore();
      const querySnapshot = await db.collection("categories").get();
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({
          key: doc.id,
          name: doc.data().name,
        });
      });
      setData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      title: "Actions",
      render: (text, record) => (
        <div>
          <BiEdit
            style={{ cursor: "pointer", marginRight: 10, fontSize:'20px'}}
            onClick={() => showEditModal(record.key, record.name)}
          />
          <AiFillDelete
            style={{ cursor: "pointer", fontSize:'20px',color:'red' }}
            onClick={() => showModal(record.key)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <h3 className="mb-4 title">Product Categories</h3>
      <div>
        <Table columns={columns} dataSource={data1} />
      </div>
      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={deleteCategory}
        title="Are you sure you want to delete this Product Category?"
      />
      <Modal
        title="Edit Category Name"
        visible={editOpen}
        onCancel={hideEditModal}
        footer={[
          <Button key="cancel" onClick={hideEditModal}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleEditSubmit}>
            Save
          </Button>,
        ]}
      >
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Enter new category name"
        />
      </Modal>
    </div>
  );
};

export default Categorylist;
