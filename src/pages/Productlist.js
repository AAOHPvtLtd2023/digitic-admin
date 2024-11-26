import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm } from "antd";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { toast } from "react-toastify";
import { db } from "./firebaase";
import ReactQuill from "react-quill";

const { Option } = Select;

const columns = (editProduct, deleteProduct) => [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Title",
    dataIndex: "title",
    sorter: (a, b) => a.title.length - b.title.length,
  },
  {
    title: "Rating",
    dataIndex: "rating",
    sorter: (a, b) => a.brand.length - b.brand.length,
  },
  {
    title: "Category",
    dataIndex: "category",
  },
  {
    title: "Reviews",
    dataIndex: "reviews",
  },
  {
    title: "Price",
    dataIndex: "price",
    sorter: (a, b) => a.price - b.price,
  },


  {
    title: "Action",
    dataIndex: "action",
    render: (_, record) => (
      <>
        <Button type="link" onClick={() => editProduct(record)}>
          Edit
        </Button>
        <Popconfirm
          title="Are you sure you want to delete this product?"
          onConfirm={() => deleteProduct(record.key, record.category)}
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

const Productlist = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [selectedImage, setSelectedImage] = useState(null); // Track selected image

  const fetchData = async () => {
    try {
      const db = firebase.firestore();
      const categoriesSnapshot = await db.collection("categories").get();
      const allProducts = [];
      const categoryList = [];

      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryName = categoryDoc.data().name;
        categoryList.push({ id: categoryDoc.id, name: categoryName });

        const productsSnapshot = await db
          .collection("categories")
          .doc(categoryDoc.id)
          .collection("products")
          .get();

        productsSnapshot.forEach((productDoc) => {
          const productData = productDoc.data();
          allProducts.push({
            key: productDoc.id,
            title: productData.title,
            productCount:productData.productCount,
            rating: productData.rating,
            category: categoryName,
            reviews: productData.reviews,
            price: productData.price,
            videoUrl: productData.videoURL,
            description: productData.description,
            specification: productData.specifications,
            photos: productData.photos || [], // Ensure photos array is included
          });
        });
      }

      // Update the state only once with the accumulated products and categories
      setData(allProducts);
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file); // Store the file for uploading
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteProduct = async (productId, categoryName) => {
    try {
      const db = firebase.firestore();
      const storage = firebase.storage();
      const category = categories.find((cat) => cat.name === categoryName);

      if (category) {
        // Delete the product document from Firestore
        await db
          .collection("categories")
          .doc(category.id)
          .collection("products")
          .doc(productId)
          .delete();

        // Delete the product photos folder from Firebase Storage
        const photoFolderRef = storage.ref().child(`product-photos/${productId}`);
        const photos = await photoFolderRef.listAll();

        // Delete each file in the product's photo folder
        for (const fileRef of photos.items) {
          await fileRef.delete();
        }

        // Update local state
        setData((prevData) => prevData.filter((item) => item.key !== productId));
      }
    } catch (error) {
      console.error("Error deleting product or photos:", error);
    }
  };

  const handlePhotoDelete = async (photoUrl) => {
    try {
      // Delete the photo from Firebase Storage
      const storageRef = firebase.storage().refFromURL(photoUrl);
      await storageRef.delete();

      // Remove photo from Firestore
      const productRef = firebase
        .firestore()
        .collection("categories")
        .doc(categories.find((cat) => cat.name === editingProduct.category)?.id)
        .collection("products")
        .doc(editingProduct.key);

      await productRef.update({
        photos: firebase.firestore.FieldValue.arrayRemove(photoUrl),
      });

      // Update local state
      setEditingProduct((prev) => ({
        ...prev,
        photos: prev.photos.filter((url) => url !== photoUrl),
      }));

      toast.success("Photo deleted successfully.");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo.");
    }
  };


  const showAddModal = () => {
    setIsEdit(false);
    setIsModalVisible(true);
    form.resetFields();
  };

  const showEditModal = (product) => {
    setIsEdit(true);
    setIsModalVisible(true);
    setEditingProduct(product); // Photos should already be part of the product object
    form.setFieldsValue({
      title: product.title,
      price: product.price,
      category: categories.find((cat) => cat.name === product.category)?.id,
      specification: product.specification || "",
      rating: product.rating,
      reviews: product.reviews,
      videoUrl: product.videoUrl || "",
      description: product.description || "",
    });
  };



  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
  };

  const handleAddOrEditProduct = async (values) => {

    const category = categories.find((cat) => cat.id === values.category);

    try {
      if (isEdit && editingProduct) {
        console.log(editingProduct.category);
        // Update product in Firestore
        const productRef = firebase.firestore()
          .collection("categories")
          .doc(values.category)
          .collection("products")
          .doc(editingProduct.key);

        const updatedProduct = {
          title: values.title,
          price: values.price,
          category: values.category,
          specifications: values.specification,
          rating: values.rating,
          reviews: values.reviews,
          videoURL: values.videoUrl,
          description: values.description,
        };

        // Upload new image if selected
        if (selectedImage) {
          const storageRef = firebase.storage().ref();
          const newPhotoRef = storageRef.child(`product-photos/${values.category}/${editingProduct.productCount}/${selectedImage.name}`);
          await newPhotoRef.put(selectedImage);
          const newPhotoUrl = await newPhotoRef.getDownloadURL();

          updatedProduct.photos = firebase.firestore.FieldValue.arrayUnion(newPhotoUrl);
        }

        await productRef.update(updatedProduct);

        // Update local state
        setData((prevData) =>
          prevData.map((item) =>
            item.key === editingProduct.key
              ? { ...item, ...updatedProduct, category: category.name }
              : item
          )
        );

        toast.success("Product updated successfully.");
      }
      else {
        if (!selectedImage) {
          toast.error("Please select an image to upload.");
          return;
        }

        try {
          const storageRef = firebase.storage().ref();
          const galleryImageRef = storageRef.child(`Die/${values.title}`);

          // Upload the selected image
          await galleryImageRef.put(selectedImage);

          // Get the download URL
          const downloadURL = await galleryImageRef.getDownloadURL();

          // Add the new image document to Firestore
          const newImageDoc = await db.collection('Die').add({
            title: values.title,
            price: values.price,
            url: downloadURL,
          });

          toast.success("Die uploaded successfully!");
        } catch (error) {
          console.error("Error uploading image: ", error);
          toast.error("Failed to upload Die.");
        }
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    }
    setIsModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
    setSelectedImage(null); // Reset the image selection
  };


  return (
    <div>
      <h3 className="mb-4 title">Products</h3>
      <Button type="primary" onClick={showAddModal}>
        Add Die
      </Button>
      <Modal
        title={isEdit ? "Edit Product" : "Add Die"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {isEdit ? (
          <Form form={form} onFinish={handleAddOrEditProduct} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter the product title' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: 'Please enter the product price' }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select>
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="specification"
              label="Specification"
              valuePropName="value"
              rules={[{ required: true, message: 'Please enter the product specification' }]}
            >
              <ReactQuill theme="snow" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              valuePropName="value"
              rules={[{ required: true, message: 'Please enter the product description' }]}
            >
              <ReactQuill theme="snow" />
            </Form.Item>

            <Form.Item
              name="rating"
              label="Ratings"
              rules={[{ required: true, message: 'Please enter the product ratings' }]}
            >
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item
              name="reviews"
              label="Reviews"
              rules={[{ required: true, message: 'Please enter the product Reviews' }]}
            >
              <InputNumber min={0} />
            </Form.Item>


            <Form.Item
              name="videoUrl"
              label="Video URL"
              rules={[{ required: true, message: 'Please enter the product Video URL' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Photos">
              {editingProduct?.photos && editingProduct.photos.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {editingProduct.photos.map((photoUrl, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
                        src={photoUrl}
                        alt="Product"
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <Button
                        danger
                        size="small"
                        style={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          zIndex: 1,
                          padding: '2px 6px',
                        }}
                        onClick={() => handlePhotoDelete(photoUrl)}
                      >
                        X
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No photos available for this product.</p>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Edit Product
              </Button>
            </Form.Item>
          </Form>) : (
          <Form form={form} onFinish={handleAddOrEditProduct} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter the product title' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: 'Please enter the product price' }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Add Die
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Table columns={columns(showEditModal, deleteProduct)} dataSource={data} />
    </div>
  );
};

export default Productlist;
