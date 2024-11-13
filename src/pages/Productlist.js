import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm } from "antd";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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
    title: "Brand",
    dataIndex: "brand",
    sorter: (a, b) => a.brand.length - b.brand.length,
  },
  {
    title: "Category",
    dataIndex: "category",
  },
  {
    title: "Color",
    dataIndex: "color",
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
            brand: productData.brand,
            category: categoryName,
            color: productData.color,
            price: productData.price,
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


  useEffect(() => {
    fetchData();
  }, []);

  const deleteProduct = async (productId, categoryName) => {
    try {
      const category = categories.find((cat) => cat.name === categoryName);
      if (category) {
        await firebase.firestore()
          .collection("categories")
          .doc(category.id)
          .collection("products")
          .doc(productId)
          .delete();

        setData((prevData) => prevData.filter((item) => item.key !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
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
    setEditingProduct(product);
    form.setFieldsValue({
      title: product.title,
      price: product.price,
      category: categories.find((cat) => cat.name === product.category)?.id,
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
  };

  const handleAddOrEditProduct = async (values) => {
    const category = categories.find((cat) => cat.id === values.category);

    if (isEdit && editingProduct) {
      // Update product in Firestore
      await firebase.firestore()
        .collection("categories")
        .doc(values.category)
        .collection("products")
        .doc(editingProduct.key)
        .update({
          title: values.title,
          price: values.price,
        });

      setData((prevData) =>
        prevData.map((item) =>
          item.key === editingProduct.key
            ? { ...item, ...values, category: category.name }
            : item
        )
      );
    } else {
      // Add new product to Firestore
      const newProductRef = await firebase.firestore()
        .collection("categories")
        .doc(values.category)
        .collection("products")
        .add({
          title: values.title,
          price: values.price,
        });

      setData((prevData) => [
        ...prevData,
        {
          key: newProductRef.id,
          title: values.title,
          category: category.name,
          price: values.price,
        },
      ]);
    }

    setIsModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
  };

  return (
    <div>
      <h3 className="mb-4 title">Products</h3>
      <Button type="primary" onClick={showAddModal}>
        Add Product
      </Button>
      <Modal
        title={isEdit ? "Edit Product" : "Add New Product"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
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
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {isEdit ? "Update Product" : "Add Product"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Table columns={columns(showEditModal, deleteProduct)} dataSource={data} />
    </div>
  );
};

export default Productlist;
