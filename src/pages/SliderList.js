import React, { useEffect, useState } from "react";
import { Button, Popconfirm, Table } from "antd";
import CustomModal from "../components/CustomModal";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const SliderList = () => {
  const [slider, setSlider] = useState([]);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const db = firebase.firestore();
        const photos = [];

        const sliderSnapshot = await db.collection("slider").get();

        sliderSnapshot.forEach((sliderDoc) => {
          const sliderData = sliderDoc.data();
          photos.push({
            key: sliderDoc.id,
            name: sliderData.title || "Untitled",
            photo: sliderData.photo || "",
          });
        });

        setSlider(photos);
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      }
    };

    fetchGalleryImages();
  }, []);

  const handleDelete = async (record) => {
    try {
      const db = firebase.firestore();
      const storage = firebase.storage();
  
      // Delete the image from storage
      if (record.photo) {
        const photoRef = storage.refFromURL(record.photo);
        await photoRef.delete();
      }
  
      // Delete the document from Firestore
      await db.collection("slider").doc(record.key).delete();
  
      // Update state
      setSlider((prevSlider) => prevSlider.filter((item) => item.key !== record.key));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  

  const columns = [
    {
      title: "ID",
      dataIndex: "key",
    },
    {
      title: "Title",
      dataIndex: "name",
    },
    {
      title: "Photos",
      dataIndex: "photo",
      render: (photo) => (
        photo ? (
          <img
            src={photo}
            alt="Slider"
            style={{
              width: "100px",
              height: "auto",
              borderRadius: "5px",
              objectFit: "cover",
            }}
          />
        ) : (
          "No Image"
        )
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <>
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <h3 className="mb-4 title">Slider List</h3>
      <div>
        <Table columns={columns} dataSource={slider} rowKey="key" />
      </div>
    </div>
  );
};

export default SliderList;
